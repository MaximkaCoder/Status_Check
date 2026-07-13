import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;

// Verifies the emailed code and sets a new password. Generic error text so a
// caller can't tell a wrong code from a nonexistent account.
export async function POST(req: NextRequest) {
  let body: { email?: string; code?: string; password?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const email = body.email?.trim().toLowerCase();
  const code = body.code?.trim();
  const password = body.password;

  if (!email || !code || !password) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const invalid = () => NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.blocked || !user.resetCodeHash || !user.resetCodeExpires) return invalid();

  // Expired → clear and reject
  if (user.resetCodeExpires.getTime() < Date.now()) {
    await prisma.user.update({ where: { id: user.id }, data: { resetCodeHash: null, resetCodeExpires: null, resetAttempts: 0 } });
    return invalid();
  }

  // Too many attempts → invalidate the code entirely
  if (user.resetAttempts >= MAX_ATTEMPTS) {
    await prisma.user.update({ where: { id: user.id }, data: { resetCodeHash: null, resetCodeExpires: null, resetAttempts: 0 } });
    return NextResponse.json({ error: "Too many attempts. Request a new code." }, { status: 429 });
  }

  const match = await bcrypt.compare(code, user.resetCodeHash);
  if (!match) {
    await prisma.user.update({ where: { id: user.id }, data: { resetAttempts: { increment: 1 } } });
    return invalid();
  }

  // Success — set new password, clear the reset code (single use)
  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, resetCodeHash: null, resetCodeExpires: null, resetAttempts: 0 },
  });

  return NextResponse.json({ ok: true });
}
