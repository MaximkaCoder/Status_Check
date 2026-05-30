"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 300);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollUp() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <button
      type="button"
      onClick={scrollUp}
      aria-label="Scroll to top"
      className={cn(
        // only on portrait (hidden on lg+)
        "lg:hidden",
        "fixed bottom-6 right-5 z-50",
        "h-12 w-12 rounded-full",
        // iOS 17 liquid glass
        "bg-white/30 dark:bg-white/10",
        "backdrop-blur-xl",
        "border border-white/60 dark:border-white/20",
        "shadow-[0_4px_24px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.8)]",
        "dark:shadow-[0_4px_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)]",
        "flex items-center justify-center",
        "text-slate-600 dark:text-white/80",
        "hover:bg-white/50 dark:hover:bg-white/20",
        "hover:shadow-[0_6px_28px_rgba(99,102,241,0.25),inset_0_1px_0_rgba(255,255,255,0.9)]",
        "active:scale-95",
        "cursor-pointer",
        // fade + slide transition
        "transition-all duration-300 ease-out",
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
}
