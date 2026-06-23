"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

const inputBase = cn(
  "w-full rounded-xl border border-border/60 bg-white dark:bg-white/[0.06]",
  "px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground",
  "focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400",
  "transition-all duration-150"
);

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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up stagger-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200/60 dark:border-indigo-500/30 flex-shrink-0">
            <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Новий користувач</h1>
        </div>
        <Link href="/admin/users"
          className="mt-1 text-xs text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">
          ← Назад до користувачів
        </Link>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-card p-6 animate-fade-in-up stagger-2 space-y-5">
        <div>
          <label htmlFor="user-name" className="block text-xs font-bold text-foreground/80 uppercase tracking-wider mb-1.5">
            Ім&apos;я <span className="text-rose-500">*</span>
          </label>
          <input id="user-name" type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Повне ім'я..." className={inputBase} autoFocus />
        </div>

        <div>
          <label htmlFor="user-email" className="block text-xs font-bold text-foreground/80 uppercase tracking-wider mb-1.5">
            Email <span className="text-rose-500">*</span>
          </label>
          <input id="user-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="user@example.com" className={inputBase} />
        </div>

        <div>
          <label htmlFor="user-password" className="block text-xs font-bold text-foreground/80 uppercase tracking-wider mb-1.5">
            Пароль <span className="text-rose-500">*</span>
          </label>
          <input id="user-password" type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && save()}
            placeholder="Мінімум 6 символів" className={inputBase} />
        </div>

        <div className="flex items-center gap-3 pt-1">
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
          <p className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={save} disabled={saving || !name.trim() || !email.trim() || !password}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-500 text-white disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-opacity">
            {saving
              ? <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" />
              : <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
            {saving ? "Створення..." : "Створити користувача"}
          </button>
          <Link href="/admin/users"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer transition-colors">
            Скасувати
          </Link>
        </div>
      </div>
    </div>
  );
}
