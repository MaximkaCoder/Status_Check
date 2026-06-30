import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const message = body?.message;
  if (!message) return NextResponse.json({ ok: true });

  const chatId = String(message.chat?.id);
  const text: string = message.text ?? "";

  // /connect CODE or /start CODE
  const match = text.match(/^\/(connect|start)\s+([A-Z0-9]{6})$/i);
  if (!match) {
    await sendTelegramMessage(chatId, "Надішліть код з'єднання у форматі: <code>/connect XXXXXX</code>");
    return NextResponse.json({ ok: true });
  }

  const token = match[2].toUpperCase();
  const settings = await prisma.userSettings.findFirst({ where: { telegramToken: token } });

  if (!settings) {
    await sendTelegramMessage(chatId, "Код не знайдено або вже використано. Згенеруйте новий код у налаштуваннях.");
    return NextResponse.json({ ok: true });
  }

  await prisma.userSettings.update({
    where: { id: settings.id },
    data: { telegramChatId: chatId, telegramToken: null },
  });

  await sendTelegramMessage(chatId, "Telegram успішно підключено! Ви будете отримувати сповіщення тут.");
  return NextResponse.json({ ok: true });
}
