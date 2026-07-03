import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUnblockedSession as getSession } from "@/lib/auth";
import { canModifyItem } from "@/lib/permissions";

type RouteParams = { params: { id: string } };

async function loadDeleted(id: string) {
  const session = await getSession();
  if (!session?.userId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const item = await prisma.statusItem.findUnique({ where: { id } });
  if (!item || !item.deleted_at) return { error: NextResponse.json({ error: "Item not found" }, { status: 404 }) };

  if (!canModifyItem({ userId: session.userId, name: session.name, isAdmin: session.isAdmin ?? false }, item)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { item };
}

// POST /api/archive/[id] — restore
export async function POST(_req: NextRequest, { params }: RouteParams) {
  const ctx = await loadDeleted(params.id);
  if ("error" in ctx) return ctx.error;

  const restored = await prisma.statusItem.update({
    where: { id: params.id },
    data: { deleted_at: null },
  });
  return NextResponse.json(restored);
}

// DELETE /api/archive/[id] — permanent delete
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const ctx = await loadDeleted(params.id);
  if ("error" in ctx) return ctx.error;

  await prisma.statusItem.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
