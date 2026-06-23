import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

type Params = { params: { id: string } };

export async function PUT(req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  try {
    const project = await prisma.project.update({ where: { id: params.id }, data: { name: name.trim() } });
    return NextResponse.json(project);
  } catch {
    return NextResponse.json({ error: "Name already taken" }, { status: 409 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
