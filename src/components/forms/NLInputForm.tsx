"use client";

import { useRef, useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";
import { useLanguage } from "@/contexts/LanguageContext";
import { parseText } from "@/lib/api-client";

interface ParsedPreview {
  title: string;
  deadline?: string;
}

interface NLInputFormProps {
  onUseParsed: (values: { title: string; deadline?: string }) => void;
}

export function NLInputForm({ onUseParsed }: NLInputFormProps) {
  const { t } = useLanguage();
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState<ParsedPreview | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleParse() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setParsing(true);
    setParseError(null);
    setPreview(null);

    try {
      const result = await parseText(trimmed);
      setPreview({ title: result.title, deadline: result.deadline });
    } catch (err) {
      setParseError(err instanceof Error ? err.message : t("parseError"));
    } finally {
      setParsing(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      if (text.trim() && !parsing) {
        e.preventDefault();
        handleParse();
      }
    }
  }

  function handleUse() {
    if (!preview) return;
    onUseParsed({ title: preview.title, deadline: preview.deadline });
    setText("");
    setPreview(null);
    setParseError(null);
  }

  function formatDeadlineDisplay(iso: string): string {
    try {
      return format(new Date(iso), "MMMM d, yyyy 'at' h:mm a");
    } catch {
      return iso;
    }
  }

  const canParse = text.trim().length > 0 && !parsing;

  return (
    <div className="space-y-4">
      <label
        htmlFor="nl-input"
        className="block text-sm font-semibold text-foreground mb-1.5"
      >
        {t("smartInput")}
      </label>

      <div className="relative">
        <textarea
          id="nl-input"
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("smartPlaceholder")}
          rows={4}
          maxLength={1000}
          disabled={parsing}
          className={cn(
            "w-full rounded-xl border bg-background px-3.5 py-3 text-sm text-foreground",
            "placeholder:text-muted-foreground resize-none leading-relaxed",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400",
            "transition-all duration-150",
            parsing ? "opacity-60 cursor-not-allowed border-input" : "border-input"
          )}
          aria-describedby="nl-hint"
        />
        {text.length > 800 && (
          <span
            className={cn(
              "absolute bottom-2.5 right-3 text-[10px] font-medium tabular-nums",
              text.length > 950 ? "text-rose-500" : "text-muted-foreground"
            )}
          >
            {text.length}/1000
          </span>
        )}
      </div>

      <p id="nl-hint" className="text-xs text-muted-foreground flex items-center gap-1.5 -mt-2">
        <svg className="h-3 w-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {t("nlHint")}
      </p>

      <button
        type="button"
        onClick={handleParse}
        disabled={!canParse}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold",
          "bg-indigo-600 text-white hover:bg-indigo-700",
          "shadow-sm hover:shadow-md hover:-translate-y-0.5",
          "transition-all duration-200 cursor-pointer",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
        )}
        aria-label={parsing ? t("parsing") : t("parseBtn")}
      >
        {parsing ? (
          <>
            <Spinner size="sm" className="border-white/40 border-t-white" />
            <span>{t("parsing")}</span>
          </>
        ) : (
          <>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>{t("parseBtn")}</span>
          </>
        )}
      </button>

      {parseError && (
        <div
          className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-500/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-300 flex items-start gap-2 animate-fade-in"
          role="alert"
        >
          <svg className="h-4 w-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>{parseError}</span>
        </div>
      )}

      {preview && (
        <div
          className={cn(
            "rounded-xl border p-4 space-y-3 animate-scale-in",
            "border-indigo-200/60 bg-indigo-50/70",
            "dark:border-indigo-500/25 dark:bg-indigo-500/10"
          )}
        >
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t("parsedResult")}
          </div>

          <div className="rounded-lg bg-white/90 dark:bg-white/[0.06] border border-indigo-100/60 dark:border-white/10 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
              {t("parsedTitle")}
            </p>
            <p className="text-sm font-semibold text-foreground">{preview.title}</p>
          </div>

          <div className="rounded-lg bg-white/90 dark:bg-white/[0.06] border border-indigo-100/60 dark:border-white/10 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
              {t("parsedDeadline")}
            </p>
            {preview.deadline ? (
              <p className="text-sm font-medium text-foreground">
                {formatDeadlineDisplay(preview.deadline)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {t("noDateDetected")}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleUse}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold",
              "bg-indigo-600 text-white hover:bg-indigo-700",
              "shadow-sm hover:shadow-md hover:-translate-y-0.5",
              "transition-all duration-200 cursor-pointer"
            )}
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {t("useThis")}
          </button>
        </div>
      )}
    </div>
  );
}
