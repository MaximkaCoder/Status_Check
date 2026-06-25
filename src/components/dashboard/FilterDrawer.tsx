"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { StatusFilterChips } from "./StatusFilterChips";
import { useLanguage } from "@/contexts/LanguageContext";

type Status = "TO_CHECK" | "EXPIRED" | "DONE" | "NOT_ACTUAL" | "IDEAS_BACKLOG";
type Priority = "LOW" | "MEDIUM" | "HIGH";

const PRIORITY_DRAWER_CFG: Record<Priority, { dot: string; activeCls: string; checkCls: string; label: (uk: boolean) => string }> = {
  LOW:    { dot: "bg-blue-500",  activeCls: "bg-blue-50 dark:bg-blue-900/25 text-blue-700 dark:text-blue-300 font-semibold",   checkCls: "text-blue-500",  label: (uk) => uk ? "Низький"  : "Low"    },
  MEDIUM: { dot: "bg-amber-500", activeCls: "bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-300 font-semibold", checkCls: "text-amber-500", label: (uk) => uk ? "Середній" : "Medium" },
  HIGH:   { dot: "bg-rose-500",  activeCls: "bg-rose-50 dark:bg-rose-900/25 text-rose-700 dark:text-rose-300 font-semibold",   checkCls: "text-rose-500",  label: (uk) => uk ? "Високий"  : "High"   },
};

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
  selectedDepartments: string[];
  onDepartmentToggle: (d: string) => void;
  onDepartmentClear: () => void;
  selectedPriorities: Priority[];
  onPriorityToggle: (p: Priority) => void;
  onPriorityClear: () => void;
  uniqueProjects: string[];
  uniqueAssignees: string[];
  uniqueDepartments: string[];
  onClearAll: () => void;
  activeCount: number;
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative mb-2">
      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-lg pl-8 pr-3 py-1.5 text-xs",
          "bg-black/[0.04] dark:bg-white/[0.06]",
          "border border-border/50 dark:border-white/[0.08]",
          "text-foreground placeholder:text-muted-foreground/50",
          "focus:outline-none focus:ring-1 focus:ring-indigo-400/40",
          "transition-all duration-150"
        )}
      />
      {value && (
        <button type="button" onClick={() => onChange("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground cursor-pointer">
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function FilterDrawer({
  open, onClose,
  selectedStatuses, onStatusChange,
  selectedProjects, onProjectToggle, onProjectClear,
  selectedAssignees, onAssigneeToggle, onAssigneeClear,
  selectedDepartments, onDepartmentToggle, onDepartmentClear,
  selectedPriorities, onPriorityToggle, onPriorityClear,
  uniqueProjects, uniqueAssignees, uniqueDepartments,
  onClearAll, activeCount,
}: FilterDrawerProps) {
  const { t, locale } = useLanguage();
  const [projectSearch,  setProjectSearch]  = useState("");
  const [assigneeSearch, setAssigneeSearch] = useState("");

  const filteredProjects  = uniqueProjects.filter((p)  => p.toLowerCase().includes(projectSearch.toLowerCase()));
  const filteredAssignees = uniqueAssignees.filter((a) => a.toLowerCase().includes(assigneeSearch.toLowerCase()));

  useEffect(() => {
    if (!open) { setProjectSearch(""); setAssigneeSearch(""); }
  }, [open]);

  const uk = locale === "uk";

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 transition-opacity duration-300",
          "bg-black/20 backdrop-blur-[2px]",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-dvh w-72 z-50 flex flex-col",
          // Glass matching the site style
          "bg-white/80 dark:bg-[#0a0b1a]/90",
          "backdrop-blur-2xl",
          "border-l border-white/60 dark:border-white/[0.08]",
          "shadow-[-12px_0_40px_rgba(0,0,0,0.08),inset_1px_0_0_rgba(255,255,255,0.6)]",
          "dark:shadow-[-12px_0_40px_rgba(0,0,0,0.6),inset_1px_0_0_rgba(255,255,255,0.04)]",
          "transform transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-[57px] border-b border-white/60 dark:border-white/[0.08] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800 dark:text-white">
              {uk ? "Фільтри" : "Filters"}
            </span>
            {activeCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 text-white text-[10px] font-bold px-1.5">
                {activeCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button type="button" onClick={onClearAll}
                className="text-[11px] font-medium text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer">
                {uk ? "Скинути" : "Clear all"}
              </button>
            )}
            <button type="button" onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-black/[0.06] dark:hover:bg-white/[0.08] hover:text-foreground transition-all cursor-pointer outline-none">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

          {/* Status */}
          <section>
            <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-2.5">
              {t("status")}
            </p>
            <StatusFilterChips selected={selectedStatuses} onChange={onStatusChange} />
          </section>

          {/* Projects */}
          {uniqueProjects.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
                  {uk ? "Проєкт" : "Project"}
                </p>
                {selectedProjects.length > 0 && (
                  <button type="button" onClick={onProjectClear}
                    className="text-[10px] text-muted-foreground hover:text-rose-500 cursor-pointer transition-colors">
                    {uk ? "Очистити" : "Clear"}
                  </button>
                )}
              </div>
              <SearchInput
                value={projectSearch}
                onChange={setProjectSearch}
                placeholder={uk ? "Пошук проєкту..." : "Search project..."}
              />
              <div className="flex flex-col gap-0.5">
                {filteredProjects.length === 0 ? (
                  <p className="text-xs text-muted-foreground/50 py-2 text-center">{uk ? "Нічого не знайдено" : "Nothing found"}</p>
                ) : filteredProjects.map((proj) => {
                  const active = selectedProjects.includes(proj);
                  return (
                    <button key={proj} type="button" onClick={() => onProjectToggle(proj)}
                      className={cn(
                        "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-sm text-left transition-all duration-150 cursor-pointer outline-none",
                        active
                          ? "bg-indigo-50 dark:bg-indigo-900/25 text-indigo-700 dark:text-indigo-300 font-semibold"
                          : "text-slate-700 dark:text-white/70 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                      )}
                    >
                      <span className={cn("h-2 w-2 rounded-full flex-shrink-0 transition-colors", active ? "bg-indigo-500" : "bg-slate-300 dark:bg-white/20")} />
                      <span className="flex-1 truncate">{proj}</span>
                      {active && (
                        <svg className="h-3.5 w-3.5 flex-shrink-0 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
                  {uk ? "Виконавець" : "Assignee"}
                </p>
                {selectedAssignees.length > 0 && (
                  <button type="button" onClick={onAssigneeClear}
                    className="text-[10px] text-muted-foreground hover:text-rose-500 cursor-pointer transition-colors">
                    {uk ? "Очистити" : "Clear"}
                  </button>
                )}
              </div>
              <SearchInput
                value={assigneeSearch}
                onChange={setAssigneeSearch}
                placeholder={uk ? "Пошук виконавця..." : "Search assignee..."}
              />
              <div className="flex flex-col gap-0.5">
                {filteredAssignees.length === 0 ? (
                  <p className="text-xs text-muted-foreground/50 py-2 text-center">{uk ? "Нічого не знайдено" : "Nothing found"}</p>
                ) : filteredAssignees.map((name) => {
                  const active = selectedAssignees.includes(name);
                  return (
                    <button key={name} type="button" onClick={() => onAssigneeToggle(name)}
                      className={cn(
                        "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-sm text-left transition-all duration-150 cursor-pointer outline-none",
                        active
                          ? "bg-violet-50 dark:bg-violet-900/25 text-violet-700 dark:text-violet-300 font-semibold"
                          : "text-slate-700 dark:text-white/70 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                      )}
                    >
                      <span className={cn(
                        "inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white flex-shrink-0 transition-colors",
                        active ? "bg-violet-500" : "bg-slate-400 dark:bg-white/20"
                      )}>
                        {name.charAt(0)}
                      </span>
                      <span className="flex-1 truncate">{name}</span>
                      {active && (
                        <svg className="h-3.5 w-3.5 flex-shrink-0 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
          {/* Departments */}
          {uniqueDepartments.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
                  {uk ? "Відділ" : "Department"}
                </p>
                {selectedDepartments.length > 0 && (
                  <button type="button" onClick={onDepartmentClear}
                    className="text-[10px] text-muted-foreground hover:text-rose-500 cursor-pointer transition-colors">
                    {uk ? "Очистити" : "Clear"}
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                {uniqueDepartments.map((dept) => {
                  const active = selectedDepartments.includes(dept);
                  return (
                    <button key={dept} type="button" onClick={() => onDepartmentToggle(dept)}
                      className={cn(
                        "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-sm text-left transition-all duration-150 cursor-pointer outline-none",
                        active
                          ? "bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-300 font-semibold"
                          : "text-slate-700 dark:text-white/70 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                      )}
                    >
                      <span className={cn("h-2 w-2 rounded-full flex-shrink-0 transition-colors", active ? "bg-amber-500" : "bg-slate-300 dark:bg-white/20")} />
                      <span className="flex-1 truncate">{dept}</span>
                      {active && (
                        <svg className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Priority */}
          <section>
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
                {uk ? "Пріоритет" : "Priority"}
              </p>
              {selectedPriorities.length > 0 && (
                <button type="button" onClick={onPriorityClear}
                  className="text-[10px] text-muted-foreground hover:text-rose-500 cursor-pointer transition-colors">
                  {uk ? "Очистити" : "Clear"}
                </button>
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              {(["HIGH", "MEDIUM", "LOW"] as Priority[]).map((p) => {
                const active = selectedPriorities.includes(p);
                const cfg = PRIORITY_DRAWER_CFG[p];
                return (
                  <button key={p} type="button" onClick={() => onPriorityToggle(p)}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-xl text-sm text-left transition-all duration-150 cursor-pointer outline-none",
                      active ? cfg.activeCls : "text-slate-700 dark:text-white/70 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                    )}
                  >
                    <span className={cn("h-2 w-2 rounded-full flex-shrink-0 transition-colors", active ? cfg.dot : "bg-slate-300 dark:bg-white/20")} />
                    <span className="flex-1">{cfg.label(uk)}</span>
                    {active && (
                      <svg className={cn("h-3.5 w-3.5 flex-shrink-0", cfg.checkCls)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

        </div>
      </aside>
    </>
  );
}
