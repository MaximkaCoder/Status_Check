import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUnblockedSession as getSession } from "@/lib/auth";

export async function GET() {
  if (!await getSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(users);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
