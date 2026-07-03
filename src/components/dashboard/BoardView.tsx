"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ItemCard } from "./ItemCard";
import { useLanguage } from "@/contexts/LanguageContext";
import type { StatusItem } from "@/lib/types";

type Status = "TO_CHECK" | "EXPIRED" | "DONE" | "NOT_ACTUAL" | "IDEAS_BACKLOG";

const DROP_STATUSES: Status[] = ["TO_CHECK", "DONE", "EXPIRED", "IDEAS_BACKLOG", "NOT_ACTUAL"];
const DROP_STYLE: Record<Status, { base: string; hot: string; dot: string }> = {
  TO_CHECK:      { base: "border-indigo-300 text-indigo-600 dark:border-indigo-500/40 dark:text-indigo-300",   hot: "bg-indigo-500 border-indigo-500 text-white",   dot: "bg-indigo-500" },
  DONE:          { base: "border-emerald-300 text-emerald-600 dark:border-emerald-500/40 dark:text-emerald-300", hot: "bg-emerald-500 border-emerald-500 text-white", dot: "bg-emerald-500" },
  EXPIRED:       { base: "border-rose-300 text-rose-600 dark:border-rose-500/40 dark:text-rose-300",           hot: "bg-rose-500 border-rose-500 text-white",       dot: "bg-rose-500" },
  IDEAS_BACKLOG: { base: "border-violet-300 text-violet-600 dark:border-violet-500/40 dark:text-violet-300",   hot: "bg-violet-500 border-violet-500 text-white",   dot: "bg-violet-500" },
  NOT_ACTUAL:    { base: "border-slate-300 text-slate-500 dark:border-slate-600/40 dark:text-slate-400",       hot: "bg-slate-500 border-slate-500 text-white",     dot: "bg-slate-400" },
};

interface BoardViewProps {
  items: StatusItem[];
  onDelete: (id: string) => Promise<void>;
  onStatusChange?: (id: string, status: Status) => Promise<void>;
  forceExpand?: boolean;
}

interface Group {
  key: string;
  label: string;
  items: StatusItem[];
}

export const BoardView = memo(function BoardView({ items, onDelete, onStatusChange, forceExpand }: BoardViewProps) {
  const { locale, t } = useLanguage();
  const router = useRouter();
  const noProjectLabel = locale === "uk" ? "Без проєкту" : "No project";

  // Drag-to-restatus: dragging a card reveals a floating status bar; dropping
  // on a status calls onStatusChange. Board stays grouped by project.
  const [dragging, setDragging] = useState<{ id: string; status: Status } | null>(null);
  const [hotStatus, setHotStatus] = useState<Status | null>(null);

  const statusLabel: Record<Status, string> = {
    TO_CHECK: t("toCheck"), EXPIRED: t("expired"), DONE: t("done"),
    NOT_ACTUAL: t("notActual"), IDEAS_BACKLOG: t("ideasBacklog"),
  };

  function handleDrop(status: Status) {
    if (dragging && dragging.status !== status && onStatusChange) {
      onStatusChange(dragging.id, status).catch(() => {});
    }
    setDragging(null);
    setHotStatus(null);
  }

  // Group items by project. Items are already filtered by access rights upstream,
  // so every project that appears here is one the user can see.
  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, StatusItem[]>();
    for (const item of items) {
      const key = item.project ?? "__none__";
      const arr = map.get(key);
      if (arr) arr.push(item);
      else map.set(key, [item]);
    }
    return [...map.entries()]
      .map(([key, groupItems]) => ({
        key,
        label: key === "__none__" ? noProjectLabel : key,
        items: groupItems,
      }))
      .sort((a, b) => {
        if (a.key === "__none__") return 1;
        if (b.key === "__none__") return -1;
        return a.label.localeCompare(b.label);
      });
  }, [items, noProjectLabel]);

  // All groups collapsed by default; track expanded ones.
  // Persisted so returning from a task detail keeps the same project open.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("boardExpanded");
      if (saved) setExpanded(new Set(JSON.parse(saved) as string[]));
    } catch { /* ignore */ }
  }, []);

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      sessionStorage.setItem("boardExpanded", JSON.stringify([...next]));
      return next;
    });
  }

  if (groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        {locale === "uk" ? "Немає задач" : "No tasks"}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Floating status drop bar — only while dragging a card */}
      {dragging && typeof window !== "undefined" && createPortal(
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/60 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
          <span className="text-[11px] font-semibold text-muted-foreground px-1.5 hidden sm:block">
            {locale === "uk" ? "Кинь на статус →" : "Drop on status →"}
          </span>
          {DROP_STATUSES.map((s) => {
            const cfg = DROP_STYLE[s];
            const hot = hotStatus === s;
            const isCurrent = dragging.status === s;
            return (
              <div
                key={s}
                onDragOver={(e) => { e.preventDefault(); setHotStatus(s); }}
                onDragLeave={() => setHotStatus((cur) => (cur === s ? null : cur))}
                onDrop={() => handleDrop(s)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-xs font-semibold select-none transition-colors duration-100",
                  isCurrent ? "opacity-40 border-dashed" : "",
                  hot ? cfg.hot : cfg.base
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", hot ? "bg-white" : cfg.dot)} />
                {statusLabel[s]}
              </div>
            );
          })}
        </div>,
        document.body
      )}

      {groups.map((group, gi) => {
        const isOpen = forceExpand || expanded.has(group.key);
        return (
          <div
            key={group.key}
            className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden animate-fade-in-up"
            style={{ animationDelay: `${Math.min(gi * 50, 300)}ms` }}
          >
            {/* Project header */}
            <button
              type="button"
              onClick={() => toggle(group.key)}
              aria-expanded={isOpen}
              className={cn(
                "w-full flex items-center gap-2.5 px-4 py-3.5 cursor-pointer outline-none",
                "hover:bg-muted/40 transition-colors duration-150 text-left"
              )}
            >
              <svg
                className={cn(
                  "h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-300 ease-out motion-reduce:transition-none",
                  isOpen ? "rotate-90" : "rotate-0"
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-sm font-bold text-foreground truncate min-w-0">{group.label}</span>
              <span className="ml-auto flex-shrink-0 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold">
                {group.items.length}
              </span>
            </button>

            {/* Collapsible body — grid-rows for height + opacity/translate for GPU-smooth reveal */}
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <div
                  className={cn(
                    "px-3 pb-3 pt-1 flex flex-col gap-3",
                    "transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none",
                    isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
                  )}
                >
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      draggable={!!onStatusChange}
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        setDragging({ id: item.id, status: item.status });
                      }}
                      onDragEnd={() => { setDragging(null); setHotStatus(null); }}
                      className={cn(
                        onStatusChange && "cursor-grab active:cursor-grabbing",
                        dragging?.id === item.id && "opacity-40"
                      )}
                    >
                      <ItemCard
                        item={item}
                        onDelete={onDelete}
                        onStatusChange={onStatusChange}
                        animate={false}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
