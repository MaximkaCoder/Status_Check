"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Department { id: string; name: string; created_at: string }

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function AdminDepartmentsPage() {
  const [items, setItems] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editErr, setEditErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/departments");
      setItems(await r.json());
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function save(id: string) {
    if (!editName.trim()) return;
    setBusy(id); setEditErr(null);
    const r = await fetch(`/api/admin/departments/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    if (!r.ok) { const d = await r.json(); setEditErr(d.error); }
    else { setEditId(null); await load(); }
    setBusy(null);
  }

  async function remove(item: Department) {
    if (!confirm(`Видалити департамент «${item.name}»?`)) return;
    setBusy(item.id);
    await fetch(`/api/admin/departments/${item.id}`, { method: "DELETE" });
    await load(); setBusy(null);
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
        <div>
          <h2 className="text-base font-bold text-foreground">Департаменти</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{items.length} департаментів у системі</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {items.length === 0 && <p className="text-sm text-muted-foreground px-6 py-8">Немає департаментів</p>}
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-muted/20 transition-colors">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30 flex-shrink-0">
                <svg className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>

              {editId === item.id ? (
                <input
                  autoFocus
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") save(item.id); if (e.key === "Escape") setEditId(null); }}
                  className="flex-1 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-white/[0.06] border border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 text-foreground"
                />
              ) : (
                <span className="flex-1 text-sm font-medium text-foreground">{item.name}</span>
              )}

              <span className="text-xs text-muted-foreground flex-shrink-0">{formatDate(item.created_at)}</span>

              <div className="flex gap-1.5 flex-shrink-0">
                {editId === item.id ? (
                  <>
                    <button type="button" onClick={() => save(item.id)} disabled={busy === item.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 cursor-pointer transition-colors">
                      Зберегти
                    </button>
                    <button type="button" onClick={() => { setEditId(null); setEditErr(null); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer transition-colors">
                      Скасувати
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => { setEditId(item.id); setEditName(item.name); setEditErr(null); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/[0.10] cursor-pointer transition-colors">
                      Перейменувати
                    </button>
                    <button type="button" onClick={() => remove(item)} disabled={busy === item.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 hover:bg-rose-200 disabled:opacity-50 cursor-pointer transition-colors">
                      Видалити
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {editErr && <p className="text-xs text-rose-500 px-6 py-2">{editErr}</p>}
        </div>
      )}
    </div>
  );
}
