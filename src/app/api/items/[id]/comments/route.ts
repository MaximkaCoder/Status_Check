import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUnblockedSession as getSession } from "@/lib/auth";
import { notifyNewComment } from "@/lib/notify";

async function canAccess(userId: string, userName: string, isAdmin: boolean, itemId: string) {
  const item = await prisma.statusItem.findUnique({ where: { id: itemId } });
  if (!item) return { item: null, allowed: false };
  if (isAdmin) return { item, allowed: true };
  if (item.creator_name === userName || item.assignee === userName || item.reviewer === userName)
    return { item, allowed: true };
  if (item.project) {
    const m = await prisma.projectMember.findFirst({
      where: { userId, project: { name: item.project } },
    });
    return { item, allowed: !!m };
  }
  return { item, allowed: false };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { allowed } = await canAccess(session.userId, session.name, session.isAdmin, id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const comments = await prisma.comment.findMany({
    where: { itemId: id },
    orderBy: { created_at: "asc" },
    select: { id: true, authorId: true, authorName: true, text: true, created_at: true },
  });

  return NextResponse.json(comments);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { allowed, item } = await canAccess(session.userId, session.name, session.isAdmin, id);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { text?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const text = body.text?.trim();
  if (!text || text.length > 2000) return NextResponse.json({ error: "Invalid text" }, { status: 400 });

  const comment = await prisma.comment.create({
    data: { itemId: id, authorId: session.userId, authorName: session.name, text },
    select: { id: true, authorId: true, authorName: true, text: true, created_at: true },
  });

  if (item) {
    await notifyNewComment(id, item.title, item.assignee, item.reviewer, session.name);
  }

  return NextResponse.json(comment, { status: 201 });
}
