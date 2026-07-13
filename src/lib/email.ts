import nodemailer from "nodemailer";

// SMTP transport built lazily from env. Returns null when unconfigured so the
// app runs fine without email set up — password reset simply stays inactive.
let cached: nodemailer.Transporter | null | undefined;

function getTransport(): nodemailer.Transporter | null {
  if (cached !== undefined) return cached;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  // SMTP_PASS_B64 (base64) avoids shell/env-file mangling of special chars
  // like "$" in the password; falls back to plain SMTP_PASS.
  const pass = process.env.SMTP_PASS_B64
    ? Buffer.from(process.env.SMTP_PASS_B64, "base64").toString("utf8")
    : process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    cached = null;
    return null;
  }

  // secure: implicit TLS on 465, STARTTLS otherwise — override with SMTP_SECURE.
  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === "true"
    : port === 465;
  // Self-hosted mail servers (e.g. Stalwart) may present an internal or
  // self-signed cert; set SMTP_TLS_REJECT_UNAUTHORIZED=false to accept it.
  const rejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false";

  cached = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized },
  });
  return cached;
}

export function isEmailConfigured(): boolean {
  return getTransport() !== null;
}

export async function sendEmail(opts: { to: string; subject: string; html: string; text?: string }): Promise<boolean> {
  const transport = getTransport();
  if (!transport) {
    console.warn("sendEmail skipped — SMTP not configured");
    return false;
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER!;
  try {
    await transport.sendMail({ from, to: opts.to, subject: opts.subject, html: opts.html, text: opts.text });
    return true;
  } catch (e) {
    console.error("sendEmail failed:", e);
    return false;
  }
}

// Live SMTP diagnostic: verifies the connection and sends a test email,
// returning the real error so it can be surfaced over HTTP (no server logs).
export async function emailDiagnostics(to: string): Promise<{
  configured: boolean; verified: boolean; sent: boolean;
  host?: string; port?: number; from?: string; error?: string;
}> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const t = getTransport();
  if (!t) return { configured: false, verified: false, sent: false, host, port, from };
  try {
    await t.verify();
  } catch (e) {
    return { configured: true, verified: false, sent: false, host, port, from, error: e instanceof Error ? e.message : String(e) };
  }
  try {
    await t.sendMail({ from: from!, to, subject: "Status Check — SMTP test", text: "SMTP test OK", html: "<p>SMTP test OK ✓</p>" });
    return { configured: true, verified: true, sent: true, host, port, from };
  } catch (e) {
    return { configured: true, verified: true, sent: false, host, port, from, error: e instanceof Error ? e.message : String(e) };
  }
}

// Converts the notification HTML lines to a plain-text alternative,
// turning <a href="URL">label</a> into "label: URL" and stripping tags.
function htmlLinesToText(lines: string[]): string {
  return lines
    .map((l) =>
      l
        .replace(/<a\s+href="([^"]+)"[^>]*>(.*?)<\/a>/gi, "$2: $1")
        .replace(/<[^>]+>/g, "")
        .trim(),
    )
    .join("\n");
}

// Turns a Telegram-style notification body (uses \n and <b>/<a> tags) into a
// branded HTML email + plain-text alternative + a subject from its first line.
export function notificationEmail(bodyHtml: string): { subject: string; html: string; text: string } {
  const lines = bodyHtml.split("\n").map((l) => l.trim()).filter(Boolean);
  const firstLinePlain = (lines[0] ?? "Status Check")
    .replace(/<[^>]+>/g, "")          // strip tags
    .replace(/^[^\p{L}\d]+/u, "")     // strip leading emoji/space
    .trim();
  const subject = `${firstLinePlain} — Status Check`;
  const text = htmlLinesToText(lines);
  const body = lines.join("<br>");
  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:460px;margin:0 auto;padding:28px 24px;color:#0f172a">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:18px">
      <span style="display:inline-block;width:34px;height:34px;line-height:34px;text-align:center;border-radius:10px;background:linear-gradient(135deg,#818cf8,#8b5cf6);color:#fff;font-size:16px;font-weight:700">✓</span>
      <b style="font-size:15px">Status Check</b>
    </div>
    <div style="font-size:14px;line-height:1.7;color:#334155">${body}</div>
    <p style="font-size:12px;line-height:1.6;color:#94a3b8;margin:18px 0 0">Ви отримали цей лист, бо увімкнули email-сповіщення в налаштуваннях. / You enabled email notifications in your settings.</p>
  </div>`;
  return { subject, html, text };
}

// Password-reset code email, bilingual (uk + en) so it reads for either locale.
export function resetCodeEmail(code: string): { subject: string; html: string; text: string } {
  const subject = "Код відновлення паролю / Password reset code — Status Check";
  const text =
    `Ваш код для відновлення паролю: ${code}\nКод дійсний 15 хвилин.\n\n` +
    `Your password reset code: ${code}\nThe code is valid for 15 minutes.\n\n` +
    `Якщо ви не запитували відновлення — проігноруйте цей лист.`;
  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:440px;margin:0 auto;padding:32px 24px;color:#0f172a">
    <div style="text-align:center;margin-bottom:24px">
      <div style="display:inline-block;width:48px;height:48px;line-height:48px;border-radius:14px;background:linear-gradient(135deg,#818cf8,#8b5cf6);color:#fff;font-size:22px;font-weight:700">✓</div>
      <h1 style="font-size:18px;margin:12px 0 0">Status Check</h1>
    </div>
    <p style="font-size:14px;line-height:1.6;color:#334155;margin:0 0 8px">Код для відновлення паролю / Your password reset code:</p>
    <div style="text-align:center;margin:20px 0">
      <span style="display:inline-block;font-size:32px;font-weight:800;letter-spacing:8px;padding:16px 24px;border-radius:14px;background:#eef2ff;color:#4338ca">${code}</span>
    </div>
    <p style="font-size:13px;line-height:1.6;color:#64748b;margin:0">Код дійсний <b>15 хвилин</b>. / Valid for <b>15 minutes</b>.</p>
    <p style="font-size:12px;line-height:1.6;color:#94a3b8;margin:16px 0 0">Якщо ви не запитували відновлення паролю, просто проігноруйте цей лист. / If you didn't request a password reset, ignore this email.</p>
  </div>`;
  return { subject, html, text };
}
