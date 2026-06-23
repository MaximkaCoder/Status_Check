"use client";

import { useMemo, useState, useEffect } from "react";
import { isSameDay, startOfMonth } from "date-fns";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { FilterDrawer } from "@/components/dashboard/FilterDrawer";
import { FilterPanel } from "@/components/dashboard/FilterPanel";
import { ItemList } from "@/components/dashboard/ItemList";
import { ItemDetailOverlay } from "@/components/dashboard/ItemDetailOverlay";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { useItems } from "@/hooks/useItems";
import { StatsPanel } from "@/components/dashboard/StatsPanel";
import { getItemById } from "@/lib/api-client";
import type { StatusItem } from "@/lib/types";

type Status = "TO_CHECK" | "EXPIRED" | "DONE" | "NOT_ACTUAL" | "IDEAS_BACKLOG";

export default function DashboardPage() {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<Status[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [overlayItem, setOverlayItem] = useState<StatusItem | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { toast } = useToast();

  // Open overlay when ?item=<id> is in URL
  useEffect(() => {
    const itemId = searchParams.get("item");
    if (!itemId) { setOverlayItem(null); return; }
    getItemById(itemId)
      .then(setOverlayItem)
      .catch(() => setOverlayItem(null));
  }, [searchParams]);

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

  const activeFilterCount = selectedStatuses.length + selectedProjects.length + selectedAssignees.length;

  const filterProps = {
    selectedStatuses, onStatusChange: setSelectedStatuses,
    selectedProjects, onProjectToggle: (p: string) => setSelectedProjects((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]),
    onProjectClear: () => setSelectedProjects([]),
    selectedAssignees, onAssigneeToggle: (a: string) => setSelectedAssignees((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]),
    onAssigneeClear: () => setSelectedAssignees([]),
    uniqueProjects, uniqueAssignees,
    onClearAll: () => { setSelectedStatuses([]); setSelectedProjects([]); setSelectedAssignees([]); },
    activeCount: activeFilterCount,
  };

  return (
    // xl+ → wider container for 3 columns
    <div className="mx-auto max-w-5xl xl:max-w-[1340px] px-4 py-8">
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">

        {/* LEFT: Calendar + Stats — sticky */}
        <div className="lg:sticky lg:top-[68px] lg:self-start lg:w-[360px] lg:flex-shrink-0 flex flex-col gap-4 animate-fade-in-up stagger-2">
          <MonthCalendar
            items={items}
            selectedDay={selectedDay}
            onDayClick={handleDayClick}
            currentMonth={currentMonth}
            onMonthChange={handleMonthChange}
          />
          <StatsPanel items={displayedItems} />
        </div>

        {/* CENTER: Task list */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">

          {/* Filter button — only on < xl */}
          <div className="xl:hidden flex items-center justify-between animate-fade-in-up stagger-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {locale === "uk" ? "Задачі" : "Tasks"}
            </span>
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold",
                "border transition-all duration-150 cursor-pointer outline-none",
                activeFilterCount > 0
                  ? "bg-indigo-500 text-white border-indigo-500 shadow-sm"
                  : "bg-white/40 dark:bg-white/[0.06] border-white/70 dark:border-white/[0.10] text-slate-600 dark:text-white/70 hover:bg-white/60 dark:hover:bg-white/[0.10]"
              )}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              {locale === "uk" ? "Фільтри" : "Filters"}
              {activeFilterCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-white/30 text-white text-[10px] font-bold px-1">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-500/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-300 flex items-center gap-3 animate-fade-in">
              <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="flex-1">{error}</span>
              <button onClick={refresh} className="font-semibold underline underline-offset-2 hover:no-underline cursor-pointer" type="button">{t("retry")}</button>
            </div>
          )}

          <ItemList items={displayedItems} loading={loading} onDelete={handleDelete} onStatusChange={handleStatusChange} />
        </div>

        {/* RIGHT: Inline filter panel — only on xl+ */}
        <div className="hidden xl:block xl:sticky xl:top-[68px] xl:self-start xl:w-[240px] xl:flex-shrink-0 animate-fade-in-up stagger-3">
          <FilterPanel {...filterProps} />
        </div>
      </div>

      {/* Drawer — only on < xl */}
      <FilterDrawer open={filterOpen} onClose={() => setFilterOpen(false)} {...filterProps} />

      {/* Item detail overlay — opened via ?item=<id> (e.g. from notifications) */}
      {overlayItem && (
        <ItemDetailOverlay
          item={overlayItem}
          onClose={() => { setOverlayItem(null); router.replace("/"); }}
        />
      )}
    </div>
  );
}
