"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { withViewTransition } from "@/lib/view-transition";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-xl p-0.5 gap-0.5",
        "bg-white/40 dark:bg-white/[0.06]",
        "border border-white/70 dark:border-white/[0.10]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-none"
      )}
      role="group"
      aria-label="Select language"
    >
      {(["en", "uk"] as const).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => { if (lang !== locale) withViewTransition(() => setLocale(lang)); }}
          aria-pressed={locale === lang}
          className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer outline-none",
            locale === lang
              ? "bg-white dark:bg-white/20 text-indigo-600 dark:text-white shadow-[0_1px_4px_rgba(99,102,241,0.18),0_1px_2px_rgba(0,0,0,0.08)] dark:shadow-sm"
              : "text-slate-400 dark:text-white/50 hover:text-slate-600 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10"
          )}
        >
          {lang === "uk" ? "UA" : "EN"}
        </button>
      ))}
    </div>
  );
}
