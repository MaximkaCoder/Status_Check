"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      className="inline-flex items-center rounded-lg border border-indigo-200 dark:border-white/20 bg-indigo-50/80 dark:bg-white/10 backdrop-blur-sm p-0.5 gap-0.5"
      role="group"
      aria-label="Select language"
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        className={cn(
          "px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer",
          locale === "en"
            ? "bg-white text-indigo-700 dark:bg-white dark:text-indigo-700 shadow-sm"
            : "text-indigo-400 dark:text-white/70 hover:text-indigo-700 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10"
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale("uk")}
        aria-pressed={locale === "uk"}
        className={cn(
          "px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer",
          locale === "uk"
            ? "bg-white text-indigo-700 dark:bg-white dark:text-indigo-700 shadow-sm"
            : "text-indigo-400 dark:text-white/70 hover:text-indigo-700 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10"
        )}
      >
        UA
      </button>
    </div>
  );
}
