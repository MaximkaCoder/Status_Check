import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvEscape(v: string | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// GET /api/reports/export?from=YYYY-MM-DD&to=YYYY-MM-DD — CSV of items created in range
export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const fromParam = req.nextUrl.searchParams.get("from");
  const toParam = req.nextUrl.searchParams.get("to");
  const from = fromParam ? new Date(fromParam) : new Date(Date.now() - 90 * 86_400_000);
  const to = toParam ? new Date(toParam) : new Date();
  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
  }
  to.setHours(23, 59, 59, 999);

  const items = await prisma.statusItem.findMany({
    where: { created_at: { gte: from, lte: to }, deleted_at: null },
    orderBy: { created_at: "desc" },
  });

  const header = [
    "id", "title", "status", "priority", "project", "department",
    "creator", "assignee", "reviewer", "deadline", "created_at", "done_at", "done_by",
  ].join(",");

  const rows = items.map((i) =>
    [
      i.id,
      csvEscape(i.title),
      i.status,
      i.priority,
      csvEscape(i.project),
      csvEscape(i.department),
      csvEscape(i.creator_name),
      csvEscape(i.assignee),
      csvEscape(i.reviewer),
      i.deadline ? i.deadline.toISOString() : "",
      i.created_at.toISOString(),
      i.done_at ? i.done_at.toISOString() : "",
      csvEscape(i.done_by),
    ].join(",")
  );

  // BOM so Excel opens Ukrainian text correctly
  const csv = "﻿" + [header, ...rows].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="status-check-export-${from.toISOString().slice(0, 10)}_${to.toISOString().slice(0, 10)}.csv"`,
    },
  });
}
