import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUnblockedSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

function randomToken() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let t = "";
  for (let i = 0; i < 6; i++) t += chars[Math.floor(Math.random() * chars.length)];
  return t;
}

export async function POST() {
  const session = await getUnblockedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = randomToken();

  await prisma.userSettings.upsert({
    where: { userId: session.userId },
    create: { userId: session.userId, telegramToken: token },
    update: { telegramToken: token },
  });

  return NextResponse.json({
    token,
    botUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "",
  });
}

export async function DELETE() {
  const session = await getUnblockedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.userSettings.upsert({
    where: { userId: session.userId },
    create: { userId: session.userId },
    update: { telegramChatId: null, telegramToken: null },
  });

  return NextResponse.json({ ok: true });
}
