"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
} from "@/lib/api-client";

const POLL_INTERVAL = 30_000;

function timeAgo(dateStr: string, locale: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (locale === "uk") {
    if (mins < 1) return "щойно";
    if (mins < 60) return `${mins} хв тому`;
    if (hours < 24) return `${hours} год тому`;
    return `${days} дн тому`;
  } else {
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }
}

export function NotificationBell() {
  const { t, locale } = useLanguage();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const fetchNotifs = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // silently ignore — user may not be logged in yet
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleMarkRead(id: string) {
    await markNotificationRead(id).catch(() => {});
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function handleMarkAll() {
    await markAllNotificationsRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  function getNotifMessage(n: Notification): string {
    const label = n.type === "ASSIGNED_ASSIGNEE"
      ? t("notifAssignedAssignee")
      : t("notifAssignedReviewer");
    return `${label}: «${n.itemTitle}»`;
  }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("notifications")}
        className={cn(
          "relative flex h-8 w-8 items-center justify-center rounded-xl",
          "bg-white/40 dark:bg-white/[0.06]",
          "border border-white/70 dark:border-white/[0.10]",
          "text-slate-500 dark:text-white/50",
          "hover:bg-white/60 dark:hover:bg-white/[0.10] hover:text-indigo-500 dark:hover:text-indigo-400",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-none",
          "transition-all duration-150 cursor-pointer outline-none",
          open && "text-indigo-500 dark:text-indigo-400 bg-white/60 dark:bg-white/[0.10]"
        )}
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className={cn(
            "absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full",
            "bg-gradient-to-br from-indigo-500 to-violet-500",
            "text-white text-[9px] font-bold leading-none",
            "shadow-[0_1px_4px_rgba(99,102,241,0.6)]"
          )}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className={cn(
            "absolute right-0 top-10 z-50",
            "w-80 rounded-2xl",
            "bg-white/80 dark:bg-[#0f1029]/90",
            "backdrop-blur-xl",
            "border border-white/60 dark:border-white/[0.10]",
            "shadow-[0_8px_32px_rgba(0,0,0,0.12),0_1px_0_rgba(255,255,255,0.8)]",
            "dark:shadow-[0_8px_32px_rgba(0,0,0,0.5),0_1px_0_rgba(255,255,255,0.04)]",
            "overflow-hidden"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.07]">
            <span className="text-sm font-semibold text-slate-800 dark:text-white/90">
              {t("notifications")}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-[11px] text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer"
              >
                {t("markAllRead")}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400 dark:text-white/30">
                <svg className="h-8 w-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="text-xs">{t("noNotifications")}</span>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => !n.read && handleMarkRead(n.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 flex items-start gap-3",
                    "border-b border-black/[0.04] dark:border-white/[0.05] last:border-0",
                    "transition-colors duration-100",
                    !n.read
                      ? "bg-indigo-50/60 dark:bg-indigo-500/[0.08] hover:bg-indigo-50 dark:hover:bg-indigo-500/[0.12] cursor-pointer"
                      : "opacity-60 cursor-default"
                  )}
                >
                  {/* Dot */}
                  <span className={cn(
                    "mt-1.5 flex-shrink-0 h-1.5 w-1.5 rounded-full",
                    !n.read ? "bg-indigo-500" : "bg-transparent"
                  )} />

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 dark:text-white/80 leading-snug line-clamp-2">
                      {getNotifMessage(n)}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-white/30 mt-0.5">
                      {timeAgo(n.created_at, locale)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
