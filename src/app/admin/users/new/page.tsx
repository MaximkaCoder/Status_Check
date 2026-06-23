"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function NewUserPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!name.trim() || !email.trim() || !password) { setError("Всі обов'язкові поля мають бути заповнені"); return; }
    setSaving(true); setError(null);
    const r = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), password, isAdmin }),
    });
    const data = await r.json();
    if (!r.ok) { setError(data.error ?? "Помилка"); setSaving(false); return; }
    router.push("/admin/users");
  }

  const inputCls = cn(
    "w-full rounded-xl px-4 py-2.5 text-sm",
    "bg-white/50 dark:bg-white/[0.04]",
    "border border-white/70 dark:border-white/[0.10]",
    "text-foreground placeholder:text-muted-foreground/50",
    "focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400",
    "transition-all duration-150"
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 shadow-[0_2px_10px_rgba(99,102,241,0.4)]">
          <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Новий користувач</h1>
      </div>
      <Link href="/admin/users" className="text-xs text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors mb-6 inline-block">
        ← Назад до користувачів
      </Link>

      <div className={cn(
        "rounded-2xl p-6 border border-white/60 dark:border-white/[0.08]",
        "bg-white/60 dark:bg-white/[0.03]",
        "shadow-[0_2px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.3)]"
      )}>
        <div className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
              ІМ'Я <span className="text-rose-500">*</span>
            </label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Повне ім'я..." className={inputCls} autoFocus />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
              EMAIL <span className="text-rose-500">*</span>
            </label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@example.com" className={inputCls} />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
              ПАРОЛЬ <span className="text-rose-500">*</span>
            </label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Мінімум 6 символів" className={inputCls} />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={isAdmin}
              onClick={() => setIsAdmin(v => !v)}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
                "transition-colors duration-200 focus:outline-none",
                isAdmin ? "bg-indigo-500" : "bg-slate-300 dark:bg-white/20"
              )}
            >
              <span className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow",
                "transition-transform duration-200",
                isAdmin ? "translate-x-5" : "translate-x-0"
              )} />
            </button>
            <span className="text-sm font-medium text-foreground">Адміністратор</span>
          </div>

          {error && (
            <p className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className={cn(
                "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold",
                "bg-gradient-to-r from-indigo-500 to-violet-500 text-white",
                "shadow-[0_2px_10px_rgba(99,102,241,0.4)] hover:shadow-[0_4px_14px_rgba(99,102,241,0.5)]",
                "disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
              )}
            >
              {saving ? (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {saving ? "Створення..." : "Створити користувача"}
            </button>
            <Link
              href="/admin/users"
              className={cn(
                "inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold",
                "bg-white/50 dark:bg-white/[0.06] border border-white/70 dark:border-white/[0.10]",
                "text-muted-foreground hover:text-foreground transition-all duration-150"
              )}
            >
              Скасувати
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
