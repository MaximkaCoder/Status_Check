"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Project { id: string; name: string; created_at: string }

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function AdminProjectsPage() {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const newRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/projects");
      setItems(await r.json());
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function create() {
    if (!newName.trim()) return;
    setCreating(true); setError(null);
    const r = await fetch("/api/admin/projects", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (!r.ok) { const d = await r.json(); setError(d.error); }
    else { setNewName(""); await load(); }
    setCreating(false);
  }

  async function save(id: string) {
    if (!editName.trim()) return;
    setBusy(id); setError(null);
    const r = await fetch(`/api/admin/projects/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    if (!r.ok) { const d = await r.json(); setError(d.error); }
    else { setEditId(null); await load(); }
    setBusy(null);
  }

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

      {/* Create form */}
      <div className="px-6 py-4 border-b border-border/40 bg-muted/20">
        <div className="flex gap-2 items-center max-w-md">
          <input
            ref={newRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder="Назва нового проєкту..."
            className={cn(
              "flex-1 rounded-xl px-3.5 py-2 text-sm",
              "bg-white dark:bg-white/[0.06] border border-border/60",
              "text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400",
              "transition-all duration-150"
            )}
          />
          <button
            type="button"
            onClick={create}
            disabled={creating || !newName.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-500 text-white disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-opacity"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Додати
          </button>
        </div>
        {error && <p className="text-xs text-rose-500 mt-2">{error}</p>}
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
                    <button type="button" onClick={() => setEditId(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer transition-colors">
                      Скасувати
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => { setEditId(item.id); setEditName(item.name); setError(null); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/[0.10] cursor-pointer transition-colors">
                      Редагувати
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
        </div>
      )}
    </div>
  );
}
