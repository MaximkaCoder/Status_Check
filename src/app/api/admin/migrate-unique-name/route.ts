import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUnblockedSession as getSession } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Check for duplicate names before adding the constraint
  const duplicates = await prisma.$queryRawUnsafe<{ name: string; count: bigint }[]>(`
    SELECT name, COUNT(*) as count
    FROM users
    GROUP BY name
    HAVING COUNT(*) > 1
  `);

  if (duplicates.length > 0) {
    return NextResponse.json({
      error: "Duplicate names exist — resolve before applying constraint",
      duplicates: duplicates.map(d => ({ name: d.name, count: Number(d.count) })),
    }, { status: 409 });
  }

  await prisma.$executeRawUnsafe(`
    ALTER TABLE users ADD CONSTRAINT users_name_key UNIQUE (name)
  `);

  return NextResponse.json({ ok: true });
}
