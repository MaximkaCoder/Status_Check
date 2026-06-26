"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { translations } from "@/lib/i18n";

type Status = "TO_CHECK" | "EXPIRED" | "DONE" | "NOT_ACTUAL" | "IDEAS_BACKLOG";

interface Activity {
  id: string;
  userId: string | null;
  userName: string;
  action: "CREATED" | "STATUS_CHANGED" | "FIELD_CHANGED";
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  created_at: string;
}

const AVATAR_COLORS = [
  "bg-indigo-500","bg-violet-500","bg-pink-500","bg-rose-500","bg-amber-500",
  "bg-emerald-500","bg-cyan-500","bg-sky-500","bg-teal-500","bg-orange-500",
];
function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

const PRIO_CHIP: Record<string, { chip: string; label: (uk: boolean) => string }> = {
  LOW:    { chip: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-500/30 dark:text-blue-300",    label: (uk) => uk ? "Низький"  : "Low"    },
  MEDIUM: { chip: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-500/30 dark:text-amber-300", label: (uk) => uk ? "Середній" : "Medium" },
  HIGH:   { chip: "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/30 dark:border-rose-500/30 dark:text-rose-300",    label: (uk) => uk ? "Високий"  : "High"   },
};

function fieldLabel(field: string | null, uk: boolean): string {
  const map: Record<string, [string, string]> = {
    title:       ["Title",     "Назва"],
    description: ["Description","Опис"],
    deadline:    ["Deadline",  "Дедлайн"],
    priority:    ["Priority",  "Пріоритет"],
    project:     ["Project",   "Проєкт"],
    status:      ["Status",    "Статус"],
    assignee:    ["Assignee",  "Виконавець"],
    reviewer:    ["Reviewer",  "Перевіряючий"],
  };
  const e = field ? map[field] : undefined;
  return e ? (uk ? e[1] : e[0]) : (field ?? "");
}

function fmtDate(iso: string, locale: string): string {
  const d = new Date(iso);
  const monthsEn = translations.en.months;
  const monthsUkGen = translations.uk.monthsGenitive;
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  if (locale === "uk") return `${d.getDate()} ${monthsUkGen[d.getMonth()]} · ${h}:${m}`;
  return `${monthsEn[d.getMonth()]} ${d.getDate()} · ${h}:${m}`;
}

function fmtDeadline(iso: string, locale: string): string {
  const d = new Date(iso);
  const monthsEn = translations.en.months;
  const monthsUkGen = translations.uk.monthsGenitive;
  if (locale === "uk") return `${d.getDate()} ${monthsUkGen[d.getMonth()]} ${d.getFullYear()}`;
  return `${monthsEn[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// Dot color keyed by what changed
function dotClass(a: Activity): string {
  if (a.action === "CREATED") return "bg-emerald-500";
  switch (a.field) {
    case "status":   return "bg-indigo-500";
    case "deadline": return "bg-amber-500";
    case "priority": return "bg-rose-500";
    case "assignee":
    case "reviewer": return "bg-violet-500";
    default:         return "bg-slate-400";
  }
}

function ValueChip({ field, value, locale }: { field: string | null; value: string | null; locale: string }) {
  const uk = locale === "uk";
  if (value == null || value === "") {
    return <span className="text-xs text-muted-foreground/60 italic">{uk ? "—" : "—"}</span>;
  }
  if (field === "status") {
    return <StatusBadge status={value as Status} />;
  }
  if (field === "priority") {
    const cfg = PRIO_CHIP[value];
    if (cfg) return <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border", cfg.chip)}>{cfg.label(uk)}</span>;
  }
  if (field === "deadline") {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-500/30 dark:text-amber-300">{fmtDeadline(value, locale)}</span>;
  }
  const text = value.length > 36 ? value.slice(0, 36) + "…" : value;
  return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-foreground/80 border border-border/60 max-w-[180px] truncate">{text}</span>;
}

export function ActivityTimeline({ itemId }: { itemId: string }) {
  const { t, locale } = useLanguage();
  const uk = locale === "uk";
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/items/${itemId}/activity`)
      .then(r => r.ok ? r.json() : [])
      .then((d: Activity[]) => { if (!cancelled) setActivity(d); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [itemId]);

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-border/60 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
          <svg className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-sm font-bold text-foreground">{t("activityTitle")}</h2>
        {activity.length > 0 && (
          <span className="ml-auto inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 text-[10px] font-bold">
            {activity.length}
          </span>
        )}
      </div>

      {/* Timeline */}
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="h-5 w-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          </div>
        ) : activity.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">{t("activityEmpty")}</p>
        ) : (
          <ol className="relative space-y-4">
            {/* vertical rail */}
            <span className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-gradient-to-b from-border via-border/60 to-transparent" aria-hidden />
            {activity.map((a, i) => (
              <li
                key={a.id}
                className={cn("relative pl-6 animate-fade-in-up", `stagger-${Math.min(i + 1, 10)}`)}
              >
                {/* node */}
                <span className={cn("absolute left-0 top-1 h-[11px] w-[11px] rounded-full ring-2 ring-card", dotClass(a))} />

                <div className="flex items-baseline gap-2 flex-wrap mb-1">
                  <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded-full text-white text-[10px] font-bold flex-shrink-0", avatarColor(a.userName))}>
                    {a.userName.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-xs font-bold text-foreground">{a.userName}</span>
                  <span className="text-[10px] text-muted-foreground">{fmtDate(a.created_at, locale)}</span>
                </div>

                <div className="text-xs text-foreground/80 pl-7">
                  {a.action === "CREATED" ? (
                    <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      {uk ? "Створено задачу" : "Created the task"}
                    </span>
                  ) : a.field === "description" ? (
                    <span className="text-muted-foreground">
                      {uk ? "Опис оновлено" : "Description updated"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 flex-wrap">
                      <span className="text-muted-foreground">{fieldLabel(a.field, uk)}:</span>
                      <ValueChip field={a.field} value={a.oldValue} locale={locale} />
                      <svg className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      <ValueChip field={a.field} value={a.newValue} locale={locale} />
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
