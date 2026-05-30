"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

type Status = "TO_CHECK" | "EXPIRED" | "DONE" | "NOT_ACTUAL" | "IDEAS_BACKLOG";

const STATUS_STYLES: Record<Status, string> = {
  TO_CHECK:      "bg-indigo-100 text-indigo-700 border-indigo-200/80 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-500/30",
  EXPIRED:       "bg-rose-100 text-rose-700 border-rose-200/80 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-500/30 dark:shadow-[0_0_10px_rgba(239,68,68,0.2)]",
  DONE:          "bg-emerald-100 text-emerald-700 border-emerald-200/80 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-500/30 dark:shadow-[0_0_10px_rgba(16,185,129,0.2)]",
  NOT_ACTUAL:    "bg-slate-100 text-slate-500 border-slate-200/80 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-600/30",
  IDEAS_BACKLOG: "bg-violet-100 text-violet-700 border-violet-200/80 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-500/30",
};

const STATUS_DOT: Record<Status, string> = {
  TO_CHECK:      "bg-indigo-500",
  EXPIRED:       "bg-rose-500",
  DONE:          "bg-emerald-500",
  NOT_ACTUAL:    "bg-slate-400",
  IDEAS_BACKLOG: "bg-violet-500",
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useLanguage();
  const labelMap: Record<Status, string> = {
    TO_CHECK:      t("toCheck"),
    EXPIRED:       t("expired"),
    DONE:          t("done"),
    NOT_ACTUAL:    t("notActual"),
    IDEAS_BACKLOG: t("ideasBacklog"),
  };
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
      STATUS_STYLES[status],
      status === "EXPIRED" && "animate-pulse-ring",
      className
    )}>
      <span className={cn(
        "h-1.5 w-1.5 rounded-full flex-shrink-0",
        STATUS_DOT[status],
        status === "EXPIRED" && "animate-pulse"
      )} />
      {labelMap[status]}
    </span>
  );
}
