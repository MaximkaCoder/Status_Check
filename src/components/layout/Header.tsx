"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { useLanguage } from "@/contexts/LanguageContext";

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/80 dark:border-white/[0.08] bg-white/95 dark:bg-[#0a0b1a]/80 backdrop-blur-xl shadow-sm transition-colors duration-150">
      <div className="relative mx-auto flex max-w-5xl items-center justify-between px-4 h-14">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 hover:opacity-90 transition-opacity cursor-pointer"
          aria-label="Status Check home"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-500/20 backdrop-blur-sm border border-indigo-200 dark:border-indigo-500/30 shadow-sm flex-shrink-0">
            <svg
              className="h-4 w-4 text-indigo-600 dark:text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <div className="flex flex-col leading-none gap-0.5">
            <span className="text-sm font-bold tracking-tight text-indigo-700 dark:text-white">
              {t("appName")}
            </span>
            <span className="text-[10px] text-indigo-400 dark:text-white/60 hidden sm:block">
              {t("appSubtitle")}
            </span>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-2" aria-label="Main navigation">
          {!isHome && (
            <Link
              href="/"
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium",
                "text-indigo-500 dark:text-white/70 hover:text-indigo-700 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-white/10",
                "transition-all duration-150 cursor-pointer"
              )}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span className="hidden sm:inline">{t("dashboard")}</span>
            </Link>
          )}

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Language switcher */}
          <LanguageSwitcher />

          {/* New Item button */}
          <Link
            href="/items/new"
            className={cn(
              "inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold",
              "w-[152px] shrink-0",
              "border border-transparent",
              "bg-indigo-600 text-white hover:bg-indigo-700",
              "dark:bg-indigo-600/90 dark:text-white dark:hover:bg-indigo-500/90 dark:border-indigo-500/50",
              "shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer",
              "animate-glow-pulse"
            )}
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
            <span>{t("newItem")}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
