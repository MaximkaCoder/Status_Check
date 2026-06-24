"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { TabSwitcher } from "@/components/forms/TabSwitcher";
import { NLInputForm } from "@/components/forms/NLInputForm";
import { ItemForm } from "@/components/forms/ItemForm";
import { useLanguage } from "@/contexts/LanguageContext";

type Tab = "manual" | "smart";

interface Prefill {
  title?: string;
  deadline?: string;
  project?: string;
  assignee?: string;
  reviewer?: string;
}

export default function NewItemPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("manual");
  const [prefill, setPrefill] = useState<Prefill>({});
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    const stored = sessionStorage.getItem("newItemDeadline");
    if (stored) {
      setPrefill(prev => prev.deadline ? prev : { ...prev, deadline: stored });
      setFormKey(k => k + 1);
      sessionStorage.removeItem("newItemDeadline");
    }
  }, []);

  function handleParsed(values: { title: string; deadline?: string; project?: string; assignee?: string; reviewer?: string }) {
    const next: Prefill = { title: values.title, project: values.project, assignee: values.assignee, reviewer: values.reviewer };
    if (values.deadline) {
      try { next.deadline = format(new Date(values.deadline), "yyyy-MM-dd'T'HH:mm"); } catch {}
    }
    setPrefill(next);
    setFormKey((k) => k + 1);
    setActiveTab("manual");
  }

  const hasPrefill = !!(prefill.title || prefill.deadline);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 animate-fade-in-up stagger-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200/60 dark:border-indigo-500/30 flex-shrink-0">
            <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{t("newItemTitle")}</h1>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{t("newItemDesc")}</p>
      </div>

      <div className="mb-5 animate-fade-in-up stagger-2">
        <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {activeTab === "smart" && (
        <div className="rounded-2xl border border-border/60 bg-card shadow-card p-6 animate-scale-in">
          <NLInputForm onUseParsed={handleParsed} />
        </div>
      )}

      {activeTab === "manual" && (
        <div className="space-y-6 animate-scale-in">
          <div className="rounded-2xl border border-border/60 bg-card shadow-card p-6">
            {hasPrefill && (
              <div className="mb-5 rounded-xl border border-indigo-200/60 dark:border-indigo-500/25 bg-indigo-50/60 dark:bg-indigo-500/10 px-4 py-3 text-sm text-indigo-700 dark:text-indigo-300 flex items-start gap-2.5 animate-fade-in">
                <svg className="h-4 w-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{t("prefillNotice")}</span>
              </div>
            )}
            <ItemForm
              key={formKey}
              mode="create"
              defaultValues={prefill}
              onCreated={(id) => router.push(`/items/${id}/edit`)}
            />
          </div>

          {/* Files — disabled until item is saved */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-card p-6 opacity-60">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-foreground">Файли</h2>
                <p className="text-xs text-muted-foreground mt-0.5">макс. 20 МБ на файл</p>
              </div>
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 border-violet-400/60 text-violet-600 dark:text-violet-400 disabled:cursor-not-allowed"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Завантажити
              </button>
            </div>
            <p className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border/60 rounded-xl">
              Файли можна додати після збереження задачі
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
