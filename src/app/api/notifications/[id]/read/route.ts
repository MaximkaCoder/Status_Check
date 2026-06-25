import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUnblockedSession as getSession } from "@/lib/auth";

type RouteParams = { params: { id: string } };

// PATCH /api/notifications/[id]/read — mark single notification as read
export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });

    await prisma.notification.updateMany({
      where: { id: params.id, userId: session.userId },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`PATCH /api/notifications/${params.id}/read error:`, error);
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 });
  }
}
