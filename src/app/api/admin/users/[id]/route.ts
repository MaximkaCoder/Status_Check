import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { getSession } from "@/lib/auth";

type Params = { params: { id: string } };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const session = await getSession();
  if (session?.userId === params.id)
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const session = await getSession();
  const body = await req.json();

  // Prevent self-block/role-change, but allow self-department update
  if (session?.userId === params.id && ("blocked" in body || "isAdmin" in body))
    return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });

  const data: { blocked?: boolean; departmentId?: string | null; isAdmin?: boolean } = {};
  if (typeof body.blocked === "boolean") data.blocked = body.blocked;
  if ("departmentId" in body) data.departmentId = body.departmentId ?? null;
  if (typeof body.isAdmin === "boolean") data.isAdmin = body.isAdmin;
  const user = await prisma.user.update({ where: { id: params.id }, data });
  return NextResponse.json(user);
}
