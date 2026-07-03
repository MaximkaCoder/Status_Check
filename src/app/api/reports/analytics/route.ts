import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/reports/analytics
// - trend: tasks closed per ISO week, last 8 weeks
// - load: open tasks per assignee
// - overdueByDept: expired tasks grouped by department
export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const eightWeeksAgo = new Date(monday);
  eightWeeksAgo.setDate(monday.getDate() - 7 * 7);

  const [closedRecent, openItems, overdueItems] = await Promise.all([
    prisma.statusItem.findMany({
      where: { done_at: { gte: eightWeeksAgo }, deleted_at: null },
      select: { done_at: true },
    }),
    prisma.statusItem.findMany({
      where: { status: { in: ["TO_CHECK", "EXPIRED"] }, deleted_at: null },
      select: { assignee: true },
    }),
    prisma.statusItem.findMany({
      where: { status: "EXPIRED", deleted_at: null },
      select: { department: true },
    }),
  ]);

  // Closed per week — 8 buckets, oldest first
  const trend: { weekStart: string; closed: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const start = new Date(monday);
    start.setDate(monday.getDate() - i * 7);
    trend.push({ weekStart: start.toISOString().slice(0, 10), closed: 0 });
  }
  for (const c of closedRecent) {
    if (!c.done_at) continue;
    const idx = Math.floor((c.done_at.getTime() - eightWeeksAgo.getTime()) / (7 * 86_400_000));
    if (idx >= 0 && idx < trend.length) trend[idx].closed++;
  }

  const loadMap = new Map<string, number>();
  for (const it of openItems) {
    const key = it.assignee ?? "—";
    loadMap.set(key, (loadMap.get(key) ?? 0) + 1);
  }
  const load = [...loadMap.entries()]
    .map(([name, open]) => ({ name, open }))
    .sort((a, b) => b.open - a.open)
    .slice(0, 12);

  const deptMap = new Map<string, number>();
  for (const it of overdueItems) {
    const key = it.department ?? "—";
    deptMap.set(key, (deptMap.get(key) ?? 0) + 1);
  }
  const overdueByDept = [...deptMap.entries()]
    .map(([department, overdue]) => ({ department, overdue }))
    .sort((a, b) => b.overdue - a.overdue);

  return NextResponse.json({ trend, load, overdueByDept });
}
