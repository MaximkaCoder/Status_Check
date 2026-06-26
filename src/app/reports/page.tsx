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
interface ClosedRow { id: string; title: string; doneBy: string | null; doneAt: string | null; department: string | null; leadDays: number | null }
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

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(1, ...data);
  return (
    <div className="flex items-end gap-[3px] h-8">
      {data.map((v, i) => (
        <div key={i} className="w-1.5 rounded-full bg-current/10 flex items-end overflow-hidden" style={{ height: "100%" }}>
          <div className={cn("w-full rounded-full transition-all duration-500", color)} style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? 3 : 0 }} />
        </div>
      ))}
    </div>
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

  const maxScore = data?.leaderboard[0]?.score ?? 1;

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
              {uk ? "Тижневий пульс" : "Weekly Pulse"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {data ? fmtRange(data.range.start, data.range.end, locale) : "—"}
            </p>
          </div>
        </div>

        {/* Week nav */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button type="button" onClick={() => setOffset(o => o - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/60 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button type="button" onClick={() => setOffset(0)} disabled={offset === 0}
            className={cn("px-3 h-8 rounded-xl text-xs font-semibold border transition-colors cursor-pointer",
              offset === 0 ? "border-indigo-300 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-500/30 dark:text-indigo-300 cursor-default" : "border-border/60 bg-card hover:bg-muted text-muted-foreground")}>
            {uk ? "Цей тиждень" : "This week"}
          </button>
          <button type="button" onClick={() => setOffset(o => Math.min(0, o + 1))} disabled={offset === 0}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/60 bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
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

          {/* Avg lead time */}
          {data.avgLeadTime !== null && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground animate-fade-in-up stagger-5">
              <svg className="h-4 w-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              {uk ? "Середній час закриття:" : "Average lead time:"}
              <span className="font-bold text-foreground">{data.avgLeadTime} {uk ? "дн." : "d"}</span>
            </div>
          )}

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
              ) : data.leaderboard.map((r, i) => (
                <div key={r.name} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xs font-bold text-muted-foreground/50 w-4 text-center tabular-nums">{i + 1}</span>
                  <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-full text-white text-sm font-bold flex-shrink-0", avatarColor(r.name))}>
                    {r.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{r.name}</p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {r.closed} {uk ? "закрито" : "closed"}
                      </span>
                      <span>{r.activity} {uk ? "дій" : "actions"}</span>
                      <span>{r.comments} {uk ? "комент." : "comments"}</span>
                    </div>
                  </div>
                  {/* contribution bar */}
                  <div className="hidden sm:flex flex-col items-end gap-1 w-28">
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700" style={{ width: `${(r.score / maxScore) * 100}%` }} />
                    </div>
                  </div>
                  <div className="text-emerald-500 flex-shrink-0"><Sparkline data={r.perDay} color="bg-emerald-500" /></div>
                </div>
              ))}
            </div>
          </div>

          {/* Closed list */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden animate-fade-in-up stagger-7">
            <div className="px-4 py-3.5 border-b border-border/60 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <svg className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h2 className="text-sm font-bold text-foreground">{uk ? "Закриті задачі" : "Closed tasks"}</h2>
              {data.closed.length > 0 && <span className="ml-auto text-[10px] font-bold text-muted-foreground">{data.closed.length}</span>}
            </div>
            <div className="divide-y divide-border/50 max-h-[420px] overflow-y-auto">
              {data.closed.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">{uk ? "За цей тиждень нічого не закрито" : "Nothing closed this week"}</p>
              ) : data.closed.map((c) => (
                <Link key={c.id} href={`/items/${c.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{c.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      {c.doneBy && <span className="inline-flex items-center gap-1"><span className={cn("inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-white text-[8px] font-bold", avatarColor(c.doneBy))}>{c.doneBy.charAt(0).toUpperCase()}</span>{c.doneBy}</span>}
                      {c.doneAt && <span>· {fmtDay(c.doneAt, locale)}</span>}
                      {c.department && <span>· {c.department}</span>}
                    </div>
                  </div>
                  {c.leadDays !== null && (
                    <span className="flex-shrink-0 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-500/30 px-2 py-0.5 rounded-md">
                      {c.leadDays} {uk ? "дн." : "d"}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
