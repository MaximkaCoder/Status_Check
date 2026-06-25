import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUnblockedSession as getSession } from "@/lib/auth";

// GET /api/notifications — list current user's notifications (newest first, max 50)
export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

    const notifications = await prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { created_at: "desc" },
      take: 50,
      select: { id: true, type: true, itemId: true, itemTitle: true, read: true, created_at: true },
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 });
  }
}

// PATCH /api/notifications — mark all as read
export async function PATCH(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

    await prisma.notification.updateMany({
      where: { userId: session.userId, read: false },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/notifications error:", error);
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 });
  }
}
