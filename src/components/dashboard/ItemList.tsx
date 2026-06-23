"use client";

import { useRouter } from "next/navigation";
import { ItemCard } from "./ItemCard";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import type { StatusItem } from "@/lib/types";

type Status = "TO_CHECK" | "EXPIRED" | "DONE" | "NOT_ACTUAL" | "IDEAS_BACKLOG";

interface ItemListProps {
  items: StatusItem[];
  loading: boolean;
  onDelete: (id: string) => Promise<void>;
  onStatusChange?: (id: string, status: Status) => Promise<void>;
}

function SkeletonCard({ index }: { index: number }) {
  return (
    <div
      className="flex items-stretch gap-0 rounded-xl border border-border/60 bg-card overflow-hidden shadow-card animate-fade-in-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="w-1.5 skeleton flex-shrink-0" />
      <div className="flex flex-1 items-start gap-3 px-4 py-3.5">
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="h-4 skeleton rounded w-2/3" />
            <div className="h-5 skeleton rounded-full w-16 ml-auto" />
          </div>
          <div className="h-3 skeleton rounded w-1/2" />
          <div className="flex gap-3">
            <div className="h-3 skeleton rounded w-24" />
            <div className="h-3 skeleton rounded w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ItemList({ items, loading, onDelete, onStatusChange }: ItemListProps) {
  const { t } = useLanguage();
  const router = useRouter();

  if (loading) {
    return (
      <div
        className="flex flex-col gap-2.5"
        aria-label="Loading items"
        aria-busy="true"
        aria-live="polite"
      >
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} index={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        {/* Empty state illustration */}
        <div
          className={
            "w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/25 " +
            "flex items-center justify-center mb-5 shadow-sm"
          }
        >
          <svg
            className="h-8 w-8 text-indigo-300 dark:text-indigo-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="text-base font-bold text-foreground mb-1.5">{t("noItems")}</h3>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          {t("noItemsDesc")}
        </p>
        <Link
          href="/items/new"
          className={
            "mt-5 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl " +
            "bg-indigo-600 text-white text-sm font-semibold " +
            "hover:bg-indigo-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 " +
            "transition-all duration-200 cursor-pointer"
          }
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          {t("createFirst")}
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2.5" role="list" aria-label="Items">
        {items.map((item, index) => (
          <div key={item.id} role="listitem">
            <ItemCard
              item={item}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onDetailClick={(i) => router.push(`/items/${i.id}`)}
              animationIndex={index}
            />
          </div>
        ))}
      </div>

    </>
  );
}
