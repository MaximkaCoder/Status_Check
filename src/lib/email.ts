import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM_EMAIL ?? "notifications@vitmark.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://status-check-henna.vercel.app";

export type EmailPayload =
  | { type: "ASSIGNED_ASSIGNEE"; itemTitle: string; itemId: string }
  | { type: "ASSIGNED_REVIEWER"; itemTitle: string; itemId: string }
  | { type: "STATUS_CHANGED"; itemTitle: string; itemId: string; newStatus: string; changedBy: string }
  | { type: "DEADLINE_APPROACHING"; itemTitle: string; itemId: string; deadline: Date };

const statusLabels: Record<string, string> = {
  TO_CHECK: "На перевірці",
  EXPIRED: "Прострочено",
  DONE: "Виконано",
  NOT_ACTUAL: "Не актуально",
  IDEAS_BACKLOG: "Ідеї / Беклог",
};

function layout(heading: string, body: string, itemId: string): string {
  const link = `${APP_URL}/items/${itemId}`;
  return `<!DOCTYPE html><html lang="uk"><head><meta charset="UTF-8"><style>
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;margin:0;padding:32px 16px}
.card{background:#fff;border-radius:14px;padding:32px;max-width:480px;margin:0 auto;border:1px solid #e2e8f0;box-shadow:0 1px 4px rgba(0,0,0,.06)}
h2{margin:0 0 10px;font-size:17px;color:#0f172a;font-weight:700}
p{margin:0 0 20px;font-size:14px;color:#475569;line-height:1.65}
strong{color:#1e293b}
a.btn{display:inline-block;background:#4f46e5;color:#fff!important;text-decoration:none;padding:11px 24px;border-radius:9px;font-size:14px;font-weight:600}
.footer{margin-top:28px;font-size:11px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px}
</style></head><body>
<div class="card">
<h2>${heading}</h2>
${body}
<a class="btn" href="${link}">Відкрити задачу →</a>
<div class="footer">StatusCheck · автоматичне повідомлення</div>
</div></body></html>`;
}

function build(data: EmailPayload): { subject: string; html: string } {
  switch (data.type) {
    case "ASSIGNED_ASSIGNEE":
      return {
        subject: `Вас призначено виконавцем: ${data.itemTitle}`,
        html: layout(
          "Нова задача",
          `<p>Вас призначено <strong>виконавцем</strong> задачі:<br><strong>${data.itemTitle}</strong></p>`,
          data.itemId
        ),
      };
    case "ASSIGNED_REVIEWER":
      return {
        subject: `Вас призначено рев'юером: ${data.itemTitle}`,
        html: layout(
          "Задача на перевірку",
          `<p>Вас призначено <strong>рев'юером</strong> задачі:<br><strong>${data.itemTitle}</strong></p>`,
          data.itemId
        ),
      };
    case "STATUS_CHANGED": {
      const label = statusLabels[data.newStatus] ?? data.newStatus;
      return {
        subject: `Статус змінено → «${label}»: ${data.itemTitle}`,
        html: layout(
          "Статус задачі змінено",
          `<p>Задача <strong>${data.itemTitle}</strong><br>отримала статус: <strong>${label}</strong><br>Змінив: ${data.changedBy}</p>`,
          data.itemId
        ),
      };
    }
    case "DEADLINE_APPROACHING": {
      const d = data.deadline.toLocaleString("uk-UA", {
        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
      });
      return {
        subject: `Дедлайн завтра: ${data.itemTitle}`,
        html: layout(
          "Нагадування про дедлайн",
          `<p>Задача <strong>${data.itemTitle}</strong><br>має дедлайн: <strong>${d}</strong></p>`,
          data.itemId
        ),
      };
    }
  }
}

export async function sendEmail(to: string, data: EmailPayload): Promise<void> {
  if (!resend) return;
  const { subject, html } = build(data);
  await resend.emails.send({ from: FROM, to, subject, html });
}
