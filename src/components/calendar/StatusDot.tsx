"use client";

import { cn } from "@/lib/utils";

type Status = "PENDING" | "IN_PROGRESS" | "DONE" | "OVERDUE";

const STATUS_DOT_COLORS: Record<Status, string> = {
  PENDING:     "bg-indigo-500",
  IN_PROGRESS: "bg-amber-500",
  DONE:        "bg-emerald-500",
  OVERDUE:     "bg-rose-500",
};

const STATUS_DOT_GLOW: Record<Status, string> = {
  PENDING:     "",
  IN_PROGRESS: "",
  DONE:        "",
  OVERDUE:     "shadow-[0_0_4px_1px_rgba(239,68,68,0.5)]",
};

interface StatusDotProps {
  status: Status;
  className?: string;
}

export function StatusDot({ status, className }: StatusDotProps) {
  return (
    <span
      className={cn(
        "inline-block h-[5px] w-[5px] rounded-full flex-shrink-0",
        STATUS_DOT_COLORS[status],
        STATUS_DOT_GLOW[status],
        className
      )}
      title={status}
    />
  );
}
