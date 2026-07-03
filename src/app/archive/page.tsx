"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { StatusItem } from "@/lib/types";

export default function ArchivePage() {
  const { locale } = useLanguage();
  const uk = locale === "uk";
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [items, setItems] = useState<StatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmPurge, setConfirmPurge] = useState<StatusItem | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    fetch("/api/archive")
      .then((r) => (r.ok ? r.json() : []))
      .then((d: StatusItem[]) => setItems(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function restore(item: StatusItem) {
    setBusy(item.id);
    const r = await fetch(`/api/archive/${item.id}`, { method: "POST" });
    if (r.ok) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast(uk ? "Задачу відновлено" : "Item restored", "success");
    } else {
      toast(uk ? "Не вдалося відновити" : "Restore failed", "error");
    }
    setBusy(null);
  }

  async function purge(item: StatusItem) {
    setBusy(item.id);
    const r = await fetch(`/api/archive/${item.id}`, { method: "DELETE" });
    if (r.ok) {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast(uk ? "Видалено назавжди" : "Permanently deleted", "info");
    } else {
      toast(uk ? "Не вдалося видалити" : "Delete failed", "error");
    }
    setBusy(null);
  }

  function daysLeft(deletedAt: string | Date): number {
    const purgeAt = new Date(deletedAt).getTime() + 30 * 24 * 60 * 60 * 1000;
    return Math.max(0, Math.ceil((purgeAt - Date.now()) / 86_400_000));
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 animate-fade-in-up stagger-1">
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-border/60 flex-shrink-0">
            <svg className="h-4 w-4 text-slate-500 dark:text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-foreground">{uk ? "Архів" : "Archive"}</h1>
            <p className="text-xs text-muted-foreground">
              {uk ? "Видалені задачі зберігаються 30 днів" : "Deleted items are kept for 30 days"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-xs text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors cursor-pointer"
        >
          {uk ? "← Назад до дашборду" : "← Back to dashboard"}
        </button>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden animate-fade-in-up stagger-2">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground px-6 py-12 text-center">
            {uk ? "Архів порожній" : "Archive is empty"}
          </p>
        ) : (
          <div className="divide-y divide-border/40 animate-fade-in">
            {items.map((item, i) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-5 py-3.5 animate-row-in"
                style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-foreground truncate">{item.title}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {item.project && <span>{item.project} · </span>}
                    {uk ? "автовидалення через" : "auto-purge in"}{" "}
                    <span className="font-semibold">{item.deleted_at ? daysLeft(item.deleted_at) : "?"} {uk ? "дн" : "d"}</span>
                  </p>
                </div>

                <button
                  type="button"
                  disabled={busy === item.id}
                  onClick={() => restore(item)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0",
                    "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400",
                    "hover:bg-indigo-100 dark:hover:bg-indigo-900/50",
                    "cursor-pointer transition-colors disabled:opacity-40"
                  )}
                >
                  {uk ? "Відновити" : "Restore"}
                </button>
                <button
                  type="button"
                  disabled={busy === item.id}
                  onClick={() => setConfirmPurge(item)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0",
                    "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400",
                    "hover:bg-rose-100 dark:hover:bg-rose-900/40",
                    "cursor-pointer transition-colors disabled:opacity-40"
                  )}
                >
                  {uk ? "Назавжди" : "Forever"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmPurge && (
        <ConfirmDialog
          title={uk ? "Видалити назавжди?" : "Delete permanently?"}
          description={uk
            ? `«${confirmPurge.title}» буде видалено безповоротно, разом з файлами й коментарями.`
            : `"${confirmPurge.title}" will be permanently deleted along with files and comments.`}
          confirmLabel={uk ? "Видалити" : "Delete"}
          cancelLabel={uk ? "Скасувати" : "Cancel"}
          onConfirm={() => { const it = confirmPurge; setConfirmPurge(null); purge(it); }}
          onCancel={() => setConfirmPurge(null)}
        />
      )}
    </div>
  );
}
