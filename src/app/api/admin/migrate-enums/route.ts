import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// One-time: add department column to status_items. Delete after use.
export async function POST() {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.$executeRawUnsafe(
    `ALTER TABLE "status_items" ADD COLUMN IF NOT EXISTS "department" TEXT`
  );

  return NextResponse.json({ ok: true, message: "Column added. Delete this route." });
}
