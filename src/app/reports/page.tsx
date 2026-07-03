"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { translations } from "@/lib/i18n";

interface LeaderRow { name: string; closed: number; activity: number; comments: number; perDay: number[]; score: number }
interface ClosedRow { id: string; title: string; doneBy: string | null; doneAt: string | null; department: string | null; project: string | null; leadDays: number | null }
interface Report {
  range: { start: string; end: string };
  kpis: { closed: number; created: number; inProgress: number; overdue: number; closedDelta: number; createdDelta: number };
  avgLeadTime: number | null;
  leaderboard: LeaderRow[];
  closed: ClosedRow[];
}

const AVATAR_COLORS = ["bg-indigo-500","bg-violet-500","bg-pink-500","bg-rose-500","bg-amber-500","bg-emerald-500","bg-cyan-500","bg-sky-500","bg-teal-500","bg-orange-500"];
function avatarColor(name: string) {
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function pad(n: number) { return n.toString().padStart(2, "0"); }
function weekParamFor(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset * 7);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function fmtRange(startIso: string, endIso: string, locale: string) {
  const s = new Date(startIso), e = new Date(endIso);
  const m = locale === "uk" ? translations.uk.monthsGenitive : translations.en.months;
  if (locale === "uk") return `${s.getDate()} ${m[s.getMonth()]} – ${e.getDate()} ${m[e.getMonth()]} ${e.getFullYear()}`;
  return `${m[s.getMonth()]} ${s.getDate()} – ${m[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
}
function fmtDay(iso: string, locale: string) {
  const d = new Date(iso);
  const m = locale === "uk" ? translations.uk.monthsGenitive : translations.en.months;
  return locale === "uk" ? `${d.getDate()} ${m[d.getMonth()]}` : `${m[d.getMonth()]} ${d.getDate()}`;
}

// Animated count-up
function CountUp({ value }: { value: number }) {
  const [n, setN] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    let raf = 0;
    const from = ref.current;
    const start = performance.now();
    const dur = 600;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(from + (value - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else ref.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{n}</>;
}

function Delta({ value }: { value: number }) {
  if (value === 0) return <span className="text-[10px] font-semibold text-muted-foreground">±0</span>;
  const up = value > 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[10px] font-bold", up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400")}>
      <svg className={cn("h-2.5 w-2.5", !up && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
      </svg>
      {Math.abs(value)}
    </span>
  );
}

function StatChip({ icon, value, label, tone }: { icon: React.ReactNode; value: number; label: string; tone?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium bg-muted/60 border border-border/50", tone)}>
      {icon}
      <span className="font-bold tabular-nums">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

function KpiCard({ label, value, delta, tone, icon, stagger }: {
  label: string; value: number; delta?: number; tone: string; icon: React.ReactNode; stagger: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border/60 bg-card shadow-card p-4 animate-fade-in-up", stagger)}>
      <div className="flex items-center justify-between mb-2">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl", tone)}>{icon}</div>
        {delta !== undefined && <Delta value={delta} />}
      </div>
      <p className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums"><CountUp value={value} /></p>
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}

export default function ReportsPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const uk = locale === "uk";

  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [analytics, setAnalytics] = useState<{
    trend: { weekStart: string; closed: number }[];
    load: { name: string; open: number }[];
    overdueByDept: { department: string; overdue: number }[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/reports/analytics")
      .then(r => r.ok ? r.json() : null)
      .then(d => setAnalytics(d))
      .catch(() => {});
  }, []);

  const toggle = (name: string) => setExpanded(prev => {
    const next = new Set(prev);
    if (next.has(name)) next.delete(name); else next.add(name);
    return next;
  });

  useEffect(() => {
    if (!authLoading && user && !user.isAdmin) router.replace("/");
  }, [authLoading, user, router]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/reports/weekly?week=${weekParamFor(offset)}`)
      .then(r => r.ok ? r.json() : null)
      .then((d: Report | null) => { if (!cancelled) setData(d); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [offset]);

  if (authLoading || (user && !user.isAdmin)) {
    return <div className="flex justify-center items-center min-h-[300px]"><Spinner size="lg" /></div>;
  }

  // Group closed tasks by who closed them — for the "what they closed" chips
  const closedByPerson = new Map<string, ClosedRow[]>();
  if (data) {
    for (const c of data.closed) {
      if (!c.doneBy) continue;
      const arr = closedByPerson.get(c.doneBy) ?? [];
      arr.push(c);
      closedByPerson.set(c.doneBy, arr);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-6 animate-fade-in-up">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-[0_4px_14px_rgba(124,58,237,0.4)] flex-shrink-0">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground leading-tight">
              {uk ? "Тижневий звіт" : "Weekly Report"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {uk ? "Огляд продуктивності за тиждень" : "Weekly productivity overview"}
            </p>
          </div>
        </div>

        {/* Week nav — prominent period */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => setOffset(o => o - 1)} aria-label={uk ? "Попередній тиждень" : "Previous week"}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl bg-indigo-50 border border-indigo-200/70 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-500/30 dark:text-indigo-200 font-bold text-sm whitespace-nowrap">
              <svg className="h-4 w-4 flex-shrink-0 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {data ? fmtRange(data.range.start, data.range.end, locale) : "—"}
            </div>
            <button type="button" onClick={() => setOffset(o => Math.min(0, o + 1))} disabled={offset === 0} aria-label={uk ? "Наступний тиждень" : "Next week"}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          {offset !== 0 && (
            <button type="button" onClick={() => setOffset(0)}
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-2 cursor-pointer">
              {uk ? "← До поточного тижня" : "← Back to current week"}
            </button>
          )}
          <a
            href="/api/reports/export"
            download
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            {uk ? "Експорт CSV (90 дн)" : "Export CSV (90d)"}
          </a>
        </div>
      </div>

      {loading || !data ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-6">
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label={uk ? "Закрито" : "Closed"} value={data.kpis.closed} delta={data.kpis.closedDelta} stagger="stagger-1"
              tone="bg-emerald-100 dark:bg-emerald-900/30"
              icon={<svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
            <KpiCard label={uk ? "Створено" : "Created"} value={data.kpis.created} delta={data.kpis.createdDelta} stagger="stagger-2"
              tone="bg-indigo-100 dark:bg-indigo-900/30"
              icon={<svg className="h-4 w-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>} />
            <KpiCard label={uk ? "В роботі" : "In progress"} value={data.kpis.inProgress} stagger="stagger-3"
              tone="bg-violet-100 dark:bg-violet-900/30"
              icon={<svg className="h-4 w-4 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
            <KpiCard label={uk ? "Прострочено" : "Overdue"} value={data.kpis.overdue} stagger="stagger-4"
              tone="bg-rose-100 dark:bg-rose-900/30"
              icon={<svg className="h-4 w-4 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" /></svg>} />
          </div>

          {/* Leaderboard */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden animate-fade-in-up stagger-6">
            <div className="px-4 py-3.5 border-b border-border/60 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <svg className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <h2 className="text-sm font-bold text-foreground">{uk ? "Хто що зробив" : "Who did what"}</h2>
            </div>
            <div className="divide-y divide-border/50">
              {data.leaderboard.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">{uk ? "Активності за цей тиждень немає" : "No activity this week"}</p>
              ) : data.leaderboard.map((r, i) => {
                const tasks = closedByPerson.get(r.name) ?? [];
                const isOpen = expanded.has(r.name);
                const byProject = new Map<string, ClosedRow[]>();
                for (const t of tasks) {
                  const key = t.project ?? "__none__";
                  const arr = byProject.get(key) ?? [];
                  arr.push(t);
                  byProject.set(key, arr);
                }
                return (
                  <div key={r.name}>
                    {/* Header — clickable to expand when there are closed tasks */}
                    <button
                      type="button"
                      onClick={() => tasks.length > 0 && toggle(r.name)}
                      className={cn(
                        "w-full px-4 py-3.5 flex flex-col gap-2.5 text-left transition-colors",
                        tasks.length > 0 ? "cursor-pointer hover:bg-muted/40" : "cursor-default"
                      )}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <span className="text-xs font-bold text-muted-foreground/50 w-4 text-center tabular-nums flex-shrink-0">{i + 1}</span>
                        <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-full text-white text-sm font-bold flex-shrink-0", avatarColor(r.name))}>
                          {r.name.charAt(0).toUpperCase()}
                        </span>
                        <p className="text-sm font-bold text-foreground truncate flex-1 min-w-0">{r.name}</p>
                        {r.closed > 0 && (
                          <span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-500/30">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            {r.closed} {uk ? "закрито" : "closed"}
                          </span>
                        )}
                        {tasks.length > 0 && (
                          <svg className={cn("h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200", isOpen && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </div>

                      {/* Labeled metrics */}
                      <div className="flex flex-wrap gap-1.5 pl-11">
                        <StatChip
                          value={r.comments}
                          label={uk ? "коментарів" : "comments"}
                          icon={<svg className="h-3 w-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
                        />
                        <StatChip
                          value={r.activity}
                          label={uk ? "змін у задачах" : "task changes"}
                          icon={<svg className="h-3 w-3 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                        />
                      </div>
                    </button>

                    {/* Expanded — closed tasks grouped by project */}
                    {isOpen && tasks.length > 0 && (
                      <div className="px-4 pb-4 pl-11 space-y-3 animate-fade-in">
                        {[...byProject.entries()].map(([proj, list]) => (
                          <div key={proj}>
                            <p className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                              <svg className="h-3 w-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                              {proj === "__none__" ? (uk ? "Без проєкту" : "No project") : proj}
                              <span className="text-muted-foreground/50">· {list.length}</span>
                            </p>
                            <div className="space-y-1">
                              {list.map(t => (
                                <Link key={t.id} href={`/items/${t.id}`}
                                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-muted/60 transition-colors group">
                                  <svg className="h-3 w-3 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                  <span className="text-xs text-foreground truncate flex-1 min-w-0 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{t.title}</span>
                                  {t.doneAt && <span className="text-[10px] text-muted-foreground flex-shrink-0">{fmtDay(t.doneAt, locale)}</span>}
                                  {t.leadDays !== null && (
                                    <span className="flex-shrink-0 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-500/30 px-1.5 py-0.5 rounded">
                                      {t.leadDays} {uk ? "дн." : "d"}
                                    </span>
                                  )}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Analytics */}
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in-up stagger-7">
              {/* Closed per week trend */}
              <div className="rounded-2xl border border-border/60 bg-card shadow-card p-4">
                <p className="text-xs font-bold text-foreground mb-3">{uk ? "Закрито по тижнях" : "Closed per week"}</p>
                <div className="flex items-end gap-1.5 h-28">
                  {analytics.trend.map((w) => {
                    const max = Math.max(...analytics.trend.map(x => x.closed), 1);
                    return (
                      <div key={w.weekStart} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                        <span className="text-[9px] font-bold text-muted-foreground tabular-nums">{w.closed || ""}</span>
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-indigo-500 to-violet-400 transition-all duration-500"
                          style={{ height: `${Math.max((w.closed / max) * 80, w.closed > 0 ? 6 : 2)}px`, opacity: w.closed > 0 ? 1 : 0.15 }}
                        />
                        <span className="text-[8px] text-muted-foreground/60 truncate w-full text-center">
                          {w.weekStart.slice(5).replace("-", ".")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Load per assignee */}
              <div className="rounded-2xl border border-border/60 bg-card shadow-card p-4">
                <p className="text-xs font-bold text-foreground mb-3">{uk ? "Навантаження (відкриті задачі)" : "Load (open tasks)"}</p>
                <div className="space-y-2">
                  {analytics.load.length === 0 && <p className="text-xs text-muted-foreground">{uk ? "Немає відкритих задач" : "No open tasks"}</p>}
                  {analytics.load.map((r) => {
                    const max = Math.max(...analytics.load.map(x => x.open), 1);
                    return (
                      <div key={r.name} className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-foreground w-24 truncate flex-shrink-0">{r.name}</span>
                        <div className="flex-1 h-2 rounded-full bg-muted/60 dark:bg-white/[0.06] overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400 transition-all duration-500" style={{ width: `${(r.open / max) * 100}%` }} />
                        </div>
                        <span className="text-[11px] font-bold text-muted-foreground tabular-nums w-6 text-right flex-shrink-0">{r.open}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Overdue by department */}
              <div className="rounded-2xl border border-border/60 bg-card shadow-card p-4">
                <p className="text-xs font-bold text-foreground mb-3">{uk ? "Прострочені по департаментах" : "Overdue by department"}</p>
                <div className="space-y-2">
                  {analytics.overdueByDept.length === 0 && <p className="text-xs text-muted-foreground">{uk ? "Немає прострочених 🎉" : "No overdue items 🎉"}</p>}
                  {analytics.overdueByDept.map((r) => {
                    const max = Math.max(...analytics.overdueByDept.map(x => x.overdue), 1);
                    return (
                      <div key={r.department} className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-foreground w-24 truncate flex-shrink-0">{r.department === "—" ? (uk ? "Без відділу" : "No dept") : r.department}</span>
                        <div className="flex-1 h-2 rounded-full bg-muted/60 dark:bg-white/[0.06] overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400 transition-all duration-500" style={{ width: `${(r.overdue / max) * 100}%` }} />
                        </div>
                        <span className="text-[11px] font-bold text-muted-foreground tabular-nums w-6 text-right flex-shrink-0">{r.overdue}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
