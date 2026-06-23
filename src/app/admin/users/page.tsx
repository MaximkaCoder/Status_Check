"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

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

export default function AdminUsersPage() {
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
    } catch { setError("Не вдалось завантажити"); }
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
          <h2 className="text-base font-bold text-foreground">Користувачі</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{users.length} акаунтів у системі</p>
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
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-6 py-3">Ім&apos;я</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-3">Email</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-3">Роль</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-3">Департамент</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-3">Статус</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-3">Дата реєстрації</th>
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
                    {u.isAdmin ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">Адмін</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-white/50">Учасник</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <select
                      disabled={busy === u.id}
                      value={u.department?.id ?? ""}
                      onChange={(e) => setDepartment(u, e.target.value || null)}
                      className={cn(
                        "text-xs rounded-lg px-2 py-1 border border-border/60 bg-background text-foreground",
                        "focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer",
                        "disabled:opacity-40 disabled:cursor-not-allowed"
                      )}
                    >
                      <option value="">— без департаменту —</option>
                      {depts.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3.5">
                    {u.blocked ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block" />
                        Заблоковано
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                        Активний
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
                        title={u.isAdmin ? "Не можна заблокувати адміна" : u.blocked ? "Розблокувати" : "Заблокувати"}
                        className={cn(
                          "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
                          u.blocked
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200"
                            : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200"
                        )}
                      >
                        {u.blocked ? "Розблокувати" : "Заблокувати"}
                      </button>
                      <button
                        type="button"
                        disabled={busy === u.id || u.isAdmin}
                        onClick={() => deleteUser(u)}
                        title={u.isAdmin ? "Не можна видалити адміна" : "Видалити"}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 hover:bg-rose-200 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Видалити
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
