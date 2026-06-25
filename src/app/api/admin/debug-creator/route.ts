import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUnblockedSession as getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const items = await prisma.$queryRawUnsafe<{ id: string; creator_name: string; creator_id: string | null }[]>(
    `SELECT id, creator_name, creator_id FROM status_items LIMIT 20`
  );
  const users = await prisma.$queryRawUnsafe<{ id: string; name: string }[]>(
    `SELECT id, name FROM users`
  );

  return NextResponse.json({ items, users });
}
