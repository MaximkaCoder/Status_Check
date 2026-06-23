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
  if (session?.userId === params.id)
    return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });

  const { blocked } = await req.json();
  const user = await prisma.user.update({ where: { id: params.id }, data: { blocked } });
  return NextResponse.json(user);
}
