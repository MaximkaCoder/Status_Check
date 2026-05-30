"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { StatusFilterChips } from "./StatusFilterChips";
import { useLanguage } from "@/contexts/LanguageContext";

type Status = "TO_CHECK" | "EXPIRED" | "DONE" | "NOT_ACTUAL" | "IDEAS_BACKLOG";

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  selectedStatuses: Status[];
  onStatusChange: (s: Status[]) => void;
  selectedProjects: string[];
  onProjectToggle: (p: string) => void;
  onProjectClear: () => void;
  selectedAssignees: string[];
  onAssigneeToggle: (a: string) => void;
  onAssigneeClear: () => void;
  uniqueProjects: string[];
  uniqueAssignees: string[];
  onClearAll: () => void;
  activeCount: number;
}

export function FilterDrawer({
  open, onClose,
  selectedStatuses, onStatusChange,
  selectedProjects, onProjectToggle, onProjectClear,
  selectedAssignees, onAssigneeToggle, onAssigneeClear,
  uniqueProjects, uniqueAssignees,
  onClearAll, activeCount,
}: FilterDrawerProps) {
  const { t, locale } = useLanguage();

  // Lock body scroll when open on mobile
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Escape to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const projectLabel  = locale === "uk" ? "Проєкт"    : "Project";
  const assigneeLabel = locale === "uk" ? "Виконавець" : "Assignee";
  const clearLabel    = locale === "uk" ? "Очистити"   : "Clear";
  const clearAllLabel = locale === "uk" ? "Скинути все" : "Clear all";
  const filtersLabel  = locale === "uk" ? "Фільтри"    : "Filters";

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Drawer */}
      <aside
        aria-label="Filters"
        className={cn(
          "fixed top-[56px] right-0 h-[calc(100dvh-56px)] w-72 z-50",
          "flex flex-col",
          "bg-white/95 dark:bg-[#0d0e22]/95 backdrop-blur-xl",
          "border-l border-white/60 dark:border-white/[0.08]",
          "shadow-[-8px_0_32px_rgba(0,0,0,0.08)] dark:shadow-[-8px_0_32px_rgba(0,0,0,0.5)]",
          "transform transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 dark:border-white/[0.08] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">{filtersLabel}</span>
            {activeCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 text-white text-[10px] font-bold px-1">
                {activeCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
              >
                {clearAllLabel}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Status */}
          <section>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              {t("filter")}
            </p>
            <StatusFilterChips selected={selectedStatuses} onChange={onStatusChange} />
          </section>

          {/* Projects */}
          {uniqueProjects.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{projectLabel}</p>
                {selectedProjects.length > 0 && (
                  <button type="button" onClick={onProjectClear} className="text-[10px] text-muted-foreground hover:text-rose-500 cursor-pointer transition-colors">{clearLabel}</button>
                )}
              </div>
              <div className="flex flex-col gap-1">
                {uniqueProjects.map((proj) => {
                  const active = selectedProjects.includes(proj);
                  return (
                    <button
                      key={proj}
                      type="button"
                      onClick={() => onProjectToggle(proj)}
                      className={cn(
                        "flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-medium text-left transition-all duration-150 cursor-pointer outline-none",
                        active
                          ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                          : "text-foreground hover:bg-muted/60 dark:hover:bg-white/5"
                      )}
                    >
                      <span className={cn(
                        "h-2 w-2 rounded-full flex-shrink-0 transition-colors",
                        active ? "bg-indigo-500" : "bg-muted-foreground/40"
                      )} />
                      <span className="truncate">{proj}</span>
                      {active && (
                        <svg className="h-3.5 w-3.5 ml-auto flex-shrink-0 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Assignees */}
          {uniqueAssignees.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{assigneeLabel}</p>
                {selectedAssignees.length > 0 && (
                  <button type="button" onClick={onAssigneeClear} className="text-[10px] text-muted-foreground hover:text-rose-500 cursor-pointer transition-colors">{clearLabel}</button>
                )}
              </div>
              <div className="flex flex-col gap-1">
                {uniqueAssignees.map((name) => {
                  const active = selectedAssignees.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => onAssigneeToggle(name)}
                      className={cn(
                        "flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-medium text-left transition-all duration-150 cursor-pointer outline-none",
                        active
                          ? "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                          : "text-foreground hover:bg-muted/60 dark:hover:bg-white/5"
                      )}
                    >
                      <span className={cn(
                        "inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white flex-shrink-0 transition-colors",
                        active ? "bg-violet-500" : "bg-muted-foreground/40"
                      )}>
                        {name.charAt(0)}
                      </span>
                      <span className="truncate">{name}</span>
                      {active && (
                        <svg className="h-3.5 w-3.5 ml-auto flex-shrink-0 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </aside>
    </>
  );
}
