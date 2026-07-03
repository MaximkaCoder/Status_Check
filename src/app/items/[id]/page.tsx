"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { isPast, isToday, isTomorrow } from "date-fns";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ActivityTimeline } from "@/components/items/ActivityTimeline";
import { Spinner } from "@/components/ui/Spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { getItemById } from "@/lib/api-client";
import { translations } from "@/lib/i18n";
import { canChangeStatus, canModifyItem } from "@/lib/permissions";
import type { StatusItem } from "@/lib/types";

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  created_at: string;
}

const AVATAR_COLORS = [
  "from-indigo-400 to-violet-500",
  "from-rose-400 to-pink-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-cyan-400 to-sky-500",
  "from-violet-400 to-purple-500",
];

function getGradient(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// Render comment text with @mentions highlighted as chips. Longest name first
// so "@Max Smal" wins over "@Max"; only known user names become chips.
function renderCommentText(text: string, userNames: string[]): React.ReactNode {
  if (!text.includes("@") || userNames.length === 0) return text;
  const sorted = [...userNames].filter(Boolean).sort((a, b) => b.length - a.length);
  const parts: React.ReactNode[] = [];
  let rest = text;
  let key = 0;
  outer: while (rest.length > 0) {
    const at = rest.indexOf("@");
    if (at === -1) { parts.push(rest); break; }
    if (at > 0) { parts.push(rest.slice(0, at)); rest = rest.slice(at); }
    for (const name of sorted) {
      if (rest.slice(1).startsWith(name)) {
        parts.push(
          <span key={key++} className="inline-flex items-center rounded-md px-1 font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15">
            @{name}
          </span>
        );
        rest = rest.slice(1 + name.length);
        continue outer;
      }
    }
    // No known name after this @ — emit the "@" literally and move on
    parts.push("@");
    rest = rest.slice(1);
  }
  return parts;
}

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

function formatCommentTime(date: Date, locale: string): string {
  const monthsEn = translations.en.months;
  const monthsUkGen = translations.uk.monthsGenitive;
  const h = date.getHours().toString().padStart(2, "0");
  const m = date.getMinutes().toString().padStart(2, "0");
  if (locale === "uk") return `${date.getDate()} ${monthsUkGen[date.getMonth()]} · ${h}:${m}`;
  return `${monthsEn[date.getMonth()]} ${date.getDate()} · ${h}:${m}`;
}

function formatDeadline(date: Date, locale: string, today: string, tomorrow: string): string {
  if (isToday(date)) return today;
  if (isTomorrow(date)) return tomorrow;
  return formatDate(date, locale);
}

function formatDuration(ms: number, locale: string): string {
  const uk = locale === "uk";
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days} ${uk ? "дн." : "d"}`);
  if (hours) parts.push(`${hours} ${uk ? "год" : "h"}`);
  if (!days && mins) parts.push(`${mins} ${uk ? "хв" : "m"}`);
  if (parts.length === 0) parts.push(uk ? "менше хвилини" : "<1m");
  return parts.join(" ");
}

type Priority = "LOW" | "MEDIUM" | "HIGH";

const PRIORITY_DETAIL_CFG: Record<Priority, { dot: string; badge: string; label: (uk: boolean) => string }> = {
  LOW:    { dot: "bg-blue-400",  badge: "bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-500/30 dark:text-blue-300",   label: (uk) => uk ? "Низький"  : "Low"    },
  MEDIUM: { dot: "bg-amber-400", badge: "bg-amber-50 border border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-500/30 dark:text-amber-300", label: (uk) => uk ? "Середній" : "Medium" },
  HIGH:   { dot: "bg-rose-500",  badge: "bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-900/30 dark:border-rose-500/30 dark:text-rose-300",   label: (uk) => uk ? "Високий"  : "High"   },
};

function Avatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const bg = getAvatarColor(name);
  const sz = size === "md" ? "h-8 w-8 text-sm" : "h-6 w-6 text-[11px]";
  return (
    <span className={cn("inline-flex items-center justify-center rounded-full text-white flex-shrink-0 font-bold", sz, bg)}>
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

// ── Subtasks panel ──────────────────────────────────────────────────────────
interface Subtask { id: string; title: string; done: boolean; order: number; }

function SubtasksPanel({ itemId }: { itemId: string }) {
  const { locale } = useLanguage();
  const uk = locale === "uk";
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch(`/api/items/${itemId}/subtasks`)
      .then(r => r.ok ? r.json() : [])
      .then((d: Subtask[]) => setSubtasks(d))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [itemId]);

  async function add() {
    const title = newTitle.trim();
    if (!title || adding) return;
    setAdding(true);
    try {
      const r = await fetch(`/api/items/${itemId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (r.ok) {
        const s = await r.json();
        setSubtasks(prev => [...prev, s]);
        setNewTitle("");
      }
    } finally {
      setAdding(false);
    }
  }

  async function toggle(s: Subtask) {
    setSubtasks(prev => prev.map(x => x.id === s.id ? { ...x, done: !x.done } : x));
    const r = await fetch(`/api/items/${itemId}/subtasks/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !s.done }),
    });
    if (!r.ok) setSubtasks(prev => prev.map(x => x.id === s.id ? { ...x, done: s.done } : x));
  }

  async function remove(s: Subtask) {
    const snapshot = subtasks;
    setSubtasks(prev => prev.filter(x => x.id !== s.id));
    const r = await fetch(`/api/items/${itemId}/subtasks/${s.id}`, { method: "DELETE" });
    if (!r.ok) setSubtasks(snapshot);
  }

  if (!loaded) return null;
  const doneCount = subtasks.filter(s => s.done).length;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {uk ? "Підзадачі" : "Subtasks"}
        </p>
        {subtasks.length > 0 && (
          <span className="text-[10px] font-bold text-indigo-500">{doneCount}/{subtasks.length}</span>
        )}
      </div>

      {subtasks.length > 0 && (
        <div className="h-1.5 rounded-full bg-muted/60 dark:bg-white/[0.06] mb-3 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 ease-out"
            style={{ width: `${subtasks.length ? (doneCount / subtasks.length) * 100 : 0}%` }}
          />
        </div>
      )}

      <div className="space-y-1.5">
        {subtasks.map(s => (
          <div key={s.id} className="flex items-center gap-2.5 group/subtask rounded-lg px-2 py-1.5 -mx-2 hover:bg-muted/30 transition-colors">
            <button
              type="button"
              onClick={() => toggle(s)}
              className={cn(
                "flex h-4.5 w-4.5 h-[18px] w-[18px] items-center justify-center rounded-md border-2 flex-shrink-0 cursor-pointer transition-all duration-150",
                s.done
                  ? "bg-indigo-500 border-indigo-500 text-white"
                  : "border-border hover:border-indigo-400"
              )}
              aria-label={s.done ? "Undone" : "Done"}
            >
              {s.done && (
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span className={cn(
              "flex-1 text-sm leading-snug transition-all duration-150",
              s.done ? "text-muted-foreground line-through" : "text-foreground"
            )}>
              {s.title}
            </span>
            <button
              type="button"
              onClick={() => remove(s)}
              className="flex-shrink-0 opacity-0 group-hover/subtask:opacity-100 text-muted-foreground hover:text-rose-500 cursor-pointer transition-all duration-150"
              aria-label="Delete subtask"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-2">
        <input
          type="text"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={uk ? "Додати підзадачу..." : "Add a subtask..."}
          maxLength={300}
          className={cn(
            "flex-1 rounded-lg border border-border/60 bg-muted/30 dark:bg-white/[0.04]",
            "px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400",
            "transition-all duration-150"
          )}
        />
        <button
          type="button"
          onClick={add}
          disabled={adding || !newTitle.trim()}
          className={cn(
            "flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold",
            "bg-indigo-500 hover:bg-indigo-600 text-white",
            "disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all duration-150"
          )}
        >
          {uk ? "Додати" : "Add"}
        </button>
      </div>
    </div>
  );
}

// ── Comments panel ──────────────────────────────────────────────────────────
function CommentsPanel({ itemId }: { itemId: string }) {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // @mention autocomplete
  const [userNames, setUserNames] = useState<string[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null); // text after "@", null = closed
  const [mentionIdx, setMentionIdx] = useState(0);

  useEffect(() => {
    fetch("/api/users").then(r => r.ok ? r.json() : []).then((d: { name: string }[]) => setUserNames(d.map(u => u.name))).catch(() => {});
  }, []);

  const mentionMatches = mentionQuery === null
    ? []
    : userNames.filter(n => n.toLowerCase().startsWith(mentionQuery.toLowerCase()) && n !== user?.name).slice(0, 5);

  function updateMentionState(value: string, caret: number) {
    const beforeCaret = value.slice(0, caret);
    const at = beforeCaret.lastIndexOf("@");
    if (at === -1 || (at > 0 && !/[\s]/.test(beforeCaret[at - 1]))) { setMentionQuery(null); return; }
    const q = beforeCaret.slice(at + 1);
    if (q.length > 30 || q.includes("\n")) { setMentionQuery(null); return; }
    setMentionQuery(q);
    setMentionIdx(0);
  }

  function pickMention(name: string) {
    const el = textareaRef.current;
    const caret = el ? el.selectionStart : text.length;
    const beforeCaret = text.slice(0, caret);
    const at = beforeCaret.lastIndexOf("@");
    const next = text.slice(0, at) + "@" + name + " " + text.slice(caret);
    setText(next);
    setMentionQuery(null);
    requestAnimationFrame(() => {
      if (el) { el.focus(); const pos = at + name.length + 2; el.setSelectionRange(pos, pos); }
    });
  }

  const commentsRef = useRef<Comment[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/items/${itemId}/comments`)
      .then(r => r.ok ? r.json() : [])
      .then((d: Comment[]) => {
        if (cancelled) return;
        commentsRef.current = d;
        setComments(d);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    // Mark as seen
    fetch(`/api/items/${itemId}/seen`, { method: "POST" }).catch(() => {});

    return () => { cancelled = true; };
  }, [itemId]);

  // Poll for new comments every 5s
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const r = await fetch(`/api/items/${itemId}/comments`);
        if (!r.ok) return;
        const fresh: Comment[] = await r.json();
        const prev = commentsRef.current;
        if (fresh.length > prev.length) {
          commentsRef.current = fresh;
          setComments(fresh);
          // Mark new ones as seen
          fetch(`/api/items/${itemId}/seen`, { method: "POST" }).catch(() => {});
        }
      } catch { /* ignore */ }
    }, 5000);
    return () => clearInterval(timer);
  }, [itemId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  async function send() {
    if (!text.trim() || sending) return;
    if (text.length > 2000) { setSendErr(t("commentTooLong")); return; }
    setSending(true); setSendErr(null);
    const r = await fetch(`/api/items/${itemId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim() }),
    });
    if (r.ok) {
      const c = await r.json();
      setComments(prev => [...prev, c]);
      setText("");
    } else {
      setSendErr(t("networkError"));
    }
    setSending(false);
  }

  async function remove(commentId: string) {
    setDeletingId(commentId);
    const r = await fetch(`/api/items/${itemId}/comments/${commentId}`, { method: "DELETE" });
    if (r.ok) setComments(prev => prev.filter(c => c.id !== commentId));
    setDeletingId(null);
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-card overflow-hidden flex flex-col h-full min-h-[400px] lg:min-h-0 lg:max-h-[calc(100vh-180px)] lg:sticky lg:top-20">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-border/60 flex items-center gap-2 flex-shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
          <svg className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h2 className="text-sm font-bold text-foreground">{t("commentsTitle")}</h2>
        {comments.length > 0 && (
          <span className="ml-auto inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold">
            {comments.length}
          </span>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-5 w-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">{t("noComments")}</p>
        ) : (
          comments.map(c => {
            const isOwn = user?.userId === c.authorId || user?.isAdmin;
            const grad = getGradient(c.authorName);
            return (
              <div key={c.id} className={cn("flex gap-2.5 group/comment", deletingId === c.id && "opacity-50")}>
                <span className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-full text-white flex-shrink-0 text-xs font-bold bg-gradient-to-br",
                  c.authorId === user?.userId ? "from-indigo-400 to-violet-500" : grad
                )}>
                  {c.authorName.charAt(0).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5 min-w-0">
                    <span className="text-xs font-bold text-foreground truncate min-w-0">{c.authorName}</span>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatCommentTime(new Date(c.created_at), locale)}</span>
                    {isOwn && (
                      <button
                        type="button"
                        onClick={() => remove(c.id)}
                        disabled={deletingId === c.id}
                        className="ml-auto flex-shrink-0 opacity-0 group-hover/comment:opacity-100 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-rose-500 cursor-pointer transition-all duration-150 disabled:cursor-not-allowed"
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        {t("deleteComment")}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">{renderCommentText(c.text, userNames)}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/60 px-4 py-3 flex-shrink-0">
        {sendErr && (
          <p className="text-[10px] text-rose-500 mb-2">{sendErr}</p>
        )}
        <div className="flex gap-2 items-center">
          {user && (
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white flex-shrink-0 text-xs font-bold bg-gradient-to-br from-indigo-400 to-violet-500">
              {user.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="flex-1 relative">
            {mentionQuery !== null && mentionMatches.length > 0 && (
              <div className={cn(
                "absolute bottom-full left-0 mb-1.5 z-50 min-w-[180px]",
                "rounded-xl border border-border/60 bg-white dark:bg-[#0f1029]",
                "shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)]",
                "py-1.5 overflow-hidden"
              )}>
                {mentionMatches.map((n, i) => (
                  <button
                    key={n}
                    type="button"
                    onMouseDown={e => { e.preventDefault(); pickMention(n); }}
                    onMouseEnter={() => setMentionIdx(i)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center gap-2 cursor-pointer",
                      i === mentionIdx
                        ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
                        : "text-foreground hover:bg-muted/40"
                    )}
                  >
                    <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded-full text-white text-[9px] font-bold bg-gradient-to-br flex-shrink-0", getGradient(n))}>
                      {n.charAt(0).toUpperCase()}
                    </span>
                    {n}
                  </button>
                ))}
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => { setText(e.target.value); updateMentionState(e.target.value, e.target.selectionStart); }}
              onKeyDown={e => {
                if (mentionQuery !== null && mentionMatches.length > 0) {
                  if (e.key === "ArrowDown") { e.preventDefault(); setMentionIdx(i => Math.min(i + 1, mentionMatches.length - 1)); return; }
                  if (e.key === "ArrowUp")   { e.preventDefault(); setMentionIdx(i => Math.max(i - 1, 0)); return; }
                  if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); pickMention(mentionMatches[mentionIdx]); return; }
                  if (e.key === "Escape") { setMentionQuery(null); return; }
                }
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              onBlur={() => setTimeout(() => setMentionQuery(null), 150)}
              placeholder={t("commentPlaceholder")}
              rows={1}
              maxLength={2000}
              className={cn(
                "w-full rounded-xl border border-border/60 bg-muted/30 dark:bg-white/[0.04]",
                "px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground",
                "resize-none overflow-hidden",
                "focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400",
                "transition-all duration-150 leading-relaxed"
              )}
              style={{ minHeight: 36 }}
              onInput={e => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 120) + "px";
              }}
            />
          </div>
          <button
            type="button"
            onClick={send}
            disabled={sending || !text.trim()}
            className={cn(
              "flex-shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-xl",
              "bg-gradient-to-br from-indigo-500 to-violet-500 text-white",
              "disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer",
              "hover:from-indigo-600 hover:to-violet-600 transition-all duration-150",
              "shadow-[0_2px_8px_rgba(99,102,241,0.4)]"
            )}
            aria-label={t("sendComment")}
          >
            {sending ? (
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" />
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/50 mt-1.5 text-right">{text.length}/2000 · Enter {locale === "uk" ? "для надсилання" : "to send"}</p>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
const INLINE_STATUSES = ["TO_CHECK", "EXPIRED", "DONE", "NOT_ACTUAL", "IDEAS_BACKLOG"] as const;

// Dropdown rendered into document.body so no sibling stacking context
// (animated cards, timeline) can paint above it. Anchored to trigger rect.
function AnchoredDropdown({
  anchorRef, onClose, children, width,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}) {
  const dropRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    setRect(anchorRef.current?.getBoundingClientRect() ?? null);
  }, [anchorRef]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (dropRef.current?.contains(t)) return;
      if (anchorRef.current?.contains(t)) return; // trigger toggles itself
      onClose();
    }
    function onScrollOrResize() { onClose(); }
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [anchorRef, onClose]);

  if (!rect || typeof window === "undefined") return null;
  return createPortal(
    <div
      ref={dropRef}
      className="fixed z-[9999] rounded-xl border border-border/60 bg-white dark:bg-[#0f1029] shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] overflow-hidden"
      style={{
        top: rect.bottom + 6,
        left: Math.min(rect.left, window.innerWidth - (width ?? 176) - 8),
        width,
      }}
    >
      {children}
    </div>,
    document.body
  );
}

// Click the status badge to change it inline (creator/assignee/reviewer/admin).
function InlineStatusEditor({
  status, editable, onChange,
}: { status: StatusItem["status"]; editable: boolean; onChange: (s: StatusItem["status"]) => void }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const labels: Record<string, string> = {
    TO_CHECK: t("toCheck"), EXPIRED: t("expired"), DONE: t("done"),
    NOT_ACTUAL: t("notActual"), IDEAS_BACKLOG: t("ideasBacklog"),
  };

  if (!editable) return <StatusBadge status={status} />;

  return (
    <>
      <button ref={btnRef} type="button" onClick={() => setOpen(v => !v)} className="cursor-pointer inline-flex items-center gap-1" aria-label="Change status">
        <StatusBadge status={status} />
        <svg className={cn("h-3 w-3 text-muted-foreground transition-transform", open && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <AnchoredDropdown anchorRef={btnRef} onClose={() => setOpen(false)} width={176}>
          <div className="py-1.5">
            {INLINE_STATUSES.map((s) => (
              <button key={s} type="button"
                onClick={() => { setOpen(false); if (s !== status) onChange(s); }}
                className={cn("w-full text-left px-3 py-2 text-xs font-semibold transition-colors", s === status ? "bg-muted/50" : "hover:bg-muted/40")}
              >
                {labels[s]}
              </button>
            ))}
          </div>
        </AnchoredDropdown>
      )}
    </>
  );
}

// Click the priority badge to change it inline (creator/admin).
function InlinePriorityEditor({
  priority, editable, uk, onChange,
}: { priority: Priority; editable: boolean; uk: boolean; onChange: (p: Priority) => void }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const cfg = PRIORITY_DETAIL_CFG[priority];

  const badge = (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold", cfg.badge)}>
      <span className={cn("h-2 w-2 rounded-full flex-shrink-0", cfg.dot)} />
      {cfg.label(uk)}
    </span>
  );

  if (!editable) return badge;

  return (
    <>
      <button ref={btnRef} type="button" onClick={() => setOpen(v => !v)} className="cursor-pointer inline-flex items-center gap-1" aria-label="Change priority">
        {badge}
        <svg className={cn("h-3 w-3 text-muted-foreground transition-transform", open && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <AnchoredDropdown anchorRef={btnRef} onClose={() => setOpen(false)} width={160}>
          <div className="py-1.5">
            {(["LOW", "MEDIUM", "HIGH"] as Priority[]).map((p) => (
              <button key={p} type="button"
                onClick={() => { setOpen(false); if (p !== priority) onChange(p); }}
                className={cn("w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-2 transition-colors", p === priority ? "bg-muted/50" : "hover:bg-muted/40")}
              >
                <span className={cn("h-2 w-2 rounded-full flex-shrink-0", PRIORITY_DETAIL_CFG[p].dot)} />
                {PRIORITY_DETAIL_CFG[p].label(uk)}
              </button>
            ))}
          </div>
        </AnchoredDropdown>
      )}
    </>
  );
}

// Click assignee/reviewer to reassign inline (creator/admin only).
function InlineUserField({
  value, users, editable, placeholder, onChange,
}: { value: string | null; users: string[]; editable: boolean; placeholder: string; onChange: (name: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const btnRef = useRef<HTMLButtonElement>(null);

  const matches = users.filter(u => u.toLowerCase().includes(q.toLowerCase()));

  if (!editable) {
    return value
      ? <div className="flex items-center gap-2"><Avatar name={value} /><span className="text-sm font-medium text-foreground">{value}</span></div>
      : <span className="text-sm text-muted-foreground">—</span>;
  }

  return (
    <>
      <button ref={btnRef} type="button" onClick={() => { setOpen(v => !v); setQ(""); }}
        className="flex items-center gap-2 rounded-lg -mx-1.5 px-1.5 py-1 hover:bg-muted/40 transition-colors cursor-pointer group/uf">
        {value ? <><Avatar name={value} /><span className="text-sm font-medium text-foreground">{value}</span></>
               : <span className="text-sm text-muted-foreground italic">{placeholder}</span>}
        <svg className="h-3 w-3 text-muted-foreground opacity-0 group-hover/uf:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      {open && (
        <AnchoredDropdown anchorRef={btnRef} onClose={() => setOpen(false)} width={224}>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="..."
            className="w-full px-3 py-2 text-xs bg-muted/30 dark:bg-white/[0.04] border-b border-border/60 focus:outline-none text-foreground" />
          <div className="max-h-52 overflow-y-auto py-1">
            {value && (
              <button type="button" onClick={() => { setOpen(false); onChange(null); }}
                className="w-full text-left px-3 py-2 text-xs text-rose-500 hover:bg-muted/40 transition-colors">
                ✕ {value}
              </button>
            )}
            {matches.map(u => (
              <button key={u} type="button" onClick={() => { setOpen(false); if (u !== value) onChange(u); }}
                className={cn("w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-2 transition-colors", u === value ? "bg-muted/50" : "hover:bg-muted/40")}>
                <Avatar name={u} />{u}
              </button>
            ))}
            {matches.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground">—</p>}
          </div>
        </AnchoredDropdown>
      )}
    </>
  );
}

export default function ViewItemPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { user } = useAuth();

  const [item, setItem] = useState<StatusItem | null>(null);
  const [files, setFiles] = useState<{ id: string; name: string; url: string; size: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userNames, setUserNames] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/users").then(r => r.ok ? r.json() : []).then((d: { name: string }[]) => setUserNames(d.map(u => u.name))).catch(() => {});
  }, []);

  async function patchStatus(status: StatusItem["status"]) {
    const prev = item;
    setItem((cur) => cur ? { ...cur, status } : cur);
    const r = await fetch(`/api/items/${id}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    if (r.ok) setItem(await r.json());
    else setItem(prev);
  }

  async function patchField(field: "assignee" | "reviewer" | "priority", value: string | null) {
    const prev = item;
    setItem((cur) => cur ? { ...cur, [field]: value } : cur);
    const r = await fetch(`/api/items/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: value }),
    });
    if (r.ok) setItem(await r.json());
    else setItem(prev);
  }

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getItemById(id)
      .then(async (data) => {
        if (cancelled) return;
        setItem(data);
        const fr = await fetch(`/api/items/${id}/files`).catch(() => null);
        if (!cancelled && fr?.ok) setFiles(await fr.json());
      })
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

  const sess = user ? { userId: user.userId, name: user.name, isAdmin: user.isAdmin } : null;
  const canEdit = !!(sess && canModifyItem(sess, item));
  const canStatus = !!(sess && canChangeStatus(sess, item));

  return (
    <div className="py-8 px-4 2xl:flex 2xl:gap-6 2xl:items-start 2xl:justify-center">
      {/* Left spacer — mirrors comments width so card stays centered */}
      <div className="hidden 2xl:block 2xl:w-[315px] 2xl:flex-shrink-0" />

      {/* Main column */}
      <div className="max-w-2xl w-full mx-auto 2xl:mx-0">
      {/* Page header */}
      <div className="mb-6 animate-fade-in-up stagger-1">
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
              <div className="mt-1.5"><InlineStatusEditor status={item.status} editable={canStatus} onChange={patchStatus} /></div>
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

      {/* Task card */}
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

            {item.priority && (
              <Field label={locale === "uk" ? "Пріоритет" : "Priority"}>
                <InlinePriorityEditor
                  priority={item.priority as Priority}
                  editable={canEdit}
                  uk={locale === "uk"}
                  onChange={(p) => patchField("priority", p)}
                />
              </Field>
            )}

            <Field label={locale === "uk" ? "Автор" : "Created by"}>
              <div className="flex items-center gap-2">
                <Avatar name={item.creator_name} />
                <span className="text-sm font-medium text-foreground">{item.creator_name}</span>
              </div>
            </Field>

            {item.project && (
              <Field label={t("project")}>
                <span className="text-sm font-medium text-foreground">{item.project}</span>
              </Field>
            )}

            {(item.assignee || canEdit) && (
              <Field label={t("assignee")}>
                <InlineUserField
                  value={item.assignee}
                  users={userNames}
                  editable={canEdit}
                  placeholder={locale === "uk" ? "Призначити..." : "Assign..."}
                  onChange={(name) => patchField("assignee", name)}
                />
              </Field>
            )}

            {(item.reviewer || canEdit) && (
              <Field label={t("reviewer")}>
                <InlineUserField
                  value={item.reviewer}
                  users={userNames}
                  editable={canEdit}
                  placeholder={locale === "uk" ? "Призначити..." : "Assign..."}
                  onChange={(name) => patchField("reviewer", name)}
                />
              </Field>
            )}

            {item.status === "DONE" && item.done_by && item.done_at && (
              <div className="sm:col-span-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-500/30 p-4">
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1.5">
                  {locale === "uk" ? "Виконано" : "Completed"}
                </p>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <Avatar name={item.done_by} />
                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{item.done_by}</span>
                  <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70 ml-1">
                    · {formatDate(new Date(item.done_at), locale)}
                  </span>
                </div>

                {/* Was overdue — show how late it was completed */}
                {deadline && new Date(item.done_at) > deadline && (
                  <div className="mt-2.5 pt-2.5 border-t border-emerald-200/50 dark:border-emerald-500/20 flex items-start gap-1.5 text-xs text-rose-600 dark:text-rose-400">
                    <svg className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
                    </svg>
                    <span>
                      <span className="font-semibold">{locale === "uk" ? "Було прострочено" : "Was overdue"}</span>
                      {" — "}
                      {locale === "uk" ? "виконано із запізненням на " : "completed "}
                      <span className="font-semibold">{formatDuration(new Date(item.done_at).getTime() - deadline.getTime(), locale)}</span>
                      {locale === "uk" ? "" : " late"}
                      <span className="text-rose-500/70 dark:text-rose-400/70"> ({locale === "uk" ? "дедлайн був" : "deadline was"} {formatDate(deadline, locale)})</span>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Subtasks */}
          <SubtasksPanel itemId={id} />

          {/* Files */}
          {files.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                {locale === "uk" ? "Файли" : "Files"}
              </p>
              <div className="space-y-2">
                {files.map(f => {
                  const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
                  const icon = ["jpg","jpeg","png","gif","webp","svg"].includes(ext) ? "🖼"
                    : ext === "pdf" ? "📄"
                    : ["doc","docx"].includes(ext) ? "📝"
                    : ["xls","xlsx","csv"].includes(ext) ? "📊"
                    : ["zip","rar","7z"].includes(ext) ? "📦" : "📎";
                  const size = f.size < 1024 ? `${f.size} B`
                    : f.size < 1024*1024 ? `${(f.size/1024).toFixed(1)} KB`
                    : `${(f.size/1024/1024).toFixed(1)} MB`;
                  return (
                    <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/60 bg-muted/20">
                      <span className="text-lg flex-shrink-0 leading-none">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <a href={f.url} target="_blank" rel="noreferrer"
                          className="text-xs font-semibold text-foreground hover:text-indigo-600 dark:hover:text-indigo-400 truncate block transition-colors">
                          {f.name}
                        </a>
                        <p className="text-[10px] text-muted-foreground">{size}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
      </div>

      {/* Activity timeline */}
      <div className="mt-6 animate-fade-in-up stagger-3">
        <ActivityTimeline itemId={id} />
      </div>
      </div>{/* end main column */}

      {/* Comments — below card on mobile, sticky right column on 2xl+ */}
      <div className={cn(
        "mt-6 animate-fade-in-up stagger-3 max-w-2xl mx-auto w-full",
        "2xl:mx-0 2xl:mt-0 2xl:w-[315px] 2xl:max-w-none 2xl:flex-shrink-0 2xl:sticky 2xl:top-[72px] 2xl:pt-[118px]"
      )}>
        <CommentsPanel itemId={id} />
      </div>
    </div>
  );
}
