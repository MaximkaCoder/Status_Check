import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUnblockedSession as getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const items = await prisma.statusItem.findMany({
    orderBy: { created_at: "desc" },
    take: 10,
    select: { id: true, title: true, assignee: true, department: true, created_at: true },
  });

  const users = await prisma.user.findMany({
    select: { id: true, name: true, departmentId: true, department: { select: { name: true } } },
  });

  return NextResponse.json({ items, users, message: "Delete this route after debugging." });
}
