"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface User { id: string; name: string; email: string; }
interface Member { id: string; userId: string; user: User; }
interface ProjectFile { id: string; name: string; url: string; size: number; created_at: string; }
interface Project {
  id: string; name: string; description: string | null;
  members: Member[]; files: ProjectFile[];
}

const inputBase = cn(
  "w-full rounded-xl border border-border/60 bg-white dark:bg-white/[0.06]",
  "px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground",
  "focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400",
  "transition-all duration-150"
);

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "🖼";
  if (["pdf"].includes(ext)) return "📄";
  if (["doc", "docx"].includes(ext)) return "📝";
  if (["xls", "xlsx", "csv"].includes(ext)) return "📊";
  if (["zip", "rar", "7z"].includes(ext)) return "📦";
  return "📎";
}

// ── User picker dropdown ──────────────────────────────────────────────────────
function UserPicker({ allUsers, members, projectId, onAdd }: {
  allUsers: User[]; members: Member[]; projectId: string;
  onAdd: (member: Member) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const memberIds = new Set(members.map(m => m.userId));
  const available = allUsers.filter(u =>
    !memberIds.has(u.id) &&
    (u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()))
  );

  async function add(user: User) {
    setBusy(true);
    const r = await fetch(`/api/admin/projects/${projectId}/members`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    if (r.ok) { const m = await r.json(); onAdd(m); }
    setOpen(false); setQuery(""); setBusy(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen(v => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
          "text-xs font-semibold border-2 transition-all duration-150 cursor-pointer",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "border-indigo-400/60 text-indigo-600 dark:text-indigo-400",
          "hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
        )}
      >
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        Додати користувача
      </button>

      {open && (
        <div className={cn(
          "absolute left-0 top-full mt-1.5 z-50 w-72",
          "rounded-xl border border-border/60 bg-white dark:bg-[#0f1029]",
          "shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)]",
          "overflow-hidden"
        )}>
          <div className="p-2 border-b border-border/40">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Пошук..."
              className="w-full rounded-lg px-3 py-1.5 text-xs bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {available.length === 0 ? (
              <p className="text-xs text-muted-foreground px-3 py-3 text-center">
                {query ? "Не знайдено" : "Всі вже додані"}
              </p>
            ) : available.map(u => (
              <button key={u.id} type="button" onClick={() => add(u)}
                className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-muted/40 transition-colors">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-white text-[10px] font-bold flex-shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{u.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [memberBusy, setMemberBusy] = useState<string | null>(null);
  const [fileBusy, setFileBusy] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/projects/${id}`).then(r => r.json()),
      fetch("/api/admin/users").then(r => r.json()),
    ]).then(([p, u]) => {
      setProject(p);
      setName(p.name);
      setDescription(p.description ?? "");
      setAllUsers(u);
    }).catch(() => setLoadErr("Не вдалось завантажити")).finally(() => setLoading(false));
  }, [id]);

  async function save() {
    if (!name.trim()) return;
    setSaving(true); setSaveErr(null);
    const r = await fetch(`/api/admin/projects/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
    });
    if (r.ok) {
      router.push("/admin/projects");
    } else {
      const d = await r.json();
      setSaveErr(d.error ?? "Помилка збереження");
    }
    setSaving(false);
  }

  async function removeMember(member: Member) {
    setMemberBusy(member.userId);
    await fetch(`/api/admin/projects/${id}/members/${member.userId}`, { method: "DELETE" });
    setProject(p => p ? { ...p, members: p.members.filter(m => m.userId !== member.userId) } : p);
    setMemberBusy(null);
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { alert("Максимальний розмір файлу 20 МБ"); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch(`/api/admin/projects/${id}/files`, { method: "POST", body: fd });
    if (r.ok) {
      const f = await r.json();
      setProject(p => p ? { ...p, files: [f, ...p.files] } : p);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploading(false);
  }

  async function deleteFile(file: ProjectFile) {
    if (!confirm(`Видалити файл «${file.name}»?`)) return;
    setFileBusy(file.id);
    await fetch(`/api/admin/projects/${id}/files/${file.id}`, { method: "DELETE" });
    setProject(p => p ? { ...p, files: p.files.filter(f => f.id !== file.id) } : p);
    setFileBusy(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-rose-600">{loadErr ?? "Проєкт не знайдено"}</p>
        <button type="button" onClick={() => router.push("/admin/projects")}
          className="mt-3 text-xs text-indigo-600 hover:underline font-semibold cursor-pointer">
          ← Назад до проєктів
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

      {/* ── Main fields ── */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-card p-6 animate-fade-in-up stagger-2 space-y-5">
        <div>
          <label htmlFor="proj-name" className="block text-xs font-bold text-foreground/80 uppercase tracking-wider mb-1.5">
            Назва <span className="text-rose-500">*</span>
          </label>
          <input id="proj-name" type="text" value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && save()} maxLength={120}
            className={inputBase} placeholder="Назва проєкту" autoFocus />
        </div>

        <div>
          <label htmlFor="proj-desc" className="block text-xs font-bold text-foreground/80 uppercase tracking-wider mb-1.5">
            Опис <span className="text-muted-foreground font-normal normal-case">(необов&apos;язково)</span>
          </label>
          <textarea id="proj-desc" value={description} onChange={e => setDescription(e.target.value)}
            rows={4} maxLength={2000} className={cn(inputBase, "resize-none leading-relaxed")}
            placeholder="Короткий опис проєкту..." />
          <p className="text-xs text-muted-foreground mt-1 text-right">{description.length}/2000</p>
        </div>

        {saveErr && (
          <p className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 rounded-lg px-3 py-2">
            {saveErr}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={save} disabled={saving || !name.trim()}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-500 text-white disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-opacity">
            {saving
              ? <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" />
              : <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
            Зберегти
          </button>
          <button type="button" onClick={() => router.push("/admin/projects")}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer transition-colors">
            Скасувати
          </button>
        </div>
      </div>

      {/* ── Members ── */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-card p-6 animate-fade-in-up stagger-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-foreground">Доступ користувачів</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{project.members.length} учасників</p>
          </div>
          <UserPicker
            allUsers={allUsers}
            members={project.members}
            projectId={id}
            onAdd={m => setProject(p => p ? { ...p, members: [...p.members, m] } : p)}
          />
        </div>

        {project.members.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border/60 rounded-xl">
            Немає учасників
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {project.members.map(m => (
              <div key={m.userId}
                className={cn(
                  "inline-flex items-center gap-2 pl-1 pr-2 py-1 rounded-full",
                  "border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-950",
                  "text-xs font-semibold text-indigo-700 dark:text-indigo-300",
                  memberBusy === m.userId && "opacity-50"
                )}>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-white text-[9px] font-bold flex-shrink-0">
                  {m.user.name.charAt(0).toUpperCase()}
                </span>
                <span>{m.user.name}</span>
                <button type="button" disabled={memberBusy === m.userId}
                  onClick={() => removeMember(m)}
                  className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 cursor-pointer transition-colors disabled:cursor-not-allowed">
                  <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Files ── */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-card p-6 animate-fade-in-up stagger-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-foreground">Файли</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{project.files.length} файлів · макс. 20 МБ</p>
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

        {project.files.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border/60 rounded-xl">
            Немає файлів
          </p>
        ) : (
          <div className="space-y-2">
            {project.files.map(f => (
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
