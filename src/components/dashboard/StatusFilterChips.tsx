"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

type Status = "TO_CHECK" | "EXPIRED" | "DONE" | "NOT_ACTUAL" | "IDEAS_BACKLOG";

const ALL_STATUSES: Status[] = ["TO_CHECK", "EXPIRED", "DONE", "NOT_ACTUAL", "IDEAS_BACKLOG"];

const CHIP_ACTIVE: Record<Status, string> = {
  TO_CHECK:      "bg-indigo-500 text-white border-indigo-500 shadow-sm",
  EXPIRED:       "bg-rose-500 text-white border-rose-500 shadow-sm",
  DONE:          "bg-emerald-500 text-white border-emerald-500 shadow-sm",
  NOT_ACTUAL:    "bg-slate-500 text-white border-slate-500 shadow-sm",
  IDEAS_BACKLOG: "bg-violet-500 text-white border-violet-500 shadow-sm",
};

const CHIP_INACTIVE: Record<Status, string> = {
  TO_CHECK:      "bg-white/50 dark:bg-white/[0.04] border-indigo-200/80 text-indigo-600 hover:bg-white/70 hover:border-indigo-300 dark:border-indigo-400/20 dark:text-white/60 dark:hover:border-indigo-400/40 dark:hover:text-white/80",
  EXPIRED:       "bg-white/50 dark:bg-white/[0.04] border-rose-200/80 text-rose-600 hover:bg-white/70 hover:border-rose-300 dark:border-rose-400/20 dark:text-white/60 dark:hover:border-rose-400/40 dark:hover:text-white/80",
  DONE:          "bg-white/50 dark:bg-white/[0.04] border-emerald-200/80 text-emerald-600 hover:bg-white/70 hover:border-emerald-300 dark:border-emerald-400/20 dark:text-white/60 dark:hover:border-emerald-400/40 dark:hover:text-white/80",
  NOT_ACTUAL:    "bg-white/50 dark:bg-white/[0.04] border-slate-200/80 text-slate-500 hover:bg-white/70 hover:border-slate-300 dark:border-slate-400/20 dark:text-white/60 dark:hover:border-slate-400/40 dark:hover:text-white/80",
  IDEAS_BACKLOG: "bg-white/50 dark:bg-white/[0.04] border-violet-200/80 text-violet-600 hover:bg-white/70 hover:border-violet-300 dark:border-violet-400/20 dark:text-white/60 dark:hover:border-violet-400/40 dark:hover:text-white/80",
};

interface StatusFilterChipsProps {
  selected: Status[];
  onChange: (statuses: Status[]) => void;
}

export function StatusFilterChips({ selected, onChange }: StatusFilterChipsProps) {
  const { t } = useLanguage();
  const isAll = selected.length === 0;

  const labels: Record<Status, string> = {
    TO_CHECK:      t("toCheck"),
    EXPIRED:       t("expired"),
    DONE:          t("done"),
    NOT_ACTUAL:    t("notActual"),
    IDEAS_BACKLOG: t("ideasBacklog"),
  };

  function toggle(status: Status) {
    if (selected.includes(status)) onChange(selected.filter((s) => s !== status));
    else onChange([...selected, status]);
  }

  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
      <button
        onClick={() => onChange([])}
        type="button"
        aria-pressed={isAll}
        className={cn(
          "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border-2 transition-all duration-200 cursor-pointer outline-none",
          isAll
            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
            : "bg-white/50 dark:bg-white/[0.04] border-white/80 text-muted-foreground hover:bg-white/70 hover:border-white dark:border-white/20 dark:text-white/60 dark:hover:border-white/40 dark:hover:text-white/80"
        )}
      >
        {t("all")}
      </button>
      {ALL_STATUSES.map((status) => {
        const isActive = selected.includes(status);
        return (
          <button key={status} onClick={() => toggle(status)} type="button" aria-pressed={isActive}
            className={cn(
              "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border-2 transition-all duration-200 cursor-pointer outline-none",
              isActive ? CHIP_ACTIVE[status] : CHIP_INACTIVE[status]
            )}
          >
            {labels[status]}
          </button>
        );
      })}
    </div>
  );
}
