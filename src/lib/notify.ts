import { prisma } from "@/lib/prisma";

export async function notifyAssignees(
  itemId: string,
  itemTitle: string,
  assigneeName: string | null | undefined,
  reviewerName: string | null | undefined,
  changedAssignee: boolean,
  changedReviewer: boolean
): Promise<void> {
  const toCreate: { userId: string; type: "ASSIGNED_ASSIGNEE" | "ASSIGNED_REVIEWER"; itemId: string; itemTitle: string }[] = [];

  if (changedAssignee && assigneeName) {
    const user = await prisma.user.findFirst({ where: { name: assigneeName }, select: { id: true } });
    if (user) {
      toCreate.push({ userId: user.id, type: "ASSIGNED_ASSIGNEE", itemId, itemTitle });
    }
  }

  if (changedReviewer && reviewerName) {
    const user = await prisma.user.findFirst({ where: { name: reviewerName }, select: { id: true } });
    if (user) {
      toCreate.push({ userId: user.id, type: "ASSIGNED_REVIEWER", itemId, itemTitle });
    }
  }

  if (toCreate.length > 0) {
    await prisma.notification.createMany({ data: toCreate });
  }
}
