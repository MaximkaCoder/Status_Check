"use client";

import { cn } from "@/lib/utils";

type Status = "TO_CHECK" | "EXPIRED" | "DONE" | "NOT_ACTUAL" | "IDEAS_BACKLOG";

const STATUS_DOT_COLORS: Record<Status, string> = {
  TO_CHECK:      "bg-indigo-500",
  EXPIRED:       "bg-rose-500",
  DONE:          "bg-emerald-500",
  NOT_ACTUAL:    "bg-slate-400",
  IDEAS_BACKLOG: "bg-violet-500",
};

const STATUS_DOT_GLOW: Record<Status, string> = {
  TO_CHECK:      "",
  EXPIRED:       "shadow-[0_0_4px_1px_rgba(239,68,68,0.5)]",
  DONE:          "",
  NOT_ACTUAL:    "",
  IDEAS_BACKLOG: "",
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
