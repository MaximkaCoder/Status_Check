import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUnblockedSession } from "@/lib/auth";
import { sendTelegramMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getUnblockedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.userSettings.findUnique({
    where: { userId: session.userId },
    select: { telegramChatId: true },
  });

  if (!settings?.telegramChatId) {
    return NextResponse.json({ error: "Telegram not connected" }, { status: 400 });
  }

  const ok = await sendTelegramMessage(
    settings.telegramChatId,
    `✅ <b>Тест пройдено!</b>\n\nTelegram успішно підключено до <b>Status Check</b>.\nВи будете отримувати сповіщення тут.`
  );

  return NextResponse.json({ ok });
}
