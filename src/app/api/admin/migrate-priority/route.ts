import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUnblockedSession as getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE status_items
      ADD COLUMN IF NOT EXISTS priority "Priority" NOT NULL DEFAULT 'MEDIUM';
  `);

  return NextResponse.json({ ok: true, message: "Priority column added. Delete this route." });
}
