"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { t } = useLanguage();
  const { user, logout } = useAuth();

  return (
    <header className={cn(
      "sticky top-0 z-50",
      "bg-white/50 dark:bg-[#0a0b1a]/70",
      "backdrop-blur-xl",
      "border-b border-white/60 dark:border-white/[0.08]",
      "shadow-[0_1px_0_rgba(255,255,255,0.8),0_4px_24px_rgba(0,0,0,0.06)]",
      "dark:shadow-[0_1px_0_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.4)]",
      "transition-colors duration-150"
    )}>
      <div className="relative mx-auto flex max-w-5xl items-center justify-between px-4 h-14">

        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 hover:opacity-85 transition-opacity cursor-pointer"
          aria-label="Status Check home"
        >
          {/* Gradient icon */}
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-xl flex-shrink-0",
            "bg-gradient-to-br from-indigo-400 to-violet-500",
            "shadow-[0_2px_10px_rgba(99,102,241,0.45)]",
            "border border-indigo-300/30"
          )}>
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>

          <div className="flex flex-col leading-none gap-0.5">
            <span className="text-sm font-bold tracking-tight text-slate-800 dark:text-white">
              {t("appName")}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-white/50 hidden sm:block">
              {t("appSubtitle")}
            </span>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-2" aria-label="Main navigation">
          <ThemeToggle />
          <LanguageSwitcher />

          {/* User pill + logout */}
          {user && (
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium",
                "bg-white/40 dark:bg-white/[0.06]",
                "border border-white/70 dark:border-white/[0.10]",
                "text-slate-700 dark:text-white/80",
                "shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-none"
              )}>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-white text-[10px] font-bold flex-shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[96px] truncate">{user.name}</span>
              </div>
              <button
                type="button"
                onClick={logout}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl",
                  "bg-white/40 dark:bg-white/[0.06]",
                  "border border-white/70 dark:border-white/[0.10]",
                  "text-slate-500 dark:text-white/50",
                  "hover:bg-white/60 dark:hover:bg-white/[0.10] hover:text-rose-500 dark:hover:text-rose-400",
                  "shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-none",
                  "transition-all duration-150 cursor-pointer outline-none"
                )}
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}

          {/* New Item — icon-only on mobile, full pill on desktop */}
          <Link
            href="/items/new"
            className={cn(
              "relative overflow-hidden rounded-xl text-white cursor-pointer group/btn",
              "bg-gradient-to-r from-indigo-500 to-violet-500",
              "border border-indigo-400/30",
              "shadow-[0_4px_14px_rgba(99,102,241,0.45)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.55)]",
              "transition-shadow duration-300",
              // mobile: square icon button
              "flex h-9 w-9 items-center justify-center sm:hidden",
            )}
            aria-label={t("newItem")}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-violet-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 ease-out" />
            <svg className="relative h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </Link>
          <Link
            href="/items/new"
            className={cn(
              "relative hidden sm:inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold overflow-hidden",
              "w-[152px] shrink-0",
              "bg-gradient-to-r from-indigo-500 to-violet-500",
              "text-white border border-indigo-400/30",
              "shadow-[0_4px_14px_rgba(99,102,241,0.45)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.55)]",
              "transition-shadow duration-300 cursor-pointer group/btn"
            )}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-violet-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 ease-out" />
            <span className="relative flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              {t("newItem")}
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
