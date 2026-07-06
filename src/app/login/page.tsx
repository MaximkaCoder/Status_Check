"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { AuthShell, AuthLogo, AuthField, AuthPasswordField, AuthError, AuthSubmit } from "@/components/auth/AuthShell";

export default function LoginPage() {
  const { locale } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const label = {
    title:    locale === "uk" ? "Вхід" : "Sign in",
    subtitle: locale === "uk" ? "Раді бачити вас знову" : "Welcome back",
    email:    locale === "uk" ? "Електронна пошта" : "Email",
    password: locale === "uk" ? "Пароль" : "Password",
    submit:   locale === "uk" ? "Увійти" : "Sign in",
    noAcc:    locale === "uk" ? "Немає акаунту?" : "No account?",
    register: locale === "uk" ? "Зареєструватись" : "Register",
    showPw:   locale === "uk" ? "Показати пароль" : "Show password",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
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
    <AuthShell>
      <AuthLogo title={label.title} subtitle={label.subtitle} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="animate-fade-in-up stagger-2">
          <AuthField
            id="login-email"
            label={label.email}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />
        </div>

        <div className="animate-fade-in-up stagger-3">
          <AuthPasswordField
            id="login-password"
            label={label.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            show={showPassword}
            onToggleShow={() => setShowPassword(v => !v)}
            toggleAria={label.showPw}
          />
        </div>

        {error && <AuthError message={error} />}

        <div className="animate-fade-in-up stagger-4">
          <AuthSubmit loading={loading}>{label.submit}</AuthSubmit>
        </div>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground animate-fade-in-up stagger-5">
        {label.noAcc}{" "}
        <Link href="/register" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-2 transition-colors">
          {label.register}
        </Link>
      </p>
    </AuthShell>
  );
}
