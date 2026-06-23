import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, isAdmin: true, blocked: true, created_at: true,
      department: { select: { id: true, name: true } },
    },
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json(users);
}
