import { prisma } from "@/lib/prisma";

/** Resolve a display name to { id, department } — null when not found or name empty. */
export async function lookupUserByName(
  name: string | null | undefined
): Promise<{ id: string; department: string | null } | null> {
  if (!name) return null;
  const u = await prisma.user.findFirst({
    where: { name },
    select: { id: true, department: { select: { name: true } } },
  });
  if (!u) return null;
  return { id: u.id, department: u.department?.name ?? null };
}
