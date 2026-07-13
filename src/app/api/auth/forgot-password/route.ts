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

// Always responds 200 with the same generic message — never reveals whether
// an account exists for the given email (prevents enumeration).
export async function POST(req: NextRequest) {
  let email: string | undefined;
  try { ({ email } = await req.json()); } catch { /* fall through */ }

  const generic = NextResponse.json({ ok: true });

  const normalized = email?.trim().toLowerCase();
  if (!normalized) return generic;

  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user || user.blocked) return generic;

  // Cooldown: if an unexpired code was issued < 60s ago, don't resend
  if (user.resetCodeExpires) {
    const sentAt = user.resetCodeExpires.getTime() - CODE_TTL_MS;
    if (Date.now() - sentAt < RESEND_COOLDOWN_MS) return generic;
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

  return generic;
}
