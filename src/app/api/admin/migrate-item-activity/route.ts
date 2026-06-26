import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUnblockedSession as getSession } from "@/lib/auth";

export async function POST() {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS item_activity (
      id TEXT PRIMARY KEY,
      "itemId" TEXT NOT NULL,
      "userId" TEXT,
      "userName" TEXT NOT NULL,
      action TEXT NOT NULL,
      field TEXT,
      "oldValue" TEXT,
      "newValue" TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS item_activity_itemid_created_idx ON item_activity ("itemId", created_at)
  `);

  return NextResponse.json({ ok: true });
}
