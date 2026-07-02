import { prisma } from "@/lib/prisma";
import { sendTelegramMessage, itemLink } from "@/lib/telegram";

type NotifyEventType = "ASSIGNED_ASSIGNEE" | "ASSIGNED_REVIEWER" | "STATUS_CHANGED" | "NEW_COMMENT";

async function deliverNotification(
  userId: string,
  type: NotifyEventType,
  itemId: string,
  itemTitle: string,
  telegramText: string
) {
  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { notifyVia: true, telegramChatId: true, notifyOnAssign: true, notifyOnComment: true, notifyOnStatus: true },
  });

  const notifyVia = settings?.notifyVia ?? ["app"];

  // Check if user opted out of this event type
  if (type === "ASSIGNED_ASSIGNEE" || type === "ASSIGNED_REVIEWER") {
    if (settings && !settings.notifyOnAssign) return;
  }
  if (type === "NEW_COMMENT") {
    if (settings && !settings.notifyOnComment) return;
  }
  if (type === "STATUS_CHANGED") {
    if (settings && !settings.notifyOnStatus) return;
  }

  if (notifyVia.includes("app") || notifyVia.length === 0) {
    await prisma.notification.create({ data: { userId, type, itemId, itemTitle } });
  }

  if (notifyVia.includes("telegram") && settings?.telegramChatId) {
    await sendTelegramMessage(settings.telegramChatId, telegramText);
  }
}

export async function notifyAssignees(
  itemId: string,
  itemTitle: string,
  assigneeName: string | null | undefined,
  reviewerName: string | null | undefined,
  changedAssignee: boolean,
  changedReviewer: boolean
): Promise<void> {
  if (changedAssignee && assigneeName) {
    const user = await prisma.user.findFirst({ where: { name: assigneeName }, select: { id: true } });
    if (user) {
      await deliverNotification(
        user.id,
        "ASSIGNED_ASSIGNEE",
        itemId,
        itemTitle,
        `📋 <b>Вас призначено виконавцем</b>\n\nЗадача: ${itemLink(itemId, itemTitle)}`
      );
    }
  }

  if (changedReviewer && reviewerName) {
    const user = await prisma.user.findFirst({ where: { name: reviewerName }, select: { id: true } });
    if (user) {
      await deliverNotification(
        user.id,
        "ASSIGNED_REVIEWER",
        itemId,
        itemTitle,
        `👀 <b>Вас призначено рецензентом</b>\n\nЗадача: ${itemLink(itemId, itemTitle)}`
      );
    }
  }
}

export async function notifyStatusChange(
  itemId: string,
  itemTitle: string,
  assigneeName: string | null | undefined,
  reviewerName: string | null | undefined,
  creatorName: string | null | undefined,
  newStatus: string,
  changedBy: string
): Promise<void> {
  const names = [...new Set([assigneeName, reviewerName, creatorName].filter(Boolean) as string[])].filter(
    (n) => n !== changedBy
  );

  const statusLabels: Record<string, string> = {
    TO_CHECK: "На перевірці",
    EXPIRED: "Прострочено",
    DONE: "Виконано",
    NOT_ACTUAL: "Не актуально",
    IDEAS_BACKLOG: "Ідеї / Backlog",
  };

  for (const name of names) {
    const user = await prisma.user.findFirst({ where: { name }, select: { id: true } });
    if (!user) continue;
    await deliverNotification(
      user.id,
      "STATUS_CHANGED",
      itemId,
      itemTitle,
      `🔄 <b>Статус задачі змінено</b>\n\nЗадача: ${itemLink(itemId, itemTitle)}\nНовий статус: <b>${statusLabels[newStatus] ?? newStatus}</b>`
    );
  }
}

export async function notifyNewComment(
  itemId: string,
  itemTitle: string,
  assigneeName: string | null | undefined,
  reviewerName: string | null | undefined,
  commentAuthor: string
): Promise<void> {
  const names = [...new Set([assigneeName, reviewerName].filter(Boolean) as string[])].filter(
    (n) => n !== commentAuthor
  );

  for (const name of names) {
    const user = await prisma.user.findFirst({ where: { name }, select: { id: true } });
    if (!user) continue;
    await deliverNotification(
      user.id,
      "NEW_COMMENT",
      itemId,
      itemTitle,
      `💬 <b>Новий коментар</b>\n\nЗадача: ${itemLink(itemId, itemTitle)}\nАвтор: ${commentAuthor}`
    );
  }
}
