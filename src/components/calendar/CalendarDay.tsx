"use client";

import { cn } from "@/lib/utils";
import { StatusDot } from "./StatusDot";
import type { StatusItem } from "@/lib/types";

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  items: StatusItem[];
  onClick: () => void;
}

const MAX_DOTS = 3;

export function CalendarDay({ date, isCurrentMonth, isToday, isSelected, items, onClick }: CalendarDayProps) {
  const dayNumber = date.getDate();
  const visibleItems = items.slice(0, MAX_DOTS);
  const overflow = items.length - MAX_DOTS;

  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        "relative flex flex-col min-h-[52px] p-1.5 rounded-xl w-full text-left",
        "transition-all duration-150 cursor-pointer",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60",
        // Glass base cell
        "bg-white/30 dark:bg-white/[0.03]",
        "backdrop-blur-[2px]",
        "border border-white/70 dark:border-white/[0.07]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.04)]",
        "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_1px_4px_rgba(0,0,0,0.3)]",
        "hover:bg-white/55 dark:hover:bg-white/[0.07] hover:border-white/90 dark:hover:border-white/[0.14]",
        // Today
        isToday && "bg-white/75 dark:bg-white/[0.12] border-white dark:border-white/20",
        isToday && "shadow-[inset_0_1px_0_rgba(255,255,255,1),0_2px_8px_rgba(99,102,241,0.15)]",
        isToday && "dark:shadow-[0_2px_12px_rgba(99,102,241,0.3)]",
        isToday && "hover:bg-white/80 dark:hover:bg-white/[0.16]",
        // Selected
        isSelected && !isToday && "bg-indigo-400/20 dark:bg-indigo-900/40 border-indigo-300/60 dark:border-indigo-500/30",
        isSelected && !isToday && "shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_0_12px_rgba(99,102,241,0.2)]",
        isSelected && isToday && "ring-2 ring-indigo-400/70 shadow-[0_0_16px_rgba(99,102,241,0.35)]",
        // Out-of-month
        !isCurrentMonth && "opacity-25"
      )}
      aria-label={`${date.toDateString()}${items.length > 0 ? `, ${items.length} item${items.length !== 1 ? "s" : ""}` : ""}`}
      aria-pressed={isSelected}
    >
      {/* Day number */}
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full text-[11px] leading-none font-medium",
          isToday
            ? "bg-indigo-500 text-white font-bold shadow-[0_0_8px_rgba(99,102,241,0.5)]"
            : isSelected
            ? "text-indigo-600 dark:text-indigo-300 font-semibold"
            : "text-foreground/80"
        )}
      >
        {dayNumber}
      </span>

      {/* Status dots — bottom */}
      {items.length > 0 && (
        <div className="mt-auto pt-1 flex flex-wrap gap-0.5 items-center">
          {visibleItems.map((item) => (
            <StatusDot key={item.id} status={item.status} />
          ))}
          {overflow > 0 && (
            <span className="text-[9px] text-muted-foreground font-medium leading-none">
              +{overflow}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
