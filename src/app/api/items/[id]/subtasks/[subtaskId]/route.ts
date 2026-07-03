import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUnblockedSession as getSession } from "@/lib/auth";
import { canChangeStatus } from "@/lib/permissions";

type RouteParams = { params: { id: string; subtaskId: string } };

async function checkWriteAccess(itemId: string) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const item = await prisma.statusItem.findUnique({ where: { id: itemId } });
  if (!item || item.deleted_at) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  if (!canChangeStatus({ userId: session.userId, name: session.name, isAdmin: session.isAdmin ?? false }, item)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

// PATCH /api/items/[id]/subtasks/[subtaskId]  Body: { done?, title? }
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const denied = await checkWriteAccess(params.id);
  if (denied) return denied;

  let body: { done?: boolean; title?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const data: { done?: boolean; title?: string } = {};
  if (typeof body.done === "boolean") data.done = body.done;
  if (typeof body.title === "string") {
    const t = body.title.trim();
    if (!t || t.length > 300) return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    data.title = t;
  }
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const existing = await prisma.subtask.findFirst({ where: { id: params.subtaskId, itemId: params.id } });
  if (!existing) return NextResponse.json({ error: "Subtask not found" }, { status: 404 });

  const updated = await prisma.subtask.update({ where: { id: params.subtaskId }, data });
  return NextResponse.json(updated);
}

// DELETE /api/items/[id]/subtasks/[subtaskId]
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const denied = await checkWriteAccess(params.id);
  if (denied) return denied;

  const existing = await prisma.subtask.findFirst({ where: { id: params.subtaskId, itemId: params.id } });
  if (!existing) return NextResponse.json({ error: "Subtask not found" }, { status: 404 });

  await prisma.subtask.delete({ where: { id: params.subtaskId } });
  return NextResponse.json({ success: true });
}
