import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage, itemLink } from "@/lib/telegram";

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
  // The cron interval determines the reminder window so thresholds tile without
  // gaps or duplicate bursts. Vercel Hobby runs daily (24h); a self-hosted hourly
  // cron should set CRON_INTERVAL_HOURS=1 for precise sub-day reminders.
  const intervalH = Number(process.env.CRON_INTERVAL_HOURS) || 24;
  const intervalMs = intervalH * 60 * 60 * 1000;

  // Find all items with upcoming deadlines (up to 1 week ahead)
  const maxHours = 168;
  const maxAhead = new Date(now.getTime() + maxHours * 60 * 60 * 1000);

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
          settings: {
            select: {
              telegramChatId: true,
              notifyVia: true,
              deadlineHours: true,
            },
          },
        },
      });
      if (!user) continue;

      const thresholds = (user.settings?.deadlineHours?.length
        ? user.settings.deadlineHours
        : DEFAULT_THRESHOLDS
      ).slice().sort((a, b) => a - b); // ascending: most urgent first

      const notifyVia = user.settings?.notifyVia ?? ["app"];

      for (const hours of thresholds) {
        const targetMs = hours * 60 * 60 * 1000;
        // Fire once as the deadline descends past the threshold: it is now within
        // `hours`, but was still beyond it at the previous cron run one interval ago.
        const inWindow = msUntilDeadline <= targetMs && msUntilDeadline > targetMs - intervalMs;
        if (!inWindow) continue;

        // Dedup: one notification per user+item+threshold
        const alreadySent = await prisma.notification.findFirst({
          where: {
            userId: user.id,
            itemId: item.id,
            type: "DEADLINE_APPROACHING",
            thresholdHours: hours,
          },
        });
        if (alreadySent) continue;

        // In-app notification
        if (notifyVia.includes("app") || notifyVia.length === 0) {
          await prisma.notification.create({
            data: {
              userId: user.id,
              type: "DEADLINE_APPROACHING",
              itemId: item.id,
              itemTitle: item.title,
              thresholdHours: hours,
            },
          });
          created++;
        }

        // Telegram notification
        if (notifyVia.includes("telegram") && user.settings?.telegramChatId) {
          const deadlineStr = item.deadline.toLocaleString("uk-UA", {
            day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
          });
          const text =
            `⏰ <b>Нагадування про дедлайн</b>\n\n` +
            `Задача: ${itemLink(item.id, item.title)}\n` +
            `Залишилось: <b>менше ${dayLabel(hours)}</b>\n` +
            `Дедлайн: ${deadlineStr}`;
          const ok = await sendTelegramMessage(user.settings.telegramChatId, text);
          if (ok) sent++;
        }

        // One notification per item+user per cron run — stop after the most urgent threshold fires.
        break;
      }
    }
  }

  return NextResponse.json({ ok: true, created, sent, checked: items.length, purged: purged.count });
}
