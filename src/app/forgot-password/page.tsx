"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { AuthShell, AuthLogo, AuthField, AuthPasswordField, AuthError, AuthSubmit } from "@/components/auth/AuthShell";

type Step = "request" | "verify" | "reset";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const uk = locale === "uk";

  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const label = {
    title:    uk ? "Відновлення паролю" : "Reset password",
    subReq:   uk ? "Введіть пошту — надішлемо код" : "Enter your email — we'll send a code",
    subVerify: uk ? `Код надіслано на ${email}` : `Code sent to ${email}`,
    subReset: uk ? "Придумайте новий пароль" : "Set a new password",
    email:    uk ? "Електронна пошта" : "Email",
    code:     uk ? "Код з листа" : "Code from email",
    newPw:    uk ? "Новий пароль" : "New password",
    hint:     uk ? "Мінімум 8 символів" : "At least 8 characters",
    send:     uk ? "Надіслати код" : "Send code",
    verify:   uk ? "Підтвердити код" : "Verify code",
    reset:    uk ? "Змінити пароль" : "Change password",
    back:     uk ? "← Назад до входу" : "← Back to sign in",
    resend:   uk ? "Надіслати код ще раз" : "Resend code",
    showPw:   uk ? "Показати пароль" : "Show password",
    notFound: uk ? "Такої пошти немає в системі" : "No account with that email",
    badCode:  uk ? "Невірний або застарілий код" : "Invalid or expired code",
    tooMany:  uk ? "Забагато спроб. Запитайте новий код." : "Too many attempts. Request a new code.",
    net:      uk ? "Помилка мережі" : "Network error",
  };

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.status === 404) { setError(label.notFound); return; }
      if (!res.ok) { setError(label.net); return; }
      setStep("verify");
    } catch {
      setError(label.net);
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!res.ok) {
        setError(res.status === 429 ? label.tooMany : label.badCode);
        return;
      }
      setStep("reset");
    } catch {
      setError(label.net);
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password }),
      });
      if (!res.ok) {
        // Code expired between verify and submit → send back to the code step
        setError(res.status === 429 ? label.tooMany : label.badCode);
        setStep("verify");
        return;
      }
      router.replace("/login?reset=1");
    } catch {
      setError(label.net);
    } finally {
      setLoading(false);
    }
  }

  const emailIcon = (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
  const codeIcon = (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
  );

  const subtitle = step === "request" ? label.subReq : step === "verify" ? label.subVerify : label.subReset;

  return (
    <AuthShell>
      <AuthLogo title={label.title} subtitle={subtitle} />

      {step === "request" && (
        <form onSubmit={requestCode} className="space-y-4">
          <div className="animate-fade-in-up stagger-2">
            <AuthField
              id="fp-email" label={label.email} type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} required autoComplete="email" icon={emailIcon}
            />
          </div>
          {error && <AuthError message={error} />}
          <div className="animate-fade-in-up stagger-3">
            <AuthSubmit loading={loading}>{label.send}</AuthSubmit>
          </div>
        </form>
      )}

      {step === "verify" && (
        <form onSubmit={verifyCode} className="space-y-4">
          <div className="animate-fade-in-up stagger-2">
            <AuthField
              id="fp-code" label={label.code} type="text" inputMode="numeric"
              autoComplete="one-time-code" maxLength={6} value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required icon={codeIcon}
            />
          </div>
          {error && <AuthError message={error} />}
          <div className="animate-fade-in-up stagger-3">
            <AuthSubmit loading={loading}>{label.verify}</AuthSubmit>
          </div>
          <button
            type="button"
            onClick={() => { setStep("request"); setError(""); setCode(""); }}
            className="w-full text-center text-xs text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            {label.resend}
          </button>
        </form>
      )}

      {step === "reset" && (
        <form onSubmit={resetPassword} className="space-y-4">
          <div className="animate-fade-in-up stagger-2">
            <AuthPasswordField
              id="fp-password" label={label.newPw} hint={label.hint} value={password}
              onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password"
              show={showPassword} onToggleShow={() => setShowPassword((v) => !v)} toggleAria={label.showPw}
            />
          </div>
          {error && <AuthError message={error} />}
          <div className="animate-fade-in-up stagger-3">
            <AuthSubmit loading={loading}>{label.reset}</AuthSubmit>
          </div>
        </form>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground animate-fade-in-up stagger-5">
        <Link href="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-2 transition-colors">
          {label.back}
        </Link>
      </p>
    </AuthShell>
  );
}
