import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUnblockedSession as getSession } from "@/lib/auth";

// GET /api/archive — soft-deleted items the current user may manage:
// admins see everything, others only what they created.
export async function GET() {
  const session = await getSession();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.statusItem.findMany({
    where: {
      deleted_at: { not: null },
      ...(session.isAdmin
        ? {}
        : { OR: [{ creator_id: session.userId }, { creator_name: session.name }] }),
    },
    orderBy: { deleted_at: "desc" },
  });

  return NextResponse.json(items);
}
