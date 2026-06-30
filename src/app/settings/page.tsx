"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface UserSettings {
  telegramChatId: string | null;
  notifyVia: string[];
  notifyOnAssign: boolean;
  notifyOnComment: boolean;
  notifyOnStatus: boolean;
  deadlineHours: number[];
}

const DEADLINE_OPTIONS = [
  { hours: 1, label: "1 год" },
  { hours: 6, label: "6 год" },
  { hours: 24, label: "1 день" },
  { hours: 72, label: "3 дні" },
  { hours: 168, label: "1 тиждень" },
];

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 cursor-pointer",
        "disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none",
        checked ? "bg-indigo-500" : "bg-slate-200 dark:bg-white/10"
      )}
    >
      <span className={cn(
        "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200",
        checked ? "translate-x-[18px]" : "translate-x-[3px]"
      )} />
    </button>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border/60">
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Telegram connection state
  const [tgCode, setTgCode] = useState<string | null>(null);
  const [tgBot, setTgBot] = useState("");
  const [tgConnecting, setTgConnecting] = useState(false);
  const [tgPolling, setTgPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/users/settings");
    if (res.ok) setSettings(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (patch: Partial<UserSettings>) => {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    setSaving(true);
    await fetch("/api/users/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [settings]);

  async function connectTelegram() {
    setTgConnecting(true);
    const res = await fetch("/api/telegram/connect", { method: "POST" });
    if (res.ok) {
      const { token, botUsername } = await res.json();
      setTgCode(token);
      setTgBot(botUsername);
      setTgPolling(true);
    }
    setTgConnecting(false);
  }

  async function disconnectTelegram() {
    await fetch("/api/telegram/connect", { method: "DELETE" });
    setSettings(s => s ? { ...s, telegramChatId: null } : s);
    setTgCode(null);
    setTgPolling(false);
  }

  // Poll for Telegram connection
  useEffect(() => {
    if (!tgPolling) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      const res = await fetch("/api/users/settings");
      if (res.ok) {
        const s: UserSettings = await res.json();
        if (s.telegramChatId) {
          setSettings(s);
          setTgPolling(false);
          setTgCode(null);
        }
      }
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [tgPolling]);

  function toggleChannel(ch: string) {
    if (!settings) return;
    const has = settings.notifyVia.includes(ch);
    // "app" can't be disabled alone — always keep at least one channel
    const next = has
      ? settings.notifyVia.filter(v => v !== ch)
      : [...settings.notifyVia, ch];
    if (next.length === 0) return;
    save({ notifyVia: next });
  }

  function toggleDeadlineHour(hours: number) {
    if (!settings) return;
    const has = settings.deadlineHours.includes(hours);
    const next = has
      ? settings.deadlineHours.filter(h => h !== hours)
      : [...settings.deadlineHours, hours].sort((a, b) => a - b);
    if (next.length === 0) return;
    save({ deadlineHours: next });
  }

  if (!user) return null;
  if (!settings) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const tgConnected = !!settings.telegramChatId;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Налаштування</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Профіль та сповіщення</p>
        </div>
        {(saving || saved) && (
          <span className={cn(
            "text-xs font-medium px-3 py-1.5 rounded-full transition-colors",
            saved ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
          )}>
            {saved ? "Збережено" : "Зберігаємо..."}
          </span>
        )}
      </div>

      {/* Profile */}
      <Section title="Профіль">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Ім&apos;я</p>
            <p className="text-sm font-medium text-foreground">{user.name}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Email</p>
            <p className="text-sm font-medium text-foreground">{user.email}</p>
          </div>
        </div>
      </Section>

      {/* Channels */}
      <Section
        title="Канали сповіщень"
        description="Де отримувати сповіщення"
      >
        <Row label="В застосунку" description="Дзвіночок у шапці сайту">
          <Toggle
            checked={settings.notifyVia.includes("app")}
            onChange={() => toggleChannel("app")}
          />
        </Row>

        <div className="h-px bg-border/40" />

        {/* Telegram row */}
        <div className="space-y-3">
          <Row label="Telegram" description="Надсилати повідомлення до Telegram-боту">
            <Toggle
              checked={settings.notifyVia.includes("telegram")}
              onChange={() => toggleChannel("telegram")}
            />
          </Row>

          {settings.notifyVia.includes("telegram") && (
            <div className={cn(
              "rounded-xl p-4 border",
              tgConnected
                ? "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/10"
                : "border-border/60 bg-muted/30"
            )}>
              {tgConnected ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Telegram підключено</span>
                    </div>
                    <button
                      type="button"
                      onClick={disconnectTelegram}
                      className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      Від&apos;єднати
                    </button>
                  </div>
                </div>
              ) : tgCode ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Очікуємо підключення...</span>
                  </div>
                  <a
                    href={`https://t.me/${tgBot || "reminder_7_growth_bot"}?start=${tgCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl",
                      "bg-[#229ED9] hover:bg-[#1e8ec2] text-white text-sm font-semibold",
                      "transition-colors cursor-pointer"
                    )}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current flex-shrink-0">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                    Відкрити @{tgBot || "reminder_7_growth_bot"} в Telegram
                  </a>
                  <p className="text-xs text-muted-foreground text-center">
                    Натисніть <b>Start</b> у боті — підключення відбудеться автоматично
                  </p>
                  <button
                    type="button"
                    onClick={() => { setTgCode(null); setTgPolling(false); }}
                    className="text-xs text-muted-foreground hover:underline cursor-pointer w-full text-center"
                  >
                    Скасувати
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={tgConnecting}
                  onClick={connectTelegram}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl",
                    "bg-[#229ED9] hover:bg-[#1e8ec2] text-white text-sm font-semibold",
                    "transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                  {tgConnecting ? "Генерація коду..." : "Підключити Telegram"}
                </button>
              )}
            </div>
          )}
        </div>
      </Section>

      {/* Events */}
      <Section
        title="Події"
        description="Про що сповіщати"
      >
        <Row label="Призначення задачі" description="Коли вас призначають виконавцем або рецензентом">
          <Toggle
            checked={settings.notifyOnAssign}
            onChange={v => save({ notifyOnAssign: v })}
          />
        </Row>
        <div className="h-px bg-border/40" />
        <Row label="Нові коментарі" description="Коли хтось коментує задачу, де ви залучені">
          <Toggle
            checked={settings.notifyOnComment}
            onChange={v => save({ notifyOnComment: v })}
          />
        </Row>
        <div className="h-px bg-border/40" />
        <Row label="Зміна статусу" description="Коли статус задачі змінюється">
          <Toggle
            checked={settings.notifyOnStatus}
            onChange={v => save({ notifyOnStatus: v })}
          />
        </Row>
      </Section>

      {/* Deadline reminders */}
      <Section
        title="Нагадування про дедлайн"
        description="За скільки до дедлайну надсилати нагадування (можна обрати декілька)"
      >
        <div className="flex flex-wrap gap-2">
          {DEADLINE_OPTIONS.map(({ hours, label }) => {
            const active = settings.deadlineHours.includes(hours);
            return (
              <button
                key={hours}
                type="button"
                onClick={() => toggleDeadlineHour(hours)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all duration-150 cursor-pointer",
                  active
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                    : "border-border/60 text-muted-foreground hover:border-indigo-300 hover:text-indigo-600"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Нагадування надходять у вибрані вами канали сповіщень.
        </p>
      </Section>
    </div>
  );
}
