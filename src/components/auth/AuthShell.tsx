"use client";

import { cn } from "@/lib/utils";

// Liquid-glass shell for login/register: drifting gradient orbs behind a
// frosted card. Orbs pause automatically under prefers-reduced-motion via
// the global media query in globals.css.
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Ambient orbs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-400/30 dark:bg-indigo-500/20 blur-[100px] animate-float-orb" />
        <div className="absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-violet-400/30 dark:bg-violet-600/20 blur-[110px] animate-float-orb-slow" />
        <div
          className="absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-sky-300/20 dark:bg-fuchsia-500/10 blur-[90px] animate-float-orb"
          style={{ animationDelay: "-9s" }}
        />
      </div>

      {/* Glass card */}
      <div
        className={cn(
          "relative w-full max-w-sm rounded-3xl p-8",
          "bg-white/60 dark:bg-white/[0.06]",
          "backdrop-blur-2xl backdrop-saturate-150",
          "border border-white/70 dark:border-white/[0.12]",
          "shadow-[0_8px_40px_rgba(0,0,0,0.10),inset_0_1px_0_rgba(255,255,255,0.9)]",
          "dark:shadow-[0_8px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]",
          "animate-scale-in"
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function AuthLogo({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center gap-3 mb-8 animate-fade-in-up stagger-1">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 shadow-[0_4px_20px_rgba(99,102,241,0.5)] animate-glow-pulse">
        <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      </div>
      <div className="text-center">
        <h1 className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-white">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

export function AuthField({
  id, label, hint, icon, ...inputProps
}: {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1.5">
        {label}
        {hint && <span className="font-normal text-muted-foreground ml-1">({hint})</span>}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30">
          {icon}
        </span>
        <input
          id={id}
          {...inputProps}
          className={cn(
            "w-full rounded-xl pl-10 pr-3.5 py-2.5 text-sm",
            "bg-white/70 dark:bg-white/[0.07]",
            "border border-slate-200/80 dark:border-white/[0.12]",
            "text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30",
            "focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-300",
            "focus:shadow-[0_0_20px_rgba(99,102,241,0.15)]",
            "transition-all duration-200",
            inputProps.className
          )}
        />
      </div>
    </div>
  );
}

export function AuthPasswordField({
  id, label, hint, show, onToggleShow, toggleAria, ...inputProps
}: {
  id: string;
  label: string;
  hint?: string;
  show: boolean;
  onToggleShow: () => void;
  toggleAria: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1.5">
        {label}
        {hint && <span className="font-normal text-muted-foreground ml-1">({hint})</span>}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </span>
        <input
          id={id}
          type={show ? "text" : "password"}
          {...inputProps}
          className={cn(
            "w-full rounded-xl pl-10 pr-10 py-2.5 text-sm",
            "bg-white/70 dark:bg-white/[0.07]",
            "border border-slate-200/80 dark:border-white/[0.12]",
            "text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30",
            "focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-300",
            "focus:shadow-[0_0_20px_rgba(99,102,241,0.15)]",
            "transition-all duration-200",
            inputProps.className
          )}
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={toggleAria}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/30 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-pointer"
        >
          {show ? (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export function AuthError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-medium",
        "bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-200",
        "backdrop-blur-xl animate-fade-in"
      )}
    >
      <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
      </svg>
      {message}
    </div>
  );
}

export function AuthSubmit({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={cn(
        "relative w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold overflow-hidden",
        "bg-gradient-to-r from-indigo-500 to-violet-500 text-white",
        "shadow-[0_4px_14px_rgba(99,102,241,0.45)]",
        "hover:shadow-[0_6px_24px_rgba(99,102,241,0.6)]",
        "transition-all duration-200 cursor-pointer group/btn",
        "disabled:opacity-60 disabled:cursor-not-allowed"
      )}
    >
      {/* Shimmer sweep on hover */}
      <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out" aria-hidden="true" />
      <span className="relative flex items-center gap-2">
        {loading && <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" />}
        {children}
      </span>
    </button>
  );
}
