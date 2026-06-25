import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUnblockedSession as getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const projects = await prisma.project.findMany({
      where: session.isAdmin
        ? undefined
        : { members: { some: { userId: session.userId } } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(projects);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!await getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const existing = await prisma.project.findUnique({ where: { name: name.trim() } });
    if (existing) return NextResponse.json(existing);

    const project = await prisma.project.create({ data: { name: name.trim() } });
    return NextResponse.json(project, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
