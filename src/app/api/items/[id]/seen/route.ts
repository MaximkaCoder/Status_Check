import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const now = new Date();

  await prisma.itemCommentSeen.upsert({
    where: { itemId_userId: { itemId: id, userId: session.userId } },
    create: { itemId: id, userId: session.userId, seenAt: now },
    update: { seenAt: now },
  });

  return NextResponse.json({ ok: true });
}
