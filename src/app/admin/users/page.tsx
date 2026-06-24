"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface Department { id: string; name: string; }
interface AdminUser {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  blocked: boolean;
  created_at: string;
  department: { id: string; name: string } | null;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function RolePicker({ user, busy, onChange, adminLabel, memberLabel }: {
  user: AdminUser; busy: boolean; onChange: (isAdmin: boolean) => void;
  adminLabel: string; memberLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const roles = [
    { label: adminLabel, value: true },
    { label: memberLabel, value: false },
  ];

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen(v => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
          "text-xs font-semibold border-2 transition-all duration-150 cursor-pointer",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          user.isAdmin
            ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
            : "border-border text-muted-foreground hover:border-slate-400"
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", user.isAdmin ? "bg-indigo-500" : "bg-slate-400")} />
        {user.isAdmin ? adminLabel : memberLabel}
        <svg className={cn("h-3 w-3 transition-transform", open && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className={cn(
          "absolute left-0 top-full mt-1.5 z-50 min-w-[130px]",
          "rounded-xl border border-border/60 bg-white dark:bg-[#0f1029]",
          "shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)]",
          "py-1.5 overflow-hidden"
        )}>
          {roles.map(r => {
            const isActive = user.isAdmin === r.value;
            return (
              <button
                key={String(r.value)}
                type="button"
                onClick={() => { setOpen(false); if (!isActive) onChange(r.value); }}
                className={cn(
                  "w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-2 transition-colors duration-100",
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
                    : "text-foreground hover:bg-muted/40"
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", isActive ? "bg-indigo-500" : "bg-muted-foreground/40")} />
                {r.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DeptPicker({ user, depts, busy, onChange, noDeptLabel, searchLabel, notFoundLabel, allAddedLabel }: {
  user: AdminUser;
  depts: Department[];
  busy: boolean;
  onChange: (deptId: string | null) => void;
  noDeptLabel: string; searchLabel: string; notFoundLabel: string; allAddedLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function pick(deptId: string | null) {
    setOpen(false);
    if (deptId !== (user.department?.id ?? null)) onChange(deptId);
  }

  const hasDept = !!user.department;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen(v => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
          "text-xs font-semibold border-2 transition-all duration-150 cursor-pointer",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          hasDept
            ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
            : "border-border text-muted-foreground hover:border-indigo-300 hover:text-indigo-600"
        )}
      >
        {hasDept && <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 inline-block flex-shrink-0" />}
        <span>{user.department?.name ?? noDeptLabel}</span>
        <svg className={cn("h-3 w-3 transition-transform", open && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className={cn(
          "absolute left-0 top-full mt-1.5 z-50 min-w-[180px]",
          "rounded-xl border border-border/60 bg-white dark:bg-[#0f1029]",
          "shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)]",
          "py-1.5 overflow-hidden"
        )}>
          <button
            type="button"
            onClick={() => pick(null)}
            className={cn(
              "w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-2",
              "transition-colors duration-100",
              !user.department
                ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", !user.department ? "bg-indigo-500" : "bg-transparent border border-border")} />
            {noDeptLabel}
          </button>

          <div className="my-1 h-px bg-border/40 mx-2" />

          {depts.map(d => {
            const isActive = user.department?.id === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => pick(d.id)}
                className={cn(
                  "w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-2",
                  "transition-colors duration-100",
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
                    : "text-foreground hover:bg-muted/40"
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", isActive ? "bg-indigo-500" : "bg-muted-foreground/40")} />
                {d.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [ur, dr] = await Promise.all([
        fetch("/api/admin/users").then(r => r.json()),
        fetch("/api/admin/departments").then(r => r.json()),
      ]);
      setUsers(ur);
      setDepts(dr);
    } catch { setError(t("failedLoadLabel")); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function toggleBlock(user: AdminUser) {
    setBusy(user.id);
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocked: !user.blocked }),
    });
    await load();
    setBusy(null);
  }

  async function toggleRole(user: AdminUser, isAdmin: boolean) {
    setBusy(user.id);
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAdmin }),
    });
    await load();
    setBusy(null);
  }

  async function setDepartment(user: AdminUser, deptId: string | null) {
    setBusy(user.id);
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ departmentId: deptId }),
    });
    await load();
    setBusy(null);
  }

  async function deleteUser(user: AdminUser) {
    if (!confirm(`Видалити користувача «${user.name}»? Цю дію неможливо скасувати.`)) return;
    setBusy(user.id);
    await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    await load();
    setBusy(null);
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
        <div>
          <h2 className="text-base font-bold text-foreground">{t("usersPageTitle")}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{users.length} {t("accountsLabel")}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      ) : error ? (
        <p className="text-sm text-rose-600 px-6 py-8">{error}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-6 py-3">{t("tableColName")}</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-3">Email</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-3">{t("tableColRole")}</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-3">{t("tableColDepartment")}</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-3">{t("tableColStatus")}</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-3">{t("tableColRegDate")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {users.map((u) => (
                <tr key={u.id} className={cn("transition-colors hover:bg-muted/20", u.blocked && "opacity-60")}>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-white text-[11px] font-bold flex-shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="font-medium text-foreground">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3.5">
                    <RolePicker
                      user={u}
                      busy={busy === u.id}
                      onChange={(isAdmin) => toggleRole(u, isAdmin)}
                      adminLabel={t("roleAdmin")}
                      memberLabel={t("roleMember")}
                    />
                  </td>
                  <td className="px-4 py-3.5">
                    <DeptPicker
                      user={u}
                      depts={depts}
                      busy={busy === u.id}
                      onChange={(deptId) => setDepartment(u, deptId)}
                      noDeptLabel={t("noDepartmentOption")}
                      searchLabel={t("searchPlaceholder")}
                      notFoundLabel={t("notFoundLabel")}
                      allAddedLabel={t("allAddedLabel")}
                    />
                  </td>
                  <td className="px-4 py-3.5">
                    {u.blocked ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block" />
                        {t("blockedStatus")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                        {t("activeStatus")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground text-xs">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        disabled={busy === u.id || u.isAdmin}
                        onClick={() => toggleBlock(u)}
                        title={u.isAdmin ? t("cannotBlockAdmin") : u.blocked ? t("unblockUserBtn") : t("blockUserBtn")}
                        className={cn(
                          "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
                          u.blocked
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200"
                            : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200"
                        )}
                      >
                        {u.blocked ? t("unblockUserBtn") : t("blockUserBtn")}
                      </button>
                      <button
                        type="button"
                        disabled={busy === u.id || u.isAdmin}
                        onClick={() => deleteUser(u)}
                        title={u.isAdmin ? t("cannotDeleteAdmin") : t("deleteBtn")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 hover:bg-rose-200 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {t("deleteBtn")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
