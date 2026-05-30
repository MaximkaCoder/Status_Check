"use client";

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
} from "date-fns";
import { CalendarDay } from "./CalendarDay";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/i18n";
import type { StatusItem } from "@/lib/types";

interface CalendarGridProps {
  currentMonth: Date;
  items: StatusItem[];
  selectedDay: Date | null;
  onDayClick: (date: Date) => void;
}

function buildCalendarDays(monthDate: Date): Date[] {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

export function CalendarGrid({ currentMonth, items, selectedDay, onDayClick }: CalendarGridProps) {
  const { locale } = useLanguage();
  const today = new Date();
  const calendarDays = buildCalendarDays(currentMonth);
  const weekDays = translations[locale].weekDays;

  const itemsByDay = new Map<string, StatusItem[]>();
  for (const item of items) {
    if (!item.deadline) continue;
    const key = format(new Date(item.deadline), "yyyy-MM-dd");
    if (!itemsByDay.has(key)) itemsByDay.set(key, []);
    itemsByDay.get(key)!.push(item);
  }

  return (
    <div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1.5">
        {weekDays.map((d) => (
          <div
            key={d}
            className="py-1.5 text-center text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayItems = itemsByDay.get(key) ?? [];
          return (
            <CalendarDay
              key={day.toISOString()}
              date={day}
              isCurrentMonth={isSameMonth(day, currentMonth)}
              isToday={isSameDay(day, today)}
              isSelected={selectedDay ? isSameDay(day, selectedDay) : false}
              items={dayItems}
              onClick={() => onDayClick(day)}
            />
          );
        })}
      </div>
    </div>
  );
}
