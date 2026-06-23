"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function NewDepartmentPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!name.trim()) { setError("Назва обов'язкова"); return; }
    setSaving(true); setError(null);
    const r = await fetch("/api/admin/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    const data = await r.json();
    if (!r.ok) { setError(data.error ?? "Помилка"); setSaving(false); return; }
    router.push("/admin/departments");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 shadow-[0_2px_10px_rgba(99,102,241,0.4)]">
          <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h1 className="text-xl font-extrabold tracking-tight text-foreground">Новий департамент</h1>
      </div>
      <Link href="/admin/departments" className="text-xs text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors mb-6 inline-block">
        ← Назад до департаментів
      </Link>

      <div className={cn(
        "rounded-2xl p-6 border border-white/60 dark:border-white/[0.08]",
        "bg-white/60 dark:bg-white/[0.03]",
        "shadow-[0_2px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.3)]"
      )}>
        <div className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
              НАЗВА <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && save()}
              placeholder="Назва департаменту..."
              className={cn(
                "w-full rounded-xl px-4 py-2.5 text-sm",
                "bg-white/50 dark:bg-white/[0.04]",
                "border border-white/70 dark:border-white/[0.10]",
                "text-foreground placeholder:text-muted-foreground/50",
                "focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400",
                "transition-all duration-150"
              )}
              autoFocus
            />
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
              {saving ? "Створення..." : "Створити департамент"}
            </button>
            <Link
              href="/admin/departments"
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
