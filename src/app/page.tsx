"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format, isSameDay, startOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { FilterDrawer } from "@/components/dashboard/FilterDrawer";
import { FilterPanel } from "@/components/dashboard/FilterPanel";
import { ItemList } from "@/components/dashboard/ItemList";
import { BoardView } from "@/components/dashboard/BoardView";
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
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  type Priority = "LOW" | "MEDIUM" | "HIGH";
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [transitioning, setTransitioning] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewContainerRef = useRef<HTMLDivElement>(null);

  function switchView(mode: "list" | "board") {
    if (mode === viewMode) return;
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    // Lock container height so overflow-hidden doesn't clip the sliding-out view
    if (viewContainerRef.current) {
      viewContainerRef.current.style.minHeight = `${viewContainerRef.current.offsetHeight}px`;
    }
    setTransitioning(true);
    setViewMode(mode);
    transitionTimer.current = setTimeout(() => {
      setTransitioning(false);
      if (viewContainerRef.current) viewContainerRef.current.style.minHeight = "";
    }, 650);
  }

  // Restore / persist view mode across navigation (e.g. opening a task and pressing back)
  useEffect(() => {
    const saved = sessionStorage.getItem("dashboardView");
    if (saved === "board" || saved === "list") setViewMode(saved);
  }, []);
  useEffect(() => {
    sessionStorage.setItem("dashboardView", viewMode);
  }, [viewMode]);

  const { t, locale } = useLanguage();
  const { toast } = useToast();

  const { items, loading, error, refresh, silentRefresh, removeItem, changeStatus } = useItems({
    month: currentMonth,
    statuses: selectedStatuses,
  });

  function handleDayClick(date: Date) {
    if (selectedDay && isSameDay(selectedDay, date)) {
      setSelectedDay(null);
      sessionStorage.removeItem("newItemDeadline");
    } else {
      setSelectedDay(date);
      const d = new Date(date);
      d.setHours(12, 0, 0, 0);
      sessionStorage.setItem("newItemDeadline", format(d, "yyyy-MM-dd'T'HH:mm"));
    }
  }

  function handleMonthChange(newMonth: Date) {
    setCurrentMonth(newMonth);
    setSelectedDay(null);
  }

  const handleDelete = useCallback(async (id: string) => {
    try { await removeItem(id); }
    catch { toast(t("networkError"), "error"); }
  }, [removeItem, toast, t]);

  const handleStatusChange = useCallback(async (id: string, status: Status) => {
    await changeStatus(id, status);
    silentRefresh();
  }, [changeStatus, silentRefresh]);

  const uniqueProjects = useMemo(
    () => [...new Set(items.map((i) => i.project).filter(Boolean))].sort() as string[],
    [items]
  );
  const uniqueAssignees = useMemo(
    () => [...new Set(items.map((i) => i.assignee).filter(Boolean))].sort() as string[],
    [items]
  );
  const uniqueDepartments = useMemo(
    () => [...new Set(items.map((i) => i.department).filter(Boolean))].sort() as string[],
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
    if (selectedDepartments.length > 0)
      result = result.filter((item) => item.department && selectedDepartments.includes(item.department));
    if (selectedPriorities.length > 0)
      result = result.filter((item) => item.priority && selectedPriorities.includes(item.priority as Priority));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) => item.title.toLowerCase().includes(q));
    }
    return result;
  }, [items, selectedDay, selectedProjects, selectedAssignees, selectedDepartments, selectedPriorities, searchQuery]);

  // List view archives completed tasks (hidden) unless DONE is explicitly filtered.
  // Board view always shows everything, including completed.
  const listItems = useMemo(
    () => selectedStatuses.includes("DONE")
      ? displayedItems
      : displayedItems.filter((item) => item.status !== "DONE"),
    [displayedItems, selectedStatuses]
  );

  const activeFilterCount = selectedStatuses.length + selectedProjects.length + selectedAssignees.length + selectedDepartments.length + selectedPriorities.length;

  const filterProps = {
    selectedStatuses, onStatusChange: setSelectedStatuses,
    selectedProjects, onProjectToggle: (p: string) => setSelectedProjects((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]),
    onProjectClear: () => setSelectedProjects([]),
    selectedAssignees, onAssigneeToggle: (a: string) => setSelectedAssignees((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]),
    onAssigneeClear: () => setSelectedAssignees([]),
    selectedDepartments, onDepartmentToggle: (d: string) => setSelectedDepartments((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]),
    onDepartmentClear: () => setSelectedDepartments([]),
    selectedPriorities, onPriorityToggle: (p: Priority) => setSelectedPriorities((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]),
    onPriorityClear: () => setSelectedPriorities([]),
    uniqueProjects, uniqueAssignees, uniqueDepartments,
    onClearAll: () => { setSelectedStatuses([]); setSelectedProjects([]); setSelectedAssignees([]); setSelectedDepartments([]); setSelectedPriorities([]); },
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

          {/* Search */}
          <div className={cn(
            "flex items-center gap-2.5 px-3.5 h-[50px] rounded-xl animate-fade-in-up stagger-2",
            "bg-white/40 dark:bg-white/[0.06]",
            "border border-white/70 dark:border-white/[0.10]",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-none"
          )}>
            <svg className="h-4 w-4 flex-shrink-0 text-slate-400 dark:text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === "uk" ? "Пошук задач..." : "Search tasks..."}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-slate-400 dark:placeholder:text-white/30 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="flex-shrink-0 text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* View mode switcher */}
          <div className={cn(
            "flex rounded-xl p-0.5 gap-0.5 h-[50px] animate-fade-in-up stagger-2",
            "bg-white/40 dark:bg-white/[0.06]",
            "border border-white/70 dark:border-white/[0.10]",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-none"
          )}>
            <button
              type="button"
              onClick={() => switchView("list")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer outline-none",
                viewMode === "list"
                  ? "bg-white dark:bg-white/20 text-indigo-600 dark:text-white shadow-[0_1px_4px_rgba(99,102,241,0.18),0_1px_2px_rgba(0,0,0,0.08)] dark:shadow-sm"
                  : "text-slate-400 dark:text-white/50 hover:text-slate-600 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10"
              )}
            >
              <svg className="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              {locale === "uk" ? "Список" : "List"}
            </button>
            <button
              type="button"
              onClick={() => switchView("board")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer outline-none",
                viewMode === "board"
                  ? "bg-white dark:bg-white/20 text-indigo-600 dark:text-white shadow-[0_1px_4px_rgba(99,102,241,0.18),0_1px_2px_rgba(0,0,0,0.08)] dark:shadow-sm"
                  : "text-slate-400 dark:text-white/50 hover:text-slate-600 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10"
              )}
            >
              <svg className="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              {locale === "uk" ? "Дошка" : "Board"}
            </button>
          </div>

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

          {/* Animated view container — clips at center-column edges. Inner padding keeps
              card shadows from being cut by overflow-hidden. The active view is in-flow
              (sets the height); the inactive one is absolute so it never adds extra height. */}
          <div ref={viewContainerRef} className="relative overflow-hidden -m-2">
            {/* List view */}
            <div className={cn(
              "p-2 flex flex-col gap-4 transition-[transform,opacity] duration-[600ms] ease-[cubic-bezier(0.65,0,0.35,1)]",
              transitioning && "will-change-[transform,opacity]",
              viewMode === "list"
                ? "relative opacity-100"
                : "absolute inset-x-0 top-0 -translate-x-[103%] opacity-0 pointer-events-none"
            )}>
              <ItemList items={listItems} loading={loading} onDelete={handleDelete} onStatusChange={handleStatusChange} />
            </div>
            {/* Board view — grouped by project */}
            <div className={cn(
              "p-2 transition-[transform,opacity] duration-[600ms] ease-[cubic-bezier(0.65,0,0.35,1)]",
              transitioning && "will-change-[transform,opacity]",
              viewMode === "board"
                ? "relative opacity-100"
                : "absolute inset-x-0 top-0 translate-x-[103%] opacity-0 pointer-events-none"
            )}>
              <BoardView items={displayedItems} onDelete={handleDelete} onStatusChange={handleStatusChange} forceExpand={!!searchQuery.trim()} />
            </div>
          </div>
        </div>

        {/* RIGHT: Inline filter panel — only on xl+ */}
        <div className="hidden xl:block xl:sticky xl:top-[68px] xl:self-start xl:w-[240px] xl:flex-shrink-0 animate-fade-in-up stagger-3">
          <FilterPanel {...filterProps} />
        </div>
      </div>

      {/* Drawer — only on < xl */}
      <FilterDrawer open={filterOpen} onClose={() => setFilterOpen(false)} {...filterProps} />


    </div>
  );
}
