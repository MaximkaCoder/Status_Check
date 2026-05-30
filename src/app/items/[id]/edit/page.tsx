"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ItemForm } from "@/components/forms/ItemForm";
import { Spinner } from "@/components/ui/Spinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useLanguage } from "@/contexts/LanguageContext";
import { getItemById } from "@/lib/api-client";
import type { StatusItem } from "@/lib/types";

export default function EditItemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useLanguage();

  const [item, setItem] = useState<StatusItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function fetchItem() {
      try {
        const data = await getItemById(id);
        if (!cancelled) setItem(data);
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : t("failedLoad");
          setError(msg.includes("404") || msg.toLowerCase().includes("not found")
            ? t("itemNotFound")
            : msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchItem();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">{t("loadingItem")}</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 animate-fade-in">
        <div className="rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-900/20 px-4 py-4 text-sm text-rose-700 dark:text-rose-300 flex items-center gap-2 mb-4">
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
          {error ?? t("itemNotFound")}
        </div>
        <button
          onClick={() => router.push("/")}
          className="text-sm text-indigo-600 hover:underline underline-offset-2 font-semibold cursor-pointer"
          type="button"
        >
          {t("backToDashboard")}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Page header */}
      <div className="mb-8 animate-fade-in-up stagger-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200/60 dark:border-indigo-500/30 flex-shrink-0">
            <svg
              className="h-5 w-5 text-indigo-600 dark:text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            {t("editItemTitle")}
          </h1>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm text-muted-foreground truncate max-w-sm">{item.title}</p>
          <StatusBadge status={item.status} />
        </div>
        <button
          onClick={() => router.push("/")}
          className="mt-2 text-xs text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 font-medium cursor-pointer transition-colors"
          type="button"
        >
          {t("backToDashboard")}
        </button>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card shadow-card p-6 animate-fade-in-up stagger-2">
        <ItemForm
          mode="edit"
          itemId={id}
          defaultValues={{
            title: item.title,
            description: item.description ?? "",
            deadline: item.deadline ? item.deadline.toString() : "",
            creator_name: item.creator_name,
            project:  item.project  ?? "",
            assignee: item.assignee ?? "",
            reviewer: item.reviewer ?? "",
            status: item.status,
          }}
        />
      </div>
    </div>
  );
}
