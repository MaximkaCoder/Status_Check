"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

type Status = "PENDING" | "IN_PROGRESS" | "DONE" | "OVERDUE";

const STATUS_STYLES: Record<Status, string> = {
  PENDING:     "bg-indigo-100 text-indigo-700 border-indigo-200/80 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-500/30",
  IN_PROGRESS: "bg-amber-100 text-amber-700 border-amber-200/80 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-500/30",
  DONE:        "bg-emerald-100 text-emerald-700 border-emerald-200/80 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-500/30 dark:shadow-[0_0_10px_rgba(16,185,129,0.2)]",
  OVERDUE:     "bg-rose-100 text-rose-700 border-rose-200/80 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-500/30 dark:shadow-[0_0_10px_rgba(239,68,68,0.2)]",
};

const STATUS_DOT: Record<Status, string> = {
  PENDING:     "bg-indigo-500",
  IN_PROGRESS: "bg-amber-500",
  DONE:        "bg-emerald-500",
  OVERDUE:     "bg-rose-500",
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useLanguage();

  const labelMap: Record<Status, string> = {
    PENDING:     t("pending"),
    IN_PROGRESS: t("inProgress"),
    DONE:        t("done"),
    OVERDUE:     t("overdue"),
  };

  const isOverdue = status === "OVERDUE";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        STATUS_STYLES[status],
        isOverdue && "animate-pulse-ring",
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full flex-shrink-0",
          STATUS_DOT[status],
          isOverdue && "animate-pulse"
        )}
      />
      {labelMap[status]}
    </span>
  );
}
