import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getUnblockedSession } from "@/lib/auth";
import { emailDiagnostics } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin-only live SMTP check. Verifies the connection and sends a test email
// to the admin's own address, returning the real error over HTTP so email
// delivery can be diagnosed without server logs.
export async function POST() {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;

  const session = await getUnblockedSession();
  const to = session!.email;

  const result = await emailDiagnostics(to);
  return NextResponse.json({ to, ...result });
}
