import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUnblockedSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getUnblockedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.userSettings.findUnique({
    where: { userId: session.userId },
  });

  return NextResponse.json(settings ?? {
    notifyVia: ["app"],
    notifyOnAssign: true,
    notifyOnComment: true,
    notifyOnStatus: true,
    deadlineHours: [24],
    telegramChatId: null,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getUnblockedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { notifyVia, notifyOnAssign, notifyOnComment, notifyOnStatus, deadlineHours } = body;

  const data: Record<string, unknown> = {};
  if (Array.isArray(notifyVia)) data.notifyVia = notifyVia;
  if (typeof notifyOnAssign === "boolean") data.notifyOnAssign = notifyOnAssign;
  if (typeof notifyOnComment === "boolean") data.notifyOnComment = notifyOnComment;
  if (typeof notifyOnStatus === "boolean") data.notifyOnStatus = notifyOnStatus;
  if (Array.isArray(deadlineHours)) data.deadlineHours = deadlineHours.filter((h: unknown) => typeof h === "number");

  const settings = await prisma.userSettings.upsert({
    where: { userId: session.userId },
    create: { userId: session.userId, ...data },
    update: data,
  });

  return NextResponse.json(settings);
}
