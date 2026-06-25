import { NextResponse } from "next/server";
import { getUnblockedSession } from "@/lib/auth";

export async function requireAdmin(): Promise<{ error: NextResponse } | { ok: true }> {
  const session = await getUnblockedSession();
  if (!session) return { error: NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 }) };
  if (!session.isAdmin) return { error: NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 }) };
  return { ok: true };
}
