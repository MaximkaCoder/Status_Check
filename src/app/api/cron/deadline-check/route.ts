import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage, itemLink } from "@/lib/telegram";
import { sendEmail, notificationEmail } from "@/lib/email";

export const runtime = "nodejs";

const DEFAULT_THRESHOLDS = [24];

function dayLabel(hours: number): string {
  if (hours < 24) return `${hours} год`;
  const days = Math.round(hours / 24);
  const mod10 = days % 10;
  const mod100 = days % 100;
  let word = "днів";
  if (mod10 === 1 && mod100 !== 11) word = "день";
  else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) word = "дні";
  return `${days} ${word}`;
}

// Deadline reminders use a "due & unsent" model rather than a time window:
// a threshold is DUE when the deadline is within that many hours, and it fires
// once (deduped by a Notification row carrying thresholdHours). This is
// gap-free regardless of how often the cron runs — a run that is late, or the
// first run after downtime, still catches every due-but-unsent threshold. Run
// the cron every ~15 min (see the cron sidecar in docker-compose) for timely
// delivery; less frequent just means reminders arrive a little later.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Purge soft-deleted items older than 30 days
  const purged = await prisma.statusItem.deleteMany({
    where: { deleted_at: { lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } },
  });

  // Items with an upcoming deadline (up to 1 week ahead)
  const maxAhead = new Date(now.getTime() + 168 * 60 * 60 * 1000);
  const items = await prisma.statusItem.findMany({
    where: {
      deadline: { gt: now, lt: maxAhead },
      status: { notIn: ["DONE", "NOT_ACTUAL"] },
      deleted_at: null,
    },
    select: { id: true, title: true, assignee: true, reviewer: true, deadline: true },
  });

  let created = 0;
  let sent = 0;

  for (const item of items) {
    if (!item.deadline) continue;
    const msUntilDeadline = item.deadline.getTime() - now.getTime();

    const names = [...new Set([item.assignee, item.reviewer].filter(Boolean) as string[])];

    for (const name of names) {
      const user = await prisma.user.findFirst({
        where: { name, blocked: false },
        select: {
          id: true,
          email: true,
          settings: { select: { telegramChatId: true, notifyVia: true, deadlineHours: true } },
        },
      });
      if (!user) continue;

      const thresholds = (user.settings?.deadlineHours?.length
        ? user.settings.deadlineHours
        : DEFAULT_THRESHOLDS
      ).slice().sort((a, b) => a - b); // ascending: most urgent first

      // Which thresholds are already sent for this user+item?
      const priorRows = await prisma.notification.findMany({
        where: { userId: user.id, itemId: item.id, type: "DEADLINE_APPROACHING" },
        select: { thresholdHours: true },
      });
      const alreadySent = new Set(priorRows.map((r) => r.thresholdHours));

      // Thresholds that are due now (deadline within X hours) and not yet sent
      const dueUnsent = thresholds.filter(
        (h) => msUntilDeadline <= h * 60 * 60 * 1000 && !alreadySent.has(h),
      );
      if (dueUnsent.length === 0) continue;

      // Notify once with the most urgent (smallest) due threshold's label...
      const label = dueUnsent[0];
      const notifyVia = user.settings?.notifyVia ?? ["app"];

      // ...but record ALL newly-due thresholds so stale ones can't fire later
      // (e.g. after downtime both the 24h and 6h thresholds may be due at once).
      // The Notification row is both the in-app item and the dedup marker, so it
      // is always written — even for telegram-only users — to prevent re-sends.
      for (const h of dueUnsent) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: "DEADLINE_APPROACHING",
            itemId: item.id,
            itemTitle: item.title,
            thresholdHours: h,
          },
        });
        created++;
      }

      if (notifyVia.includes("telegram") || notifyVia.includes("email")) {
        const deadlineStr = item.deadline.toLocaleString("uk-UA", {
          day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
        });
        const text =
          `⏰ <b>Нагадування про дедлайн</b>\n\n` +
          `Задача: ${itemLink(item.id, item.title)}\n` +
          `Залишилось: <b>менше ${dayLabel(label)}</b>\n` +
          `Дедлайн: ${deadlineStr}`;

        if (notifyVia.includes("telegram") && user.settings?.telegramChatId) {
          const ok = await sendTelegramMessage(user.settings.telegramChatId, text);
          if (ok) sent++;
        }
        if (notifyVia.includes("email") && user.email) {
          const { subject, html } = notificationEmail(text);
          const ok = await sendEmail({ to: user.email, subject, html });
          if (ok) sent++;
        }
      }
    }
  }

  return NextResponse.json({ ok: true, created, sent, checked: items.length, purged: purged.count });
}
