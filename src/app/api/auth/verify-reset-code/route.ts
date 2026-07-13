import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;

// Step 2 of the reset flow: checks the emailed code is valid without
// consuming it (the code is applied later by /reset-password) so the user
// gets immediate feedback before typing a new password.
export async function POST(req: NextRequest) {
  let body: { email?: string; code?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const email = body.email?.trim().toLowerCase();
  const code = body.code?.trim();
  if (!email || !code) return NextResponse.json({ error: "All fields required" }, { status: 400 });

  const invalid = () => NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.blocked || !user.resetCodeHash || !user.resetCodeExpires) return invalid();

  if (user.resetCodeExpires.getTime() < Date.now()) {
    await prisma.user.update({ where: { id: user.id }, data: { resetCodeHash: null, resetCodeExpires: null, resetAttempts: 0 } });
    return invalid();
  }

  if (user.resetAttempts >= MAX_ATTEMPTS) {
    await prisma.user.update({ where: { id: user.id }, data: { resetCodeHash: null, resetCodeExpires: null, resetAttempts: 0 } });
    return NextResponse.json({ error: "Too many attempts. Request a new code." }, { status: 429 });
  }

  const match = await bcrypt.compare(code, user.resetCodeHash);
  if (!match) {
    await prisma.user.update({ where: { id: user.id }, data: { resetAttempts: { increment: 1 } } });
    return invalid();
  }

  // Valid — do NOT clear the code; /reset-password will consume it
  return NextResponse.json({ ok: true });
}
