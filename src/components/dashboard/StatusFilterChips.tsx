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
  PENDING:     "border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 dark:border-white/20 dark:text-white/60 dark:hover:border-white/40 dark:hover:text-white/80",
  IN_PROGRESS: "border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300 dark:border-white/20 dark:text-white/60 dark:hover:border-white/40 dark:hover:text-white/80",
  DONE:        "border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 dark:border-white/20 dark:text-white/60 dark:hover:border-white/40 dark:hover:text-white/80",
  OVERDUE:     "border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 dark:border-white/20 dark:text-white/60 dark:hover:border-white/40 dark:hover:text-white/80",
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
            : "border-border text-muted-foreground hover:bg-muted/60 hover:border-muted-foreground/40 dark:border-white/20 dark:text-white/60 dark:hover:border-white/40 dark:hover:text-white/80"
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
