"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToastVariant = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  leaving?: boolean;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ToastContext = createContext<ToastContextValue | null>(null);

// ---------------------------------------------------------------------------
// Single toast item component
// ---------------------------------------------------------------------------

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success:
    "bg-emerald-500/15 border-emerald-500/30 text-emerald-800 dark:text-emerald-100 shadow-[0_8px_32px_rgba(16,185,129,0.2)]",
  error:
    "bg-rose-500/15 border-rose-500/30 text-rose-800 dark:text-rose-100 shadow-[0_8px_32px_rgba(239,68,68,0.2)]",
  info:
    "bg-indigo-500/15 border-indigo-500/30 text-indigo-800 dark:text-indigo-100 shadow-[0_8px_32px_rgba(99,102,241,0.2)]",
};

const VARIANT_ICONS: Record<ToastVariant, React.ReactNode> = {
  success: (
    <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  // Animate in on mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const visible = mounted && !toast.leaving && !dismissing;

  function handleDismiss() {
    setDismissing(true);
    setTimeout(() => onDismiss(toast.id), 500);
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-medium",
        "backdrop-blur-xl backdrop-saturate-150",
        "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-default select-none",
        VARIANT_STYLES[toast.variant],
        visible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 -translate-y-3 scale-95"
      )}
    >
      {VARIANT_ICONS[toast.variant]}
      <span className="flex-1 leading-snug">{toast.message}</span>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss notification"
        className="flex-shrink-0 ml-1 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

let idCounter = 0;
function nextId() {
  return `toast-${++idCounter}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = nextId();
      setToasts((prev) => [...prev, { id, message, variant }]);

      // Auto-dismiss: animate out at 3.5s, remove after the 500ms transition
      const timer = setTimeout(() => {
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
        const removeTimer = setTimeout(() => dismiss(id), 500);
        timersRef.current.set(id, removeTimer);
      }, 3500);
      timersRef.current.set(id, timer);
    },
    [dismiss]
  );

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast portal — fixed top-center */}
      <div
        aria-label="Notifications"
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 pointer-events-none items-center"
        style={{ maxWidth: "min(420px, calc(100vw - 2rem))" }}
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx;
}
