import { prisma } from "@/lib/prisma";

export type ActivityEntry = {
  action: "CREATED" | "STATUS_CHANGED" | "FIELD_CHANGED";
  field?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
};

/**
 * Append activity log rows for an item. Fire-and-forget — callers should
 * .catch(() => {}) so logging never breaks the main request.
 */
export async function logActivity(
  itemId: string,
  userId: string | null,
  userName: string,
  entries: ActivityEntry[]
): Promise<void> {
  if (entries.length === 0) return;
  await prisma.itemActivity.createMany({
    data: entries.map((e) => ({
      itemId,
      userId,
      userName,
      action: e.action,
      field: e.field ?? null,
      oldValue: e.oldValue ?? null,
      newValue: e.newValue ?? null,
    })),
  });
}
