import { prisma } from "@/lib/prisma";

export async function notifyAssignees(
  itemId: string,
  itemTitle: string,
  assigneeName: string | null | undefined,
  reviewerName: string | null | undefined,
  changedAssignee: boolean,
  changedReviewer: boolean
): Promise<void> {
  type Row = { userId: string; type: "ASSIGNED_ASSIGNEE" | "ASSIGNED_REVIEWER"; itemId: string; itemTitle: string };
  const toCreate: Row[] = [];

  if (changedAssignee && assigneeName) {
    const user = await prisma.user.findFirst({ where: { name: assigneeName }, select: { id: true } });
    if (user) toCreate.push({ userId: user.id, type: "ASSIGNED_ASSIGNEE", itemId, itemTitle });
  }

  if (changedReviewer && reviewerName) {
    const user = await prisma.user.findFirst({ where: { name: reviewerName }, select: { id: true } });
    if (user) toCreate.push({ userId: user.id, type: "ASSIGNED_REVIEWER", itemId, itemTitle });
  }

  if (toCreate.length > 0) {
    await prisma.notification.createMany({ data: toCreate });
  }
}

export async function notifyStatusChange(
  itemId: string,
  itemTitle: string,
  assigneeName: string | null | undefined,
  reviewerName: string | null | undefined,
  newStatus: string,
  changedBy: string
): Promise<void> {
  const names = [...new Set([assigneeName, reviewerName].filter(Boolean) as string[])].filter(
    (n) => n !== changedBy
  );

  const toCreate: { userId: string; type: "STATUS_CHANGED"; itemId: string; itemTitle: string }[] = [];

  for (const name of names) {
    const user = await prisma.user.findFirst({ where: { name }, select: { id: true } });
    if (user) toCreate.push({ userId: user.id, type: "STATUS_CHANGED", itemId, itemTitle });
  }

  if (toCreate.length > 0) {
    await prisma.notification.createMany({ data: toCreate });
  }
}
