import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

type Params = { params: { id: string; fileId: string } };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const file = await prisma.projectFile.findFirst({
    where: { id: params.fileId, projectId: params.id },
  });
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await del(file.url);
  await prisma.projectFile.delete({ where: { id: params.fileId } });
  return NextResponse.json({ success: true });
}
