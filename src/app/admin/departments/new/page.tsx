"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface User { id: string; name: string; email: string; }

const inputBase = cn(
  "w-full rounded-xl border border-border/60 bg-white dark:bg-white/[0.06]",
  "px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground",
  "focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400",
  "transition-all duration-150"
);

function UserPicker({ allUsers, pending, onAdd, searchLabel, notFoundLabel, allAddedLabel }: {
  allUsers: User[]; pending: User[]; onAdd: (u: User) => void;
  searchLabel: string; notFoundLabel: string; allAddedLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (!open) return;
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const pendingIds = new Set(pending.map(u => u.id));
  const available = allUsers.filter(u =>
    !pendingIds.has(u.id) &&
    (u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
          "text-xs font-semibold border-2 transition-all duration-150 cursor-pointer",
          "border-indigo-400/60 text-indigo-600 dark:text-indigo-400",
          "hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
        )}
      >
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        {t("addUserBtn")}
      </button>

      {open && (
        <div className={cn(
          "absolute right-0 top-full mt-1.5 w-72 z-50",
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
              placeholder={searchLabel}
              className="w-full rounded-lg px-3 py-1.5 text-xs bg-muted/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {available.length === 0 ? (
              <p className="text-xs text-muted-foreground px-3 py-3 text-center">
                {query ? notFoundLabel : allAddedLabel}
              </p>
            ) : available.map(u => (
              <button key={u.id} type="button" onClick={() => { onAdd(u); setOpen(false); setQuery(""); }}
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

export default function NewDepartmentPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users").then(r => r.json()).then(setAllUsers);
  }, []);

  async function save() {
    if (!name.trim()) return;
    setSaving(true); setSaveErr(null);
    const r = await fetch("/api/admin/departments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (!r.ok) {
      const d = await r.json();
      setSaveErr(d.error ?? t("createError"));
      setSaving(false); return;
    }
    const dept = await r.json();
    await Promise.all(pendingUsers.map(u =>
      fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentId: dept.id }),
      })
    ));
    router.push("/admin/departments");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up stagger-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30 border border-violet-200/60 dark:border-violet-500/30 flex-shrink-0">
            <svg className="h-5 w-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{t("newDeptTitle")}</h1>
        </div>
        <button type="button" onClick={() => router.push("/admin/departments")}
          className="mt-1 text-xs text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 font-medium cursor-pointer transition-colors">
          {t("backToDepartments")}
        </button>
      </div>

      {/* Name */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-card p-6 animate-fade-in-up stagger-2 space-y-5">
        <div>
          <label htmlFor="dept-name" className="block text-xs font-bold text-foreground/80 uppercase tracking-wider mb-1.5">
            {t("nameLabel")} <span className="text-rose-500">*</span>
          </label>
          <input id="dept-name" type="text" value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && save()} maxLength={120}
            className={inputBase} placeholder={t("deptNamePlaceholder")} autoFocus />
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
            {saving ? t("creatingLabel") : t("createDeptBtn")}
          </button>
          <button type="button" onClick={() => router.push("/admin/departments")}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer transition-colors">
            {t("cancelBtn")}
          </button>
        </div>
      </div>

      {/* Members */}
      <div className="relative z-10 rounded-2xl border border-border/60 bg-card shadow-card p-6 animate-fade-in-up stagger-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-foreground">{t("deptMembersTitle")}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{pendingUsers.length} {t("membersCountLabel")}</p>
          </div>
          <UserPicker
            allUsers={allUsers}
            pending={pendingUsers}
            onAdd={u => setPendingUsers(p => [...p, u])}
            searchLabel={t("searchPlaceholder")}
            notFoundLabel={t("notFoundLabel")}
            allAddedLabel={t("allAddedLabel")}
          />
        </div>

        {pendingUsers.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border/60 rounded-xl">
            {t("noMembersLabel")}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {pendingUsers.map(u => (
              <div key={u.id}
                className={cn(
                  "inline-flex items-center gap-2 pl-1 pr-2 py-1 rounded-full",
                  "border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-950",
                  "text-xs font-semibold text-indigo-700 dark:text-indigo-300"
                )}>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-white text-[9px] font-bold flex-shrink-0">
                  {u.name.charAt(0).toUpperCase()}
                </span>
                <span>{u.name}</span>
                <button type="button"
                  onClick={() => setPendingUsers(p => p.filter(m => m.id !== u.id))}
                  className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 cursor-pointer transition-colors">
                  <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
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
