"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Project { id: string; name: string; description: string | null; }

const inputBase = cn(
  "w-full rounded-xl border border-border/60 bg-white dark:bg-white/[0.06]",
  "px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground",
  "focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400",
  "transition-all duration-150"
);

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/projects/${id}`)
      .then(r => r.json())
      .then((p: Project) => {
        setProject(p);
        setName(p.name);
        setDescription(p.description ?? "");
      })
      .catch(() => setError("Не вдалось завантажити"))
      .finally(() => setLoading(false));
  }, [id]);

  async function save() {
    if (!name.trim()) return;
    setSaving(true); setError(null);
    const r = await fetch(`/api/admin/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
    });
    if (r.ok) {
      router.push("/admin/projects");
    } else {
      const d = await r.json();
      setError(d.error ?? "Помилка збереження");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!project && !loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-rose-600">{error ?? "Проєкт не знайдено"}</p>
        <button type="button" onClick={() => router.push("/admin/projects")}
          className="mt-3 text-xs text-indigo-600 hover:underline font-semibold cursor-pointer">
          ← Назад до проєктів
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up stagger-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200/60 dark:border-indigo-500/30 flex-shrink-0">
            <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Редагування проєкту</h1>
        </div>
        <button type="button" onClick={() => router.push("/admin/projects")}
          className="mt-1 text-xs text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 font-medium cursor-pointer transition-colors">
          ← Назад до проєктів
        </button>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-card p-6 animate-fade-in-up stagger-2">
        <div className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="proj-name" className="block text-xs font-bold text-foreground/80 uppercase tracking-wider mb-1.5">
              Назва <span className="text-rose-500">*</span>
            </label>
            <input
              id="proj-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && save()}
              maxLength={120}
              className={inputBase}
              placeholder="Назва проєкту"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="proj-desc" className="block text-xs font-bold text-foreground/80 uppercase tracking-wider mb-1.5">
              Опис <span className="text-muted-foreground font-normal normal-case">(необов&apos;язково)</span>
            </label>
            <textarea
              id="proj-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={5}
              maxLength={2000}
              className={cn(inputBase, "resize-none leading-relaxed")}
              placeholder="Короткий опис проєкту..."
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{description.length}/2000</p>
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={save}
              disabled={saving || !name.trim()}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-500 text-white disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-opacity"
            >
              {saving ? (
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" />
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              Зберегти
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/projects")}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer transition-colors"
            >
              Скасувати
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
