const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Task title as a clickable link to the item page, safe for parse_mode HTML.
// Base URL comes from NEXT_PUBLIC_APP_URL; trailing slash is trimmed.
export function itemLink(itemId: string, title: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://tasker.semishan.pro").replace(/\/$/, "");
  return `<a href="${base}/items/${itemId}"><b>${escapeHtml(title)}</b></a>`;
}

export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  if (!BOT_TOKEN) return false;
  try {
    const res = await fetch(`${API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function setWebhook(webhookUrl: string): Promise<boolean> {
  if (!BOT_TOKEN) return false;
  try {
    const res = await fetch(`${API}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
