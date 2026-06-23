"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { isPast, isToday, isTomorrow } from "date-fns";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Spinner } from "@/components/ui/Spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { getItemById } from "@/lib/api-client";
import { translations } from "@/lib/i18n";
import type { StatusItem } from "@/lib/types";

function getAvatarColor(name: string): string {
  const colors = ["bg-indigo-500","bg-violet-500","bg-pink-500","bg-rose-500","bg-amber-500","bg-emerald-500","bg-cyan-500","bg-sky-500","bg-teal-500","bg-orange-500"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function formatDate(date: Date, locale: string): string {
  const monthsEn = translations.en.months;
  const monthsUkGen = translations.uk.monthsGenitive;
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  if (locale === "uk") return `${date.getDate()} ${monthsUkGen[date.getMonth()]}, ${date.getFullYear()} · ${h}:${m}`;
  return `${monthsEn[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} · ${h}:${m}`;
}

function formatDeadline(date: Date, locale: string, today: string, tomorrow: string): string {
  if (isToday(date)) return today;
  if (isTomorrow(date)) return tomorrow;
  return formatDate(date, locale);
}

function Avatar({ name, color }: { name: string; color?: string }) {
  const bg = color ?? getAvatarColor(name);
  return (
    <span className={cn("inline-flex h-6 w-6 items-center justify-center rounded-full text-white flex-shrink-0 text-[11px] font-bold", bg)}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/50 p-4">
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</p>
      {children}
    </div>
  );
}

export default function ViewItemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { user } = useAuth();

  const [item, setItem] = useState<StatusItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getItemById(id)
      .then((data) => { if (!cancelled) setItem(data); })
      .catch((err) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : t("failedLoad");
          setError(
            msg.includes("403") || msg.toLowerCase().includes("доступу")
              ? "У вас немає доступу до цього завдання"
              : msg.includes("404") || msg.toLowerCase().includes("not found")
              ? t("itemNotFound")
              : msg
          );
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
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
          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {error ?? t("itemNotFound")}
        </div>
        <button onClick={() => router.push("/")} className="text-sm text-indigo-600 hover:underline underline-offset-2 font-semibold cursor-pointer" type="button">
          {t("backToDashboard")}
        </button>
      </div>
    );
  }

  const deadline = item.deadline ? new Date(item.deadline) : null;
  const isPastDeadline = deadline ? (isPast(deadline) && item.status !== "DONE") : false;
  const avatarColor = getAvatarColor(item.creator_name);

  const canEdit = user && (
    user.isAdmin ||
    item.creator_name === user.name ||
    item.assignee === user.name ||
    item.reviewer === user.name
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Page header */}
      <div className="mb-8 animate-fade-in-up stagger-1">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200/60 dark:border-indigo-500/30 flex-shrink-0">
              <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground leading-tight break-words">
                {item.title}
              </h1>
              <div className="mt-1.5"><StatusBadge status={item.status} /></div>
            </div>
          </div>

          {canEdit && (
            <Link
              href={`/items/${id}/edit`}
              className={cn(
                "flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold",
                "bg-white/40 dark:bg-white/[0.06]",
                "border border-white/70 dark:border-white/[0.10]",
                "text-slate-700 dark:text-white/80",
                "hover:bg-white/60 dark:hover:bg-white/[0.10]",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-none",
                "transition-all duration-150"
              )}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t("editItem")}
            </Link>
          )}
        </div>

        <button
          onClick={() => router.push("/")}
          className="mt-3 text-xs text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 font-medium cursor-pointer transition-colors"
          type="button"
        >
          {t("backToDashboard")}
        </button>
      </div>

      {/* Body */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-card p-6 animate-fade-in-up stagger-2 space-y-4">

        {/* Description */}
        {item.description ? (
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("description")}</p>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{item.description}</p>
          </div>
        ) : null}

        {/* Grid fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          <Field label={t("createdAt")}>
            <span className="text-sm font-medium text-foreground">
              {formatDate(new Date(item.created_at), locale)}
            </span>
          </Field>

          <Field label={t("deadline")}>
            <span className={cn("text-sm font-medium", isPastDeadline ? "text-rose-600" : "text-foreground")}>
              {deadline
                ? formatDeadline(deadline, locale, t("today"), t("tomorrow"))
                : t("noDeadline")}
              {isPastDeadline && (
                <span className="block text-[10px] font-normal text-rose-500/80 mt-0.5">{t("expired")}</span>
              )}
            </span>
          </Field>

          <Field label={locale === "uk" ? "Автор" : "Created by"}>
            <div className="flex items-center gap-2">
              <Avatar name={item.creator_name} color={avatarColor} />
              <span className="text-sm font-medium text-foreground">{item.creator_name}</span>
            </div>
          </Field>

          {item.project && (
            <Field label={t("project")}>
              <span className="text-sm font-medium text-foreground">{item.project}</span>
            </Field>
          )}

          {item.assignee && (
            <Field label={t("assignee")}>
              <div className="flex items-center gap-2">
                <Avatar name={item.assignee} />
                <span className="text-sm font-medium text-foreground">{item.assignee}</span>
              </div>
            </Field>
          )}

          {item.reviewer && (
            <Field label={t("reviewer")}>
              <div className="flex items-center gap-2">
                <Avatar name={item.reviewer} />
                <span className="text-sm font-medium text-foreground">{item.reviewer}</span>
              </div>
            </Field>
          )}
        </div>
      </div>
    </div>
  );
}
