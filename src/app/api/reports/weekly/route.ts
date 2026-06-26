import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";

function weekRange(base: Date) {
  const d = new Date(base);
  const dow = (d.getDay() + 6) % 7; // 0 = Monday
  const start = new Date(d);
  start.setDate(d.getDate() - dow);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const weekParam = req.nextUrl.searchParams.get("week");
  const base = weekParam ? new Date(weekParam) : new Date();
  if (isNaN(base.getTime())) {
    return NextResponse.json({ error: "Invalid week" }, { status: 400 });
  }

  const { start, end } = weekRange(base);
  const prevBase = new Date(start);
  prevBase.setDate(prevBase.getDate() - 7);
  const { start: pStart, end: pEnd } = weekRange(prevBase);

  const [
    closedTasks,
    createdCount,
    prevClosedCount,
    prevCreatedCount,
    inProgress,
    overdue,
    activity,
    comments,
  ] = await Promise.all([
    prisma.statusItem.findMany({
      where: { done_at: { gte: start, lte: end } },
      select: { id: true, title: true, done_by: true, done_at: true, created_at: true, department: true, project: true },
      orderBy: { done_at: "desc" },
    }),
    prisma.statusItem.count({ where: { created_at: { gte: start, lte: end } } }),
    prisma.statusItem.count({ where: { done_at: { gte: pStart, lte: pEnd } } }),
    prisma.statusItem.count({ where: { created_at: { gte: pStart, lte: pEnd } } }),
    prisma.statusItem.count({ where: { status: "TO_CHECK" } }),
    prisma.statusItem.count({ where: { status: "EXPIRED" } }),
    prisma.itemActivity.findMany({
      where: { created_at: { gte: start, lte: end } },
      select: { userName: true },
    }),
    prisma.comment.findMany({
      where: { created_at: { gte: start, lte: end } },
      select: { authorName: true },
    }),
  ]);

  const dayIndex = (date: Date) => {
    const i = Math.floor((date.getTime() - start.getTime()) / 86_400_000);
    return Math.max(0, Math.min(6, i));
  };

  type Row = { name: string; closed: number; activity: number; comments: number; perDay: number[] };
  const map = new Map<string, Row>();
  const ensure = (name: string): Row => {
    let r = map.get(name);
    if (!r) { r = { name, closed: 0, activity: 0, comments: 0, perDay: [0, 0, 0, 0, 0, 0, 0] }; map.set(name, r); }
    return r;
  };

  let leadSum = 0;
  let leadN = 0;
  const closed = closedTasks.map((t) => {
    const who = t.done_by ?? "—";
    if (t.done_at) {
      const r = ensure(who);
      r.closed++;
      r.perDay[dayIndex(t.done_at)]++;
    }
    let leadDays: number | null = null;
    if (t.done_at && t.created_at) {
      leadDays = Math.max(0, (t.done_at.getTime() - t.created_at.getTime()) / 86_400_000);
      leadSum += leadDays;
      leadN++;
    }
    return {
      id: t.id,
      title: t.title,
      doneBy: t.done_by,
      doneAt: t.done_at,
      department: t.department,
      project: t.project,
      leadDays: leadDays === null ? null : Math.round(leadDays * 10) / 10,
    };
  });

  for (const a of activity) ensure(a.userName).activity++;
  for (const c of comments) ensure(c.authorName).comments++;

  const leaderboard = [...map.values()]
    .map((r) => ({ ...r, score: r.closed * 3 + r.activity + r.comments }))
    .sort((a, b) => b.score - a.score);

  return NextResponse.json({
    range: { start, end },
    kpis: {
      closed: closedTasks.length,
      created: createdCount,
      inProgress,
      overdue,
      closedDelta: closedTasks.length - prevClosedCount,
      createdDelta: createdCount - prevCreatedCount,
    },
    avgLeadTime: leadN > 0 ? Math.round((leadSum / leadN) * 10) / 10 : null,
    leaderboard,
    closed,
  });
}
