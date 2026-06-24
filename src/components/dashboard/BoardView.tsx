"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ItemCard } from "./ItemCard";
import { useLanguage } from "@/contexts/LanguageContext";
import type { StatusItem } from "@/lib/types";

type Status = "TO_CHECK" | "EXPIRED" | "DONE" | "NOT_ACTUAL" | "IDEAS_BACKLOG";

interface BoardViewProps {
  items: StatusItem[];
  onDelete: (id: string) => Promise<void>;
  onStatusChange?: (id: string, status: Status) => Promise<void>;
}

interface Group {
  key: string;
  label: string;
  items: StatusItem[];
}

export function BoardView({ items, onDelete, onStatusChange }: BoardViewProps) {
  const { locale } = useLanguage();
  const router = useRouter();
  const noProjectLabel = locale === "uk" ? "Без проєкту" : "No project";

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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
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
      {groups.map((group, gi) => {
        const isOpen = expanded.has(group.key);
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

            {/* Collapsible body — grid-rows trick for smooth height animation */}
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <div className="px-3 pb-3 pt-1 flex flex-col gap-3">
                  {group.items.map((item, i) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onDelete={onDelete}
                      onStatusChange={onStatusChange}
                      onDetailClick={(it) => router.push(`/items/${it.id}`)}
                      animationIndex={i}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
