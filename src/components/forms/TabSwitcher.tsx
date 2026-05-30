"use client";

import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

type Tab = "manual" | "smart";

interface TabSwitcherProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function TabSwitcher({ activeTab, onTabChange }: TabSwitcherProps) {
  const { t } = useLanguage();

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "manual",
      label: t("manual"),
      icon: (
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      id: "smart",
      label: t("smartInput"),
      icon: (
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="inline-flex rounded-xl border border-border bg-muted/60 p-1 gap-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all duration-200 cursor-pointer",
            activeTab === tab.id
              ? "bg-white text-indigo-700 shadow-sm border border-indigo-100/60"
              : "text-muted-foreground hover:text-foreground hover:bg-white/50"
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
