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
        "relative flex flex-col min-h-[52px] p-1.5 rounded-lg w-full text-left",
        "transition-all duration-150 cursor-pointer",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60",
        // default cell
        "bg-gray-100/90 dark:bg-white/[0.04]",
        "hover:bg-gray-200/70 dark:hover:bg-white/[0.08]",
        // today — elevated white card
        isToday && "bg-white dark:bg-white/[0.12] shadow-[0_2px_8px_rgba(0,0,0,0.10)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.4)]",
        isToday && "hover:bg-white dark:hover:bg-white/[0.16]",
        // selected
        isSelected && !isToday && "bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-300/60 dark:ring-indigo-500/30",
        isSelected && isToday && "ring-2 ring-indigo-400/70",
        // out-of-month
        !isCurrentMonth && "opacity-30"
      )}
      aria-label={`${date.toDateString()}${items.length > 0 ? `, ${items.length} item${items.length !== 1 ? "s" : ""}` : ""}`}
      aria-pressed={isSelected}
    >
      {/* Day number */}
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full text-[11px] leading-none font-medium",
          isToday
            ? "bg-indigo-500 text-white font-bold"
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
