import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUnblockedSession as getSession } from "@/lib/auth";
import { canViewItemDirect, canChangeStatus } from "@/lib/permissions";
import type { StatusItem } from "@prisma/client";

type RouteParams = { params: { id: string } };

async function loadItemWithAccess(itemId: string, forWrite: boolean) {
  const session = await getSession();
  if (!session?.userId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const item = await prisma.statusItem.findUnique({ where: { id: itemId } });
  if (!item || item.deleted_at) return { error: NextResponse.json({ error: "Item not found" }, { status: 404 }) };

  const s = { userId: session.userId, name: session.name, isAdmin: session.isAdmin ?? false };
  const allowed = forWrite ? canChangeStatus(s, item) : await canViewWithProject(s, item);
  if (!allowed) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };

  return { session, item };
}

async function canViewWithProject(
  s: { userId: string; name: string; isAdmin: boolean },
  item: StatusItem
): Promise<boolean> {
  const direct = canViewItemDirect(s, item);
  if (direct !== "project") return direct;
  const m = await prisma.projectMember.findFirst({
    where: { userId: s.userId, project: { name: item.project! } },
  });
  return !!m;
}

// GET /api/items/[id]/subtasks
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const ctx = await loadItemWithAccess(params.id, false);
  if ("error" in ctx) return ctx.error;

  const subtasks = await prisma.subtask.findMany({
    where: { itemId: params.id },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(subtasks);
}

// POST /api/items/[id]/subtasks  Body: { title }
export async function POST(req: NextRequest, { params }: RouteParams) {
  const ctx = await loadItemWithAccess(params.id, true);
  if ("error" in ctx) return ctx.error;

  let body: { title?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const title = body.title?.trim();
  if (!title || title.length > 300) return NextResponse.json({ error: "Invalid title" }, { status: 400 });

  const last = await prisma.subtask.findFirst({
    where: { itemId: params.id },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const subtask = await prisma.subtask.create({
    data: { itemId: params.id, title, order: (last?.order ?? -1) + 1 },
  });
  return NextResponse.json(subtask, { status: 201 });
}
