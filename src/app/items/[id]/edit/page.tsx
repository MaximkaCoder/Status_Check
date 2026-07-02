"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ItemForm } from "@/components/forms/ItemForm";
import { Spinner } from "@/components/ui/Spinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useLanguage } from "@/contexts/LanguageContext";
import { getItemById } from "@/lib/api-client";
import type { StatusItem } from "@/lib/types";

interface ItemFile { id: string; name: string; url: string; size: number; created_at: string; }

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "🖼";
  if (ext === "pdf") return "📄";
  if (["doc", "docx"].includes(ext)) return "📝";
  if (["xls", "xlsx", "csv"].includes(ext)) return "📊";
  if (["zip", "rar", "7z"].includes(ext)) return "📦";
  return "📎";
}

export default function EditItemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();

  const [item, setItem] = useState<StatusItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [files, setFiles] = useState<ItemFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [fileBusy, setFileBusy] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      try {
        const [data, filesData] = await Promise.all([
          getItemById(id),
          fetch(`/api/items/${id}/files`).then(r => r.ok ? r.json() : []),
        ]);
        if (!cancelled) { setItem(data); setFiles(filesData); }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : t("failedLoad");
          setError(msg.includes("404") || msg.toLowerCase().includes("not found")
            ? t("itemNotFound") : msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { setUploadErr("Максимальний розмір файлу 20 МБ"); return; }
    setUploading(true); setUploadErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch(`/api/items/${id}/files`, { method: "POST", body: fd });
      if (r.ok) {
        const f = await r.json();
        setFiles(prev => [f, ...prev]);
      } else {
        const d = await r.json().catch(() => ({}));
        setUploadErr(d.error ?? "Помилка завантаження");
      }
    } catch {
      setUploadErr("Помилка мережі");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploading(false);
  }

  async function deleteFile(file: ItemFile) {
    if (!confirm(`Видалити файл «${file.name}»?`)) return;
    setFileBusy(file.id);
    await fetch(`/api/items/${id}/files/${file.id}`, { method: "DELETE" });
    setFiles(prev => prev.filter(f => f.id !== file.id));
    setFileBusy(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">{t("loadingItem")}</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-in">
        <div className="rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-900/20 px-4 py-4 text-sm text-rose-700 dark:text-rose-300 flex items-center gap-2 mb-4">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {error ?? t("itemNotFound")}
        </div>
        <button onClick={() => router.push("/")} className="text-sm text-indigo-600 hover:underline underline-offset-2 font-semibold cursor-pointer" type="button">
          {t("backToDashboard")}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up stagger-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200/60 dark:border-indigo-500/30 flex-shrink-0">
            <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{t("editItemTitle")}</h1>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm text-muted-foreground truncate max-w-sm">{item.title}</p>
          <StatusBadge status={item.status} />
        </div>
        <button onClick={() => router.push("/")} className="mt-2 text-xs text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 font-medium cursor-pointer transition-colors" type="button">
          {t("backToDashboard")}
        </button>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-card p-6 animate-fade-in-up stagger-2">
        <ItemForm
          mode="edit"
          itemId={id}
          defaultValues={{
            title: item.title,
            description: item.description ?? "",
            deadline: item.deadline ? item.deadline.toString() : "",
            creator_name: item.creator_name,
            project:  item.project  ?? "",
            assignee: item.assignee ?? "",
            reviewer: item.reviewer ?? "",
            status: item.status,
            priority: item.priority,
          }}
        />
      </div>

      {/* Files card */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-card p-6 animate-fade-in-up stagger-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-foreground">Файли</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{files.length} файлів · макс. 20 МБ</p>
          </div>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
              "text-xs font-semibold border-2 transition-all duration-150 cursor-pointer",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "border-violet-400/60 text-violet-600 dark:text-violet-400",
              "hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/40"
            )}
          >
            {uploading
              ? <span className="h-3 w-3 rounded-full border-2 border-violet-500 border-t-transparent animate-spin inline-block" />
              : <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>}
            Завантажити
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={uploadFile} />
        </div>

        {uploadErr && (
          <p className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2 mb-3">
            {uploadErr}
          </p>
        )}

        {files.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border/60 rounded-xl">
            Немає файлів
          </p>
        ) : (
          <div className="space-y-2">
            {files.map(f => (
              <div key={f.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl",
                  "border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors",
                  fileBusy === f.id && "opacity-50"
                )}>
                <span className="text-lg flex-shrink-0 leading-none">{fileIcon(f.name)}</span>
                <div className="flex-1 min-w-0">
                  <a href={f.url} target="_blank" rel="noreferrer"
                    className="text-xs font-semibold text-foreground hover:text-indigo-600 dark:hover:text-indigo-400 truncate block transition-colors">
                    {f.name}
                  </a>
                  <p className="text-[10px] text-muted-foreground">{fmtSize(f.size)}</p>
                </div>
                <button type="button" disabled={fileBusy === f.id}
                  onClick={() => deleteFile(f)}
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:cursor-not-allowed flex-shrink-0">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
