import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { getSession } from "@/lib/auth";

// POST /api/admin/users/bulk-delete  Body: { ids: string[] }
// Deletes the given users, skipping the current admin and any admin accounts.
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  let body: { ids?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === "string") : [];
  if (ids.length === 0) return NextResponse.json({ error: "No ids provided" }, { status: 400 });

  const session = await getSession();

  const result = await prisma.user.deleteMany({
    where: {
      id: { in: ids },
      isAdmin: false,                       // never delete admins in bulk
      NOT: { id: session?.userId ?? "" },   // never delete self
    },
  });

  return NextResponse.json({ deleted: result.count });
}
