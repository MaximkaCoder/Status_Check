import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

type Params = { params: { id: string; userId: string } };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  await prisma.projectMember.deleteMany({
    where: { projectId: params.id, userId: params.userId },
  });
  return NextResponse.json({ success: true });
}
