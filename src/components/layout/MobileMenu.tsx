"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";

// Collapses the secondary header actions (theme, language, reports, admin,
// archive, settings, logout) into a single dropdown on narrow screens where
// they don't all fit in one row. Desktop keeps the full icon row untouched.
export function MobileMenu() {
  const pathname = usePathname();
  const { locale } = useLanguage();
  const uk = locale === "uk";
  const { user, logout } = useAuth();

  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  function openMenu() {
    setOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }
  function closeMenu() {
    setVisible(false);
    setTimeout(() => setOpen(false), 200);
  }

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) closeMenu();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!user) return null;

  const links: { href: string; label: string; icon: React.ReactNode }[] = [
    ...(user.isAdmin ? [{
      href: "/reports",
      label: uk ? "Тижневий звіт" : "Weekly report",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    }] : []),
    ...(user.isAdmin ? [{
      href: "/admin",
      label: uk ? "Адмін-панель" : "Admin panel",
      icon: <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </>,
    }] : []),
    {
      href: "/archive",
      label: uk ? "Архів" : "Archive",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />,
    },
    {
      href: "/settings",
      label: uk ? "Налаштування" : "Settings",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
    },
  ];

  return (
    <div className="relative sm:hidden">
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? closeMenu() : openMenu())}
        aria-label={uk ? "Меню" : "Menu"}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-xl",
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <div
          ref={panelRef}
          className={cn(
            "absolute right-0 top-10 z-50 w-60 rounded-2xl overflow-hidden",
            "bg-white dark:bg-[#0f1029]",
            "border border-slate-200 dark:border-white/[0.10]",
            "shadow-[0_8px_32px_rgba(0,0,0,0.18),0_1px_0_rgba(255,255,255,0.9)]",
            "dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)]",
            "origin-top-right transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
            visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-1.5"
          )}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.07]">
            <span className="text-xs font-semibold text-slate-500 dark:text-white/50">{uk ? "Тема" : "Theme"}</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.07]">
            <span className="text-xs font-semibold text-slate-500 dark:text-white/50">{uk ? "Мова" : "Language"}</span>
            <LanguageSwitcher />
          </div>

          <div className="py-1.5">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={closeMenu}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors",
                  pathname.startsWith(l.href)
                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-500/[0.08]"
                    : "text-slate-700 dark:text-white/80 hover:bg-muted/50 dark:hover:bg-white/[0.05]"
                )}
              >
                <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  {l.icon}
                </svg>
                {l.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-black/[0.06] dark:border-white/[0.07] py-1.5">
            <button
              type="button"
              onClick={() => { closeMenu(); logout(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50/60 dark:hover:bg-rose-500/[0.08] transition-colors cursor-pointer"
            >
              <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {uk ? "Вийти" : "Log out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
