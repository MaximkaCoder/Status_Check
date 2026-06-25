import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// One-time route to add new NotificationType enum values to the DB.
// Delete after use.
export async function POST() {
  const session = await getSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.$executeRawUnsafe(
    `ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'STATUS_CHANGED'`
  );
  await prisma.$executeRawUnsafe(
    `ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DEADLINE_APPROACHING'`
  );

  return NextResponse.json({ ok: true, message: "Enum values added. Delete this route." });
}
