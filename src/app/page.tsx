"use client";

import { useMemo, useState } from "react";
import { isSameDay, startOfMonth } from "date-fns";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { StatusFilterChips } from "@/components/dashboard/StatusFilterChips";
import { ItemList } from "@/components/dashboard/ItemList";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { useItems } from "@/hooks/useItems";
import { translations } from "@/lib/i18n";
import { StatsPanel } from "@/components/dashboard/StatsPanel";

type Status = "PENDING" | "IN_PROGRESS" | "DONE" | "OVERDUE";

export default function DashboardPage() {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<Status[]>([]);

  const { t, locale } = useLanguage();
  const { toast } = useToast();

  const { items, loading, error, refresh, removeItem, changeStatus } = useItems({
    month: currentMonth,
    statuses: selectedStatuses,
  });

  function handleDayClick(date: Date) {
    if (selectedDay && isSameDay(selectedDay, date)) {
      setSelectedDay(null);
    } else {
      setSelectedDay(date);
    }
  }

  function handleMonthChange(newMonth: Date) {
    setCurrentMonth(newMonth);
    setSelectedDay(null);
  }

  async function handleDelete(id: string) {
    try {
      await removeItem(id);
    } catch {
      toast(t("networkError"), "error");
    }
  }

  async function handleStatusChange(
    id: string,
    status: "PENDING" | "IN_PROGRESS" | "DONE"
  ) {
    await changeStatus(id, status);
    refresh();
  }

  const displayedItems = useMemo(
    () =>
      selectedDay
        ? items.filter((item) => isSameDay(new Date(item.deadline), selectedDay))
        : items,
    [items, selectedDay]
  );

  const statusCounts = useMemo(() => {
    const counts = { PENDING: 0, IN_PROGRESS: 0, DONE: 0, OVERDUE: 0 };
    for (const item of items) {
      counts[item.status] = (counts[item.status] ?? 0) + 1;
    }
    return counts;
  }, [items]);

  const selectedMonthShort = selectedDay
    ? translations[locale].monthsShort[selectedDay.getMonth()]
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Stats pills — full width, always on top */}
      <div className="mb-6 animate-fade-in-up stagger-1">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {!loading && items.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/50 backdrop-blur-sm text-slate-600 text-xs font-semibold border border-white/80 dark:bg-white/5 dark:text-slate-300 dark:border-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 inline-block" />
                {items.length} {t("totalItems").toLowerCase()}
              </span>
              {statusCounts.OVERDUE > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/50 backdrop-blur-sm text-rose-700 text-xs font-semibold border border-rose-200/70 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-500/30 dark:shadow-[0_0_12px_rgba(239,68,68,0.15)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block animate-pulse" />
                  {statusCounts.OVERDUE} {t("overdueItems").toLowerCase()}
                </span>
              )}
              {statusCounts.IN_PROGRESS > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/50 backdrop-blur-sm text-amber-700 text-xs font-semibold border border-amber-200/70 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
                  {statusCounts.IN_PROGRESS} {t("inProgress").toLowerCase()}
                </span>
              )}
              {statusCounts.DONE > 0 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/50 backdrop-blur-sm text-emerald-700 text-xs font-semibold border border-emerald-200/70 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                  {statusCounts.DONE} {t("doneItems").toLowerCase()}
                </span>
              )}
            </div>
          )}

          {selectedDay && selectedMonthShort && (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {selectedMonthShort} {selectedDay.getDate()}
              </span>
              {" — "}
              <button
                onClick={() => setSelectedDay(null)}
                className="underline underline-offset-2 hover:no-underline text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                type="button"
              >
                clear
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Two-column on landscape (lg+), single column on portrait */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">

        {/* LEFT: Calendar + Stats — sticky on wide screens */}
        <div className="lg:sticky lg:top-[68px] lg:self-start lg:w-[380px] lg:flex-shrink-0 flex flex-col gap-4 animate-fade-in-up stagger-2">
          <MonthCalendar
            items={items}
            selectedDay={selectedDay}
            onDayClick={handleDayClick}
            currentMonth={currentMonth}
            onMonthChange={handleMonthChange}
          />
          <StatsPanel
            items={displayedItems}
            label={selectedDay && selectedMonthShort
              ? `${selectedMonthShort} ${selectedDay.getDate()}`
              : undefined}
          />
        </div>

        {/* RIGHT: Filters + list — scrollable */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Filter chips */}
          <div className="flex flex-col gap-2 animate-fade-in-up stagger-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t("filter")}
            </span>
            <StatusFilterChips selected={selectedStatuses} onChange={setSelectedStatuses} />
          </div>

          {/* Error state */}
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-500/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-300 flex items-center gap-3 animate-fade-in">
              <svg
                className="h-4 w-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <span className="flex-1">{error}</span>
              <button
                onClick={refresh}
                className="font-semibold underline underline-offset-2 hover:no-underline cursor-pointer"
                type="button"
              >
                {t("retry")}
              </button>
            </div>
          )}

          {/* Item count */}
          {!loading && !error && (
            <div className="animate-fade-in-up stagger-4">
              {displayedItems.length === 0 ? (
                <span className="text-sm font-semibold text-foreground">{t("noItems")}</span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 dark:bg-indigo-400 inline-block" />
                  {displayedItems.length} {t("items")}
                  {selectedDay && selectedMonthShort && (
                    <span className="text-indigo-400 dark:text-indigo-500">· {selectedMonthShort} {selectedDay.getDate()}</span>
                  )}
                </span>
              )}
            </div>
          )}

          <ItemList
            items={displayedItems}
            loading={loading}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>
    </div>
  );
}
