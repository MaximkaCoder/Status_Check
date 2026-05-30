"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const label = {
    title:    locale === "uk" ? "Реєстрація" : "Create account",
    subtitle: locale === "uk" ? "Почніть відстежувати задачі" : "Start tracking commitments",
    name:     locale === "uk" ? "Ваше ім'я" : "Your name",
    email:    locale === "uk" ? "Електронна пошта" : "Email",
    password: locale === "uk" ? "Пароль" : "Password",
    hint:     locale === "uk" ? "Мінімум 8 символів" : "At least 8 characters",
    submit:   locale === "uk" ? "Зареєструватись" : "Create account",
    hasAcc:   locale === "uk" ? "Вже є акаунт?" : "Already have an account?",
    login:    locale === "uk" ? "Увійти" : "Sign in",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      window.location.replace("/");
    } catch {
      setError(locale === "uk" ? "Помилка мережі" : "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className={cn(
        "w-full max-w-sm rounded-2xl p-8",
        "bg-white/50 dark:bg-white/[0.05] backdrop-blur-xl",
        "border border-white/70 dark:border-white/[0.10]",
        "shadow-[0_8px_40px_rgba(0,0,0,0.10),inset_0_1px_0_rgba(255,255,255,0.9)]",
        "dark:shadow-[0_8px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)]"
      )}>
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 shadow-[0_4px_14px_rgba(99,102,241,0.45)]">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-lg font-bold text-slate-800 dark:text-white">{label.title}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{label.subtitle}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1.5">
              {label.name}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className={cn(
                "w-full rounded-xl px-3.5 py-2.5 text-sm",
                "bg-white/70 dark:bg-white/[0.07]",
                "border border-slate-200/80 dark:border-white/[0.12]",
                "text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30",
                "focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-300",
                "transition-all duration-150"
              )}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1.5">
              {label.email}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={cn(
                "w-full rounded-xl px-3.5 py-2.5 text-sm",
                "bg-white/70 dark:bg-white/[0.07]",
                "border border-slate-200/80 dark:border-white/[0.12]",
                "text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30",
                "focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-300",
                "transition-all duration-150"
              )}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-white/70 mb-1.5">
              {label.password}
              <span className="font-normal text-muted-foreground ml-1">({label.hint})</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className={cn(
                "w-full rounded-xl px-3.5 py-2.5 text-sm",
                "bg-white/70 dark:bg-white/[0.07]",
                "border border-slate-200/80 dark:border-white/[0.12]",
                "text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30",
                "focus:outline-none focus:ring-2 focus:ring-indigo-400/50 focus:border-indigo-300",
                "transition-all duration-150"
              )}
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "relative w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold overflow-hidden",
              "bg-gradient-to-r from-indigo-500 to-violet-500 text-white",
              "shadow-[0_4px_14px_rgba(99,102,241,0.45)]",
              "hover:shadow-[0_6px_20px_rgba(99,102,241,0.55)]",
              "transition-all duration-200 cursor-pointer group/btn",
              "disabled:opacity-60 disabled:cursor-not-allowed"
            )}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-violet-400 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
            <span className="relative">{loading ? "..." : label.submit}</span>
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {label.hasAcc}{" "}
          <Link href="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-2">
            {label.login}
          </Link>
        </p>
      </div>
    </div>
  );
}
