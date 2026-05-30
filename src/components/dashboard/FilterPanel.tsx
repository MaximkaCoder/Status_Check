"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { StatusFilterChips } from "./StatusFilterChips";
import { useLanguage } from "@/contexts/LanguageContext";

type Status = "TO_CHECK" | "EXPIRED" | "DONE" | "NOT_ACTUAL" | "IDEAS_BACKLOG";

interface Props {
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

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative mb-1.5">
      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-lg pl-7 pr-6 py-1.5 text-[11px]",
          "bg-black/[0.04] dark:bg-white/[0.05]",
          "border border-border/40 dark:border-white/[0.07]",
          "text-foreground placeholder:text-muted-foreground/40",
          "focus:outline-none focus:ring-1 focus:ring-indigo-400/40",
          "transition-all duration-150"
        )}
      />
      {value && (
        <button type="button" onClick={() => onChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground cursor-pointer">
          <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export function FilterPanel({
  selectedStatuses, onStatusChange,
  selectedProjects, onProjectToggle, onProjectClear,
  selectedAssignees, onAssigneeToggle, onAssigneeClear,
  uniqueProjects, uniqueAssignees,
  onClearAll, activeCount,
}: Props) {
  const { t, locale } = useLanguage();
  const [projectSearch, setProjectSearch] = useState("");
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const uk = locale === "uk";

  const filteredProjects  = uniqueProjects.filter((p)  => p.toLowerCase().includes(projectSearch.toLowerCase()));
  const filteredAssignees = uniqueAssignees.filter((a) => a.toLowerCase().includes(assigneeSearch.toLowerCase()));

  return (
    <div className={cn(
      "rounded-2xl overflow-hidden",
      "bg-white/40 dark:bg-white/[0.04] backdrop-blur-md",
      "border border-white/70 dark:border-white/[0.08]",
      "shadow-[0_4px_24px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]",
      "dark:shadow-[0_4px_24px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)]"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/60 dark:border-white/[0.07]">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-foreground">{uk ? "Фільтри" : "Filters"}</span>
          {activeCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 text-white text-[10px] font-bold px-1.5">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button type="button" onClick={onClearAll}
            className="text-[10px] font-medium text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer">
            {uk ? "Скинути" : "Clear all"}
          </button>
        )}
      </div>

      <div className="px-4 py-4 space-y-5">

        {/* Status */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">{t("status")}</p>
            {selectedStatuses.length > 0 && (
              <button type="button" onClick={() => onStatusChange([])} className="text-[9px] text-muted-foreground hover:text-rose-500 cursor-pointer transition-colors">{locale === "uk" ? "Очистити" : "Clear"}</button>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            {(["TO_CHECK","EXPIRED","DONE","NOT_ACTUAL","IDEAS_BACKLOG"] as Status[]).map((s) => {
              const active = selectedStatuses.includes(s);
              const labelMap: Record<Status, string> = {
                TO_CHECK: t("toCheck"), EXPIRED: t("expired"), DONE: t("done"),
                NOT_ACTUAL: t("notActual"), IDEAS_BACKLOG: t("ideasBacklog"),
              };
              const dotMap: Record<Status, string> = {
                TO_CHECK: "bg-indigo-500", EXPIRED: "bg-rose-500", DONE: "bg-emerald-500",
                NOT_ACTUAL: "bg-slate-400", IDEAS_BACKLOG: "bg-violet-500",
              };
              const activeBg: Record<Status, string> = {
                TO_CHECK: "bg-indigo-50 dark:bg-indigo-900/25 text-indigo-700 dark:text-indigo-300",
                EXPIRED:  "bg-rose-50 dark:bg-rose-900/25 text-rose-700 dark:text-rose-300",
                DONE:     "bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-300",
                NOT_ACTUAL: "bg-slate-50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-300",
                IDEAS_BACKLOG: "bg-violet-50 dark:bg-violet-900/25 text-violet-700 dark:text-violet-300",
              };
              return (
                <button key={s} type="button" onClick={() => {
                  if (active) onStatusChange(selectedStatuses.filter((x) => x !== s));
                  else onStatusChange([...selectedStatuses, s]);
                }}
                  className={cn(
                    "flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs text-left transition-all duration-150 cursor-pointer outline-none",
                    active ? activeBg[s] + " font-semibold" : "text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", dotMap[s])} />
                  <span className="flex-1">{labelMap[s]}</span>
                  {active && <svg className="h-3 w-3 flex-shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                </button>
              );
            })}
          </div>
        </section>

        {/* Projects */}
        {uniqueProjects.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">{uk ? "Проєкт" : "Project"}</p>
              {selectedProjects.length > 0 && (
                <button type="button" onClick={onProjectClear} className="text-[9px] text-muted-foreground hover:text-rose-500 cursor-pointer transition-colors">{uk ? "Очистити" : "Clear"}</button>
              )}
            </div>
            <SearchInput value={projectSearch} onChange={setProjectSearch} placeholder={uk ? "Пошук проєкту..." : "Search project..."} />
            <div className="flex flex-col gap-0.5">
              {filteredProjects.length === 0 ? (
                <p className="text-[11px] text-muted-foreground/40 py-1.5 text-center">{uk ? "Нічого" : "Nothing found"}</p>
              ) : filteredProjects.map((proj) => {
                const active = selectedProjects.includes(proj);
                return (
                  <button key={proj} type="button" onClick={() => onProjectToggle(proj)}
                    className={cn(
                      "flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs text-left transition-all duration-150 cursor-pointer outline-none",
                      active ? "bg-indigo-50 dark:bg-indigo-900/25 text-indigo-700 dark:text-indigo-300 font-semibold" : "text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0 transition-colors", active ? "bg-indigo-500" : "bg-slate-300 dark:bg-white/20")} />
                    <span className="flex-1 truncate">{proj}</span>
                    {active && <svg className="h-3 w-3 flex-shrink-0 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
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
              <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">{uk ? "Виконавець" : "Assignee"}</p>
              {selectedAssignees.length > 0 && (
                <button type="button" onClick={onAssigneeClear} className="text-[9px] text-muted-foreground hover:text-rose-500 cursor-pointer transition-colors">{uk ? "Очистити" : "Clear"}</button>
              )}
            </div>
            <SearchInput value={assigneeSearch} onChange={setAssigneeSearch} placeholder={uk ? "Пошук виконавця..." : "Search assignee..."} />
            <div className="flex flex-col gap-0.5">
              {filteredAssignees.length === 0 ? (
                <p className="text-[11px] text-muted-foreground/40 py-1.5 text-center">{uk ? "Нічого" : "Nothing found"}</p>
              ) : filteredAssignees.map((name) => {
                const active = selectedAssignees.includes(name);
                return (
                  <button key={name} type="button" onClick={() => onAssigneeToggle(name)}
                    className={cn(
                      "flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs text-left transition-all duration-150 cursor-pointer outline-none",
                      active ? "bg-violet-50 dark:bg-violet-900/25 text-violet-700 dark:text-violet-300 font-semibold" : "text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                    )}
                  >
                    <span className={cn("inline-flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-white flex-shrink-0 transition-colors", active ? "bg-violet-500" : "bg-slate-400 dark:bg-white/20")}>
                      {name.charAt(0)}
                    </span>
                    <span className="flex-1 truncate">{name}</span>
                    {active && <svg className="h-3 w-3 flex-shrink-0 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
