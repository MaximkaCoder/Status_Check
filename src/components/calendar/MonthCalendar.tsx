"use client";

import { addMonths, subMonths } from "date-fns";
import { CalendarGrid } from "./CalendarGrid";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/i18n";
import type { StatusItem } from "@/lib/types";

interface MonthCalendarProps {
  items: StatusItem[];
  selectedDay: Date | null;
  onDayClick: (date: Date) => void;
  currentMonth: Date;
  onMonthChange: (month: Date) => void;
}

export function MonthCalendar({
  items,
  selectedDay,
  onDayClick,
  currentMonth,
  onMonthChange,
}: MonthCalendarProps) {
  const { locale } = useLanguage();
  const monthName = translations[locale].months[currentMonth.getMonth()];
  const year = currentMonth.getFullYear();

  return (
    <div className="rounded-2xl bg-card dark:bg-card shadow-md dark:shadow-2xl dark:shadow-black/40 dark:border dark:border-white/[0.08] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <button
          onClick={() => onMonthChange(subMonths(currentMonth, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150 cursor-pointer"
          type="button"
          aria-label="Previous month"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h2 className="text-sm font-semibold text-foreground tracking-tight">
          {monthName} {year}
        </h2>

        <button
          onClick={() => onMonthChange(addMonths(currentMonth, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-150 cursor-pointer"
          type="button"
          aria-label="Next month"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Grid */}
      <div className="px-3 pb-3">
        <CalendarGrid
          currentMonth={currentMonth}
          items={items}
          selectedDay={selectedDay}
          onDayClick={onDayClick}
        />
      </div>
    </div>
  );
}
