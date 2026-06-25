import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUnblockedSession as getSession } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { commentId } = await params;
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!session.isAdmin && comment.authorId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id: commentId } });
  return NextResponse.json({ ok: true });
}
