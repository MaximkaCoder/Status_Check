"use client";

import { useState, useEffect, useRef } from "react";
import { isPast, isToday, isTomorrow, differenceInDays } from "date-fns";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { translations } from "@/lib/i18n";
import type { StatusItem } from "@/lib/types";

type Status = "TO_CHECK" | "EXPIRED" | "DONE" | "NOT_ACTUAL" | "IDEAS_BACKLOG";

interface ItemCardProps {
  item: StatusItem;
  onDelete: (id: string) => Promise<void>;
  onStatusChange?: (id: string, status: Status) => Promise<void>;
  onDetailClick?: (item: StatusItem) => void;
  animationIndex?: number;
}

function formatDateLocale(date: Date, locale: string, monthsEn: readonly string[], monthsUkGen: readonly string[]): string {
  if (locale === "uk") return `${date.getDate()} ${monthsUkGen[date.getMonth()]}, ${date.getFullYear()}`;
  return `${monthsEn[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatDeadlineRelative(date: Date, today: string, tomorrow: string, locale: string, monthsEn: readonly string[], monthsUkGen: readonly string[]): string {
  if (isToday(date)) return today;
  if (isTomorrow(date)) return tomorrow;
  return formatDateLocale(date, locale, monthsEn, monthsUkGen);
}

function getAvatarColor(name: string): string {
  const colors = ["bg-indigo-500","bg-violet-500","bg-pink-500","bg-rose-500","bg-amber-500","bg-emerald-500","bg-cyan-500","bg-sky-500","bg-teal-500","bg-orange-500"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const STATUS_DOT: Record<Status, string> = {
  TO_CHECK:      "bg-indigo-500 shadow-[0_0_6px_2px_rgba(99,102,241,0.45)]",
  EXPIRED:       "bg-rose-500 shadow-[0_0_6px_2px_rgba(239,68,68,0.45)]",
  DONE:          "bg-emerald-500 shadow-[0_0_6px_2px_rgba(16,185,129,0.45)]",
  NOT_ACTUAL:    "bg-slate-400 shadow-[0_0_6px_2px_rgba(148,163,184,0.35)]",
  IDEAS_BACKLOG: "bg-violet-500 shadow-[0_0_6px_2px_rgba(139,92,246,0.45)]",
};

const STATUS_HOVER_GLOW: Record<Status, string> = {
  TO_CHECK:      "hover:border-indigo-300/60 hover:shadow-[0_8px_32px_rgba(99,102,241,0.14)] dark:hover:border-indigo-400/25 dark:hover:shadow-[0_8px_32px_rgba(99,102,241,0.22)]",
  EXPIRED:       "hover:border-rose-300/60 hover:shadow-[0_8px_32px_rgba(239,68,68,0.14)] dark:hover:border-rose-400/25 dark:hover:shadow-[0_8px_32px_rgba(239,68,68,0.22)]",
  DONE:          "hover:border-emerald-300/60 hover:shadow-[0_8px_32px_rgba(16,185,129,0.14)] dark:hover:border-emerald-400/25 dark:hover:shadow-[0_8px_32px_rgba(16,185,129,0.22)]",
  NOT_ACTUAL:    "hover:border-slate-300/60 hover:shadow-[0_8px_32px_rgba(148,163,184,0.14)] dark:hover:border-slate-400/25 dark:hover:shadow-[0_8px_32px_rgba(148,163,184,0.22)]",
  IDEAS_BACKLOG: "hover:border-violet-300/60 hover:shadow-[0_8px_32px_rgba(139,92,246,0.14)] dark:hover:border-violet-400/25 dark:hover:shadow-[0_8px_32px_rgba(139,92,246,0.22)]",
};

const STATUS_NEXT: Record<Status, Status[]> = {
  TO_CHECK:      ["DONE", "NOT_ACTUAL", "IDEAS_BACKLOG", "EXPIRED"],
  EXPIRED:       ["DONE", "TO_CHECK", "NOT_ACTUAL"],
  DONE:          ["TO_CHECK"],
  NOT_ACTUAL:    ["TO_CHECK", "IDEAS_BACKLOG"],
  IDEAS_BACKLOG: ["TO_CHECK", "DONE", "NOT_ACTUAL"],
};

const STATUS_NEXT_DOTS: Record<Status, string> = {
  TO_CHECK:      "bg-indigo-500",
  EXPIRED:       "bg-rose-500",
  DONE:          "bg-emerald-500",
  NOT_ACTUAL:    "bg-slate-400",
  IDEAS_BACKLOG: "bg-violet-500",
};

export function ItemCard({ item, onDelete, onStatusChange, onDetailClick, animationIndex = 0 }: ItemCardProps) {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();

  const canEdit = !!user && (
    (user.isAdmin) ||
    item.creator_name === user.name ||
    item.assignee === user.name ||
    item.reviewer === user.name
  );
  const monthsEn = translations.en.months;
  const monthsUkGen = translations.uk.monthsGenitive;
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!statusMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setStatusMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [statusMenuOpen]);

  const status = item.status as Status;
  const deadline = item.deadline ? new Date(item.deadline) : null;
  const isPastDeadline = deadline ? (isPast(deadline) && status !== "DONE") : false;
  const isNearDeadline = deadline ? (!isPastDeadline && differenceInDays(deadline, new Date()) <= 3 && differenceInDays(deadline, new Date()) >= 0) : false;
  const deadlineLabel = deadline
    ? formatDeadlineRelative(deadline, t("today"), t("tomorrow"), locale, monthsEn, monthsUkGen)
    : t("noDeadline");

  const staggerClass = `stagger-${Math.min(animationIndex + 1, 10)}`;
  const avatarColor = getAvatarColor(item.creator_name);
  const avatarInitial = item.creator_name.charAt(0).toUpperCase();

  const deadlineClass = cn(
    "inline-flex items-center gap-1 font-medium",
    !deadline ? "text-muted-foreground/50" :
    isPastDeadline ? "text-rose-600 dark:text-rose-400" :
    isNearDeadline ? "text-amber-600 dark:text-amber-400" :
    "text-muted-foreground"
  );

  async function doDelete() {
    try {
      await onDelete(item.id);
      toast(t("deleteItem") + " — done", "info");
    } catch {
      toast(t("networkError"), "error");
    }
  }

  async function handleStatusChange(e: React.MouseEvent, newStatus: Status) {
    e.stopPropagation();
    setStatusMenuOpen(false);
    if (!onStatusChange) return;
    setChangingStatus(true);
    try {
      await onStatusChange(item.id, newStatus);
      const labels: Record<Status, string> = { TO_CHECK: t("toCheck"), EXPIRED: t("expired"), DONE: t("done"), NOT_ACTUAL: t("notActual"), IDEAS_BACKLOG: t("ideasBacklog") };
      toast(`Status → ${labels[newStatus]}`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : t("networkError"), "error");
    } finally {
      setChangingStatus(false);
    }
  }

  return (
    <div
      className={cn(
        "group/card relative rounded-2xl overflow-visible",
        "bg-white/80 dark:bg-white/[0.04]",
        "border border-slate-200/80 dark:border-white/[0.08]",
        "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.04)]",
        "dark:shadow-[0_2px_16px_rgba(0,0,0,0.5)]",
        STATUS_HOVER_GLOW[status],
        "hover:-translate-y-0.5 transition-all duration-200",
        onDetailClick ? "cursor-pointer" : "cursor-default",
        "animate-fade-in-up",
        staggerClass,
        statusMenuOpen && "z-10"
      )}
      onClick={() => onDetailClick?.(item)}
      role={onDetailClick ? "button" : undefined}
      tabIndex={onDetailClick ? 0 : undefined}
      onKeyDown={onDetailClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onDetailClick(item); } } : undefined}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 to-transparent dark:from-white/[0.03] dark:to-transparent pointer-events-none" />

      <div className="relative p-4 space-y-2.5">
        {/* Title row */}
        <div className="flex items-start gap-2.5">
          <span className={cn("h-2 w-2 rounded-full flex-shrink-0 mt-[5px]", STATUS_DOT[status])} aria-hidden="true" />

          <h3 className="text-sm font-bold text-foreground leading-snug break-words flex-1 min-w-0">
            {item.title}
          </h3>

          {/* Action buttons — only for users with permission */}
          {canEdit && (
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); router.push(`/items/${item.id}/edit`); }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all duration-150 cursor-pointer"
                type="button"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-rose-50 dark:hover:bg-rose-900/40 hover:text-rose-600 dark:hover:text-rose-300 transition-all duration-150 cursor-pointer"
                type="button"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}

          {/* Status badge + dropdown */}
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); if (canEdit) setStatusMenuOpen((v) => !v); }}
              disabled={changingStatus || !onStatusChange || !canEdit}
              className={cn(
                "transition-opacity duration-150",
                onStatusChange ? "cursor-pointer hover:opacity-75" : "cursor-default",
                "disabled:cursor-not-allowed disabled:opacity-60"
              )}
              aria-label={`Change status (current: ${status})`}
              aria-expanded={statusMenuOpen}
              aria-haspopup="menu"
            >
              {changingStatus ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-muted text-muted-foreground border-border animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-current inline-block animate-spin" />...
                </span>
              ) : (
                <StatusBadge status={status} />
              )}
            </button>

            {statusMenuOpen && onStatusChange && (
              <div
                role="menu"
                className={cn(
                  "absolute right-0 top-full mt-1.5 z-[60] min-w-[170px]",
                  "rounded-xl border border-border/60 bg-card shadow-xl",
                  "dark:border-white/10 dark:shadow-black/40",
                  "animate-scale-in overflow-hidden"
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-2 border-b border-border/60 dark:border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("status")}</p>
                </div>
                {STATUS_NEXT[status].map((nextStatus) => {
                  const labels: Record<Status, string> = { TO_CHECK: t("toCheck"), EXPIRED: t("expired"), DONE: t("done"), NOT_ACTUAL: t("notActual"), IDEAS_BACKLOG: t("ideasBacklog") };
                  return (
                    <button
                      key={nextStatus}
                      role="menuitem"
                      type="button"
                      onClick={(e) => handleStatusChange(e, nextStatus)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted/60 dark:hover:bg-white/5 transition-colors duration-150 cursor-pointer text-left"
                    >
                      <span className={cn("h-2 w-2 rounded-full flex-shrink-0", STATUS_NEXT_DOTS[nextStatus])} />
                      {labels[nextStatus]}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pl-[18px]">{item.description}</p>
        )}

        {/* Project / assignee / reviewer pills */}
        {(item.project || item.assignee || item.reviewer) && (
          <div className="flex flex-wrap gap-1.5 pl-[18px]">
            {item.project && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50/80 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 text-[10px] font-semibold border border-indigo-100 dark:border-indigo-500/20">
                <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                {item.project}
              </span>
            )}
            {item.assignee && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50/80 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300 text-[10px] font-semibold border border-amber-100 dark:border-amber-500/20">
                <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                {item.assignee}
              </span>
            )}
            {item.reviewer && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50/80 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 text-[10px] font-semibold border border-emerald-100 dark:border-emerald-500/20">
                <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {item.reviewer}
              </span>
            )}
          </div>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs pl-[18px]">
          <span className={deadlineClass}>
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{deadlineLabel}</span>
            {isPastDeadline && (
              <span className="font-normal text-rose-500/80 dark:text-rose-400/70">· {t("expired").toLowerCase()}</span>
            )}
          </span>

          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className={cn("inline-flex h-4 w-4 items-center justify-center rounded-full text-white flex-shrink-0 text-[9px] font-bold leading-none", avatarColor)} aria-hidden="true">
              {avatarInitial}
            </span>
            <span>{t("by")} {item.creator_name}</span>
          </span>

          <span className="flex items-center gap-1 text-muted-foreground/50">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatDateLocale(new Date(item.created_at), locale, monthsEn, monthsUkGen)}</span>
          </span>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title={t("confirmDelete")}
          description={`"${item.title}"`}
          confirmLabel={t("deleteItem")}
          cancelLabel={t("cancelBtn")}
          variant="danger"
          onConfirm={() => { setConfirmDelete(false); doDelete(); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
