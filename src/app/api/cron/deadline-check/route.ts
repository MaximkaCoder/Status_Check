import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const items = await prisma.statusItem.findMany({
    where: {
      deadline: { gt: now, lt: in25h },
      status: { notIn: ["DONE", "NOT_ACTUAL"] },
    },
    select: { id: true, title: true, assignee: true, reviewer: true },
  });

  let created = 0;

  for (const item of items) {
    const names = [...new Set([item.assignee, item.reviewer].filter(Boolean) as string[])];

    for (const name of names) {
      const user = await prisma.user.findFirst({
        where: { name, blocked: false },
        select: { id: true },
      });
      if (!user) continue;

      const alreadySent = await prisma.notification.findFirst({
        where: { userId: user.id, itemId: item.id, type: "DEADLINE_APPROACHING", created_at: { gte: todayStart } },
      });
      if (alreadySent) continue;

      await prisma.notification.create({
        data: { userId: user.id, type: "DEADLINE_APPROACHING", itemId: item.id, itemTitle: item.title },
      });
      created++;
    }
  }

  return NextResponse.json({ ok: true, created, checked: items.length });
}
