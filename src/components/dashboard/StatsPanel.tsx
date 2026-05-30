"use client";

import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import type { StatusItem } from "@/lib/types";

type Status = "PENDING" | "IN_PROGRESS" | "DONE" | "OVERDUE";

const STATUS_CONFIG: { status: Status; color: string; dot: string; labelKey: string }[] = [
  { status: "OVERDUE",     color: "#ef4444", dot: "bg-rose-500",    labelKey: "overdue"     },
  { status: "IN_PROGRESS", color: "#f59e0b", dot: "bg-amber-500",   labelKey: "inProgress"  },
  { status: "PENDING",     color: "#6366f1", dot: "bg-indigo-500",  labelKey: "pending"     },
  { status: "DONE",        color: "#10b981", dot: "bg-emerald-500", labelKey: "done"        },
];

interface DonutProps {
  counts: Record<Status, number>;
  total: number;
  tasksLabel: string;
}

interface SegmentData {
  status: Status;
  color: string;
  count: number;
  spanLength: number;
  rotation: number;
}

function buildSegments(counts: Record<Status, number>, total: number): SegmentData[] {
  const cx = 80, cy = 80, r = 56;
  const C = 2 * Math.PI * r;
  const GAP = total > 1 ? 4 : 0;
  let startAngle = 0;
  return STATUS_CONFIG
    .map((s) => ({ ...s, count: counts[s.status] ?? 0 }))
    .filter((s) => s.count > 0)
    .map((seg) => {
      const frac = seg.count / total;
      const spanLength = Math.max(0, frac * C - GAP);
      const rotation = startAngle - 90;
      startAngle += frac * 360;
      return { status: seg.status, color: seg.color, count: seg.count, spanLength, rotation };
    });
}

function DonutChart({ counts, total, tasksLabel }: DonutProps) {
  const cx = 80, cy = 80, r = 56, sw = 14;
  const C = 2 * Math.PI * r;

  const segments = buildSegments(counts, total);

  return (
    <svg viewBox="0 0 160 160" className="w-full h-full" aria-hidden="true">
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={sw} stroke="#e5e7eb" className="dark:stroke-white/[0.06]" />

      {segments.map((seg) => (
        <circle
          key={seg.status}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth={sw}
          strokeDasharray={`${seg.spanLength} ${C}`}
          strokeDashoffset={0}
          strokeLinecap="butt"
          transform={`rotate(${seg.rotation} ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      ))}

      {/* Center */}
      <text x={cx} y={cy - 10} textAnchor="middle" fontSize="28" fontWeight="700"
        fontFamily="Plus Jakarta Sans, system-ui, sans-serif" fill="currentColor">
        {total}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11"
        fontFamily="Plus Jakarta Sans, system-ui, sans-serif" fill="#9ca3af">
        {tasksLabel}
      </text>
    </svg>
  );
}

interface StatsPanelProps {
  items: StatusItem[];
  label?: string;
}

export function StatsPanel({ items, label }: StatsPanelProps) {
  const { t } = useLanguage();

  const counts = useMemo(() => {
    const c: Record<Status, number> = { PENDING: 0, IN_PROGRESS: 0, DONE: 0, OVERDUE: 0 };
    for (const item of items) {
      if (item.status in c) c[item.status as Status]++;
    }
    return c;
  }, [items]);

  const total = items.length;
  const completionRate = total > 0 ? Math.round((counts.DONE / total) * 100) : 0;

  return (
    <div className={cn(
      "rounded-2xl bg-card shadow-md dark:shadow-2xl dark:shadow-black/40",
      "dark:border dark:border-white/[0.08]",
      "p-5 flex flex-col gap-4 h-full"
    )}>
      {/* Label when filtering by date */}
      {label && (
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-center -mb-2">
          {label}
        </p>
      )}

      {/* Donut */}
      <div className="flex flex-1 justify-center items-center">
        <div className="w-[130px] h-[130px]">
          <DonutChart counts={counts} total={total} tasksLabel={t("tasks")} />
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {STATUS_CONFIG.map((s) => {
          const count = counts[s.status];
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={s.status} className="flex items-center gap-2">
              <span className={cn("h-2 w-2 rounded-full flex-shrink-0", s.dot)} />
              <span className="flex-1 text-xs text-muted-foreground truncate">
                {t(s.labelKey as Parameters<typeof t>[0])}
              </span>
              <span className="text-xs font-bold text-foreground tabular-nums">{count}</span>
              <span className="text-[10px] text-muted-foreground/60 tabular-nums w-7 text-right">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Completion bar */}
      <div className="pt-3 border-t border-border/50 dark:border-white/[0.08]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Done
          </span>
          <span className={cn(
            "text-sm font-bold tabular-nums",
            completionRate >= 75 ? "text-emerald-600 dark:text-emerald-400" :
            completionRate >= 40 ? "text-amber-600 dark:text-amber-400" :
            "text-rose-600 dark:text-rose-400"
          )}>
            {completionRate}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/[0.06] overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              completionRate >= 75 ? "bg-emerald-500" :
              completionRate >= 40 ? "bg-amber-500" :
              "bg-rose-500"
            )}
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>
    </div>
  );
}
