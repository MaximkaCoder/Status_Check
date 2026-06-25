import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUnblockedSession as getSession } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.$executeRawUnsafe(`
    ALTER TABLE status_items ADD COLUMN IF NOT EXISTS creator_id TEXT
  `);

  const result = await prisma.$executeRawUnsafe(`
    UPDATE status_items si
    SET creator_id = u.id
    FROM users u
    WHERE u.name = si.creator_name
      AND si.creator_id IS NULL
  `);

  return NextResponse.json({ updated: result });
}
