"use client";

import { useMemo, useState } from "react";
import { isSameDay, startOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { StatusFilterChips } from "@/components/dashboard/StatusFilterChips";
import { ItemList } from "@/components/dashboard/ItemList";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { useItems } from "@/hooks/useItems";
import { StatsPanel } from "@/components/dashboard/StatsPanel";

type Status = "TO_CHECK" | "EXPIRED" | "DONE" | "NOT_ACTUAL" | "IDEAS_BACKLOG";

export default function DashboardPage() {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<Status[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  const { t, locale } = useLanguage();
  const { toast } = useToast();

  const { items, loading, error, refresh, silentRefresh, removeItem, changeStatus } = useItems({
    month: currentMonth,
    statuses: selectedStatuses,
  });

  function handleDayClick(date: Date) {
    if (selectedDay && isSameDay(selectedDay, date)) setSelectedDay(null);
    else setSelectedDay(date);
  }

  function handleMonthChange(newMonth: Date) {
    setCurrentMonth(newMonth);
    setSelectedDay(null);
  }

  async function handleDelete(id: string) {
    try { await removeItem(id); }
    catch { toast(t("networkError"), "error"); }
  }

  async function handleStatusChange(id: string, status: Status) {
    await changeStatus(id, status);
    silentRefresh();
  }

  // Unique project/assignee values from current items
  const uniqueProjects = useMemo(
    () => [...new Set(items.map((i) => i.project).filter(Boolean))].sort() as string[],
    [items]
  );
  const uniqueAssignees = useMemo(
    () => [...new Set(items.map((i) => i.assignee).filter(Boolean))].sort() as string[],
    [items]
  );

  const displayedItems = useMemo(() => {
    let result = selectedDay
      ? items.filter((item) => item.deadline && isSameDay(new Date(item.deadline), selectedDay))
      : items;
    if (selectedProjects.length > 0)
      result = result.filter((item) => item.project && selectedProjects.includes(item.project));
    if (selectedAssignees.length > 0)
      result = result.filter((item) => item.assignee && selectedAssignees.includes(item.assignee));
    return result;
  }, [items, selectedDay, selectedProjects, selectedAssignees]);

  function toggleChip<T>(val: T, selected: T[], setSelected: (v: T[]) => void) {
    if (selected.includes(val)) setSelected(selected.filter((s) => s !== val));
    else setSelected([...selected, val]);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">

        {/* LEFT: Calendar + Stats — sticky */}
        <div className="lg:sticky lg:top-[68px] lg:self-start lg:w-[380px] lg:flex-shrink-0 flex flex-col gap-4 animate-fade-in-up stagger-2">
          <MonthCalendar
            items={items}
            selectedDay={selectedDay}
            onDayClick={handleDayClick}
            currentMonth={currentMonth}
            onMonthChange={handleMonthChange}
          />
          <StatsPanel items={displayedItems} />
        </div>

        {/* RIGHT: Filters + list */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Filters */}
          <div className="flex flex-col gap-3 animate-fade-in-up stagger-3">

            {/* Status filter */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {t("filter")}
              </span>
              <StatusFilterChips selected={selectedStatuses} onChange={setSelectedStatuses} />
            </div>

            {/* Project filter */}
            {uniqueProjects.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-1 border-t border-border/40 dark:border-white/[0.06]">
                <span className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
                  {t("project")}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {uniqueProjects.map((proj) => {
                    const active = selectedProjects.includes(proj);
                    return (
                      <button
                        key={proj}
                        type="button"
                        onClick={() => toggleChip(proj, selectedProjects, setSelectedProjects)}
                        aria-pressed={active}
                        className={cn(
                          "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border-2 transition-all duration-200 cursor-pointer outline-none",
                          active
                            ? "bg-indigo-500 text-white border-indigo-500 shadow-sm"
                            : "bg-white/50 dark:bg-white/[0.04] border-indigo-200/80 text-indigo-600 hover:bg-white/70 hover:border-indigo-300 dark:border-indigo-400/20 dark:text-white/60 dark:hover:border-indigo-400/40 dark:hover:text-white/80"
                        )}
                      >
                        {proj}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Assignee filter */}
            {uniqueAssignees.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-1 border-t border-border/40 dark:border-white/[0.06]">
                <span className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
                  {t("assignee")}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {uniqueAssignees.map((name) => {
                    const active = selectedAssignees.includes(name);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toggleChip(name, selectedAssignees, setSelectedAssignees)}
                        aria-pressed={active}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border-2 transition-all duration-200 cursor-pointer outline-none",
                          active
                            ? "bg-violet-500 text-white border-violet-500 shadow-sm"
                            : "bg-white/50 dark:bg-white/[0.04] border-violet-200/80 text-violet-600 hover:bg-white/70 hover:border-violet-300 dark:border-violet-400/20 dark:text-white/60 dark:hover:border-violet-400/40 dark:hover:text-white/80"
                        )}
                      >
                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-violet-400 dark:bg-violet-600 text-white text-[8px] font-bold flex-shrink-0">
                          {name.charAt(0)}
                        </span>
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Error state */}
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-500/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-300 flex items-center gap-3 animate-fade-in">
              <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="flex-1">{error}</span>
              <button onClick={refresh} className="font-semibold underline underline-offset-2 hover:no-underline cursor-pointer" type="button">
                {t("retry")}
              </button>
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
