"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { AuthShell, AuthLogo, AuthField, AuthPasswordField, AuthError, AuthSubmit } from "@/components/auth/AuthShell";

export default function RegisterPage() {
  const { locale } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    showPw:   locale === "uk" ? "Показати пароль" : "Show password",
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
    <AuthShell>
      <AuthLogo title={label.title} subtitle={label.subtitle} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="animate-fade-in-up stagger-2">
          <AuthField
            id="register-name"
            label={label.name}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
        </div>

        <div className="animate-fade-in-up stagger-3">
          <AuthField
            id="register-email"
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

        <div className="animate-fade-in-up stagger-4">
          <AuthPasswordField
            id="register-password"
            label={label.password}
            hint={label.hint}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            show={showPassword}
            onToggleShow={() => setShowPassword(v => !v)}
            toggleAria={label.showPw}
          />
        </div>

        {error && <AuthError message={error} />}

        <div className="animate-fade-in-up stagger-5">
          <AuthSubmit loading={loading}>{label.submit}</AuthSubmit>
        </div>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground animate-fade-in-up stagger-6">
        {label.hasAcc}{" "}
        <Link href="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-2 transition-colors">
          {label.login}
        </Link>
      </p>
    </AuthShell>
  );
}
