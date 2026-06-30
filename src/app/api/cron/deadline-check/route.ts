import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";

export const runtime = "nodejs";

const DEFAULT_THRESHOLDS = [24];

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const WINDOW_MS = 30 * 60 * 1000; // ±30 min window per threshold

  // Find all items with upcoming deadlines (up to 1 week ahead)
  const maxHours = 168;
  const maxAhead = new Date(now.getTime() + maxHours * 60 * 60 * 1000);

  const items = await prisma.statusItem.findMany({
    where: {
      deadline: { gt: now, lt: maxAhead },
      status: { notIn: ["DONE", "NOT_ACTUAL"] },
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

      const thresholds = user.settings?.deadlineHours?.length
        ? user.settings.deadlineHours
        : DEFAULT_THRESHOLDS;

      const notifyVia = user.settings?.notifyVia ?? ["app"];

      for (const hours of thresholds) {
        const targetMs = hours * 60 * 60 * 1000;
        const inWindow = Math.abs(msUntilDeadline - targetMs) <= WINDOW_MS;
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
          const hoursLabel = hours >= 24
            ? `${hours / 24} ${hours / 24 === 1 ? "день" : "дні"}`
            : `${hours} год`;
          const text =
            `⏰ <b>Нагадування про дедлайн</b>\n\n` +
            `Задача: <b>${item.title}</b>\n` +
            `Дедлайн через: <b>${hoursLabel}</b>\n` +
            `Дедлайн: ${item.deadline.toLocaleDateString("uk-UA")}`;
          const ok = await sendTelegramMessage(user.settings.telegramChatId, text);
          if (ok) sent++;
        }
      }
    }
  }

  return NextResponse.json({ ok: true, created, sent, checked: items.length });
}
