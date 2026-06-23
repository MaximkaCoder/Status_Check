import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { id: "asc" } },
      files: { orderBy: { created_at: "desc" } },
    },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const body = await req.json();
  if (!body.name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  try {
    const project = await prisma.project.update({
      where: { id: params.id },
      data: { name: body.name.trim(), description: body.description?.trim() || null },
    });
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
