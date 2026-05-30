"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

type Status = "PENDING" | "IN_PROGRESS" | "DONE" | "OVERDUE";

const ALL_STATUSES: Status[] = ["PENDING", "IN_PROGRESS", "DONE", "OVERDUE"];

const STATUS_CHIP_ACTIVE: Record<Status, string> = {
  PENDING:     "bg-indigo-500 text-white border-indigo-500 shadow-sm",
  IN_PROGRESS: "bg-amber-500 text-white border-amber-500 shadow-sm",
  DONE:        "bg-emerald-500 text-white border-emerald-500 shadow-sm",
  OVERDUE:     "bg-rose-500 text-white border-rose-500 shadow-sm",
};

const STATUS_CHIP_INACTIVE: Record<Status, string> = {
  PENDING:     "bg-white/50 dark:bg-white/[0.04] backdrop-blur-sm border-indigo-200/80 text-indigo-600 hover:bg-white/70 hover:border-indigo-300 dark:border-indigo-400/20 dark:text-white/60 dark:hover:border-indigo-400/40 dark:hover:text-white/80",
  IN_PROGRESS: "bg-white/50 dark:bg-white/[0.04] backdrop-blur-sm border-amber-200/80 text-amber-600 hover:bg-white/70 hover:border-amber-300 dark:border-amber-400/20 dark:text-white/60 dark:hover:border-amber-400/40 dark:hover:text-white/80",
  DONE:        "bg-white/50 dark:bg-white/[0.04] backdrop-blur-sm border-emerald-200/80 text-emerald-600 hover:bg-white/70 hover:border-emerald-300 dark:border-emerald-400/20 dark:text-white/60 dark:hover:border-emerald-400/40 dark:hover:text-white/80",
  OVERDUE:     "bg-white/50 dark:bg-white/[0.04] backdrop-blur-sm border-rose-200/80 text-rose-600 hover:bg-white/70 hover:border-rose-300 dark:border-rose-400/20 dark:text-white/60 dark:hover:border-rose-400/40 dark:hover:text-white/80",
};

interface StatusFilterChipsProps {
  selected: Status[];
  onChange: (statuses: Status[]) => void;
}

export function StatusFilterChips({ selected, onChange }: StatusFilterChipsProps) {
  const { t } = useLanguage();
  const isAll = selected.length === 0;

  const statusLabels: Record<Status, string> = {
    PENDING:     t("pending"),
    IN_PROGRESS: t("inProgress"),
    DONE:        t("done"),
    OVERDUE:     t("overdue"),
  };

  function toggleStatus(status: Status) {
    if (selected.includes(status)) {
      onChange(selected.filter((s) => s !== status));
    } else {
      onChange([...selected, status]);
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
      <button
        onClick={() => onChange([])}
        type="button"
        aria-pressed={isAll}
        className={cn(
          "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border-2 transition-all duration-200 cursor-pointer",
          isAll
            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
            : "bg-white/50 dark:bg-white/[0.04] backdrop-blur-sm border-white/80 text-muted-foreground hover:bg-white/70 hover:border-white dark:border-white/20 dark:text-white/60 dark:hover:border-white/40 dark:hover:text-white/80"
        )}
      >
        {t("all")}
      </button>

      {ALL_STATUSES.map((status) => {
        const isActive = selected.includes(status);
        return (
          <button
            key={status}
            onClick={() => toggleStatus(status)}
            type="button"
            aria-pressed={isActive}
            className={cn(
              "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border-2 transition-all duration-200 cursor-pointer",
              isActive ? STATUS_CHIP_ACTIVE[status] : STATUS_CHIP_INACTIVE[status]
            )}
          >
            {statusLabels[status]}
          </button>
        );
      })}
    </div>
  );
}
