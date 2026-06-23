"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Project { id: string; name: string; created_at: string }

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function AdminProjectsPage() {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/projects");
      setItems(await r.json());
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function remove(item: Project) {
    if (!confirm(`Видалити проєкт «${item.name}»?`)) return;
    setBusy(item.id);
    await fetch(`/api/admin/projects/${item.id}`, { method: "DELETE" });
    await load(); setBusy(null);
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
        <div>
          <h2 className="text-base font-bold text-foreground">Проєкти</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{items.length} проєктів у системі</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {items.length === 0 && <p className="text-sm text-muted-foreground px-6 py-8">Немає проєктів</p>}
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-muted/20 transition-colors">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex-shrink-0">
                <svg className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground">{item.name}</span>
              </div>

              <span className="text-xs text-muted-foreground flex-shrink-0">{formatDate(item.created_at)}</span>

              <div className="flex gap-1.5 flex-shrink-0">
                <Link href={`/admin/projects/${item.id}/edit`}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/[0.10] cursor-pointer transition-colors">
                  Редагувати
                </Link>
                <button type="button" onClick={() => remove(item)} disabled={busy === item.id}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 hover:bg-rose-200 disabled:opacity-50 cursor-pointer transition-colors">
                  Видалити
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
