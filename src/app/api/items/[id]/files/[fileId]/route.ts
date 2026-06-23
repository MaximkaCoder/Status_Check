import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type Params = { params: { id: string; fileId: string } };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const file = await prisma.itemFile.findFirst({
    where: { id: params.fileId, itemId: params.id },
    include: { item: true },
  });
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { item } = file;
  const isAdmin = session.isAdmin ?? false;
  const canDelete =
    isAdmin ||
    item.creator_name === session.name ||
    item.assignee === session.name ||
    item.reviewer === session.name;

  if (!canDelete) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await del(file.url);
  await prisma.itemFile.delete({ where: { id: params.fileId } });
  return NextResponse.json({ success: true });
}
