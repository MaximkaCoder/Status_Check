import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendEmail, resetCodeEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CODE_TTL_MS = 15 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

function sixDigitCode(): string {
  // 100000–999999, cryptographically random
  const n = 100000 + Math.floor((globalThis.crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32) * 900000);
  return String(n);
}

// Sends a reset code. By product decision this reports whether the email
// exists (404 when not found) rather than a generic response — the team
// prefers a clear "no such email" warning over enumeration-hardening.
export async function POST(req: NextRequest) {
  let email: string | undefined;
  try { ({ email } = await req.json()); } catch { /* fall through */ }

  const normalized = email?.trim().toLowerCase();
  if (!normalized) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user || user.blocked) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Cooldown: if an unexpired code was issued < 60s ago, don't resend
  if (user.resetCodeExpires) {
    const sentAt = user.resetCodeExpires.getTime() - CODE_TTL_MS;
    if (Date.now() - sentAt < RESEND_COOLDOWN_MS) return NextResponse.json({ ok: true });
  }

  const code = sixDigitCode();
  const resetCodeHash = await bcrypt.hash(code, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetCodeHash,
      resetCodeExpires: new Date(Date.now() + CODE_TTL_MS),
      resetAttempts: 0,
    },
  });

  const { subject, html, text } = resetCodeEmail(code);
  await sendEmail({ to: user.email, subject, html, text }).catch(() => {});

  return NextResponse.json({ ok: true });
}
