import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUnblockedSession as getSession } from "@/lib/auth";

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const item = await prisma.statusItem.findUnique({ where: { id: params.id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let allowed = session.isAdmin ?? false;
  if (!allowed && (item.creator_name === session.name || item.assignee === session.name || item.reviewer === session.name))
    allowed = true;
  if (!allowed && item.project) {
    const m = await prisma.projectMember.findFirst({
      where: { userId: session.userId, project: { name: item.project } },
    });
    allowed = !!m;
  }
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const activity = await prisma.itemActivity.findMany({
    where: { itemId: params.id },
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json(activity);
}
