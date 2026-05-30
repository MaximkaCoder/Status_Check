"use client";

import { useState } from "react";
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
  const [activeTab, setActiveTab] = useState<Tab>("manual");
  const [prefill, setPrefill] = useState<Prefill>({});
  const [formKey, setFormKey] = useState(0);

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
        <div className="rounded-2xl border border-border/60 bg-card shadow-card p-6 animate-scale-in">
          {hasPrefill && (
            <div className="mb-5 rounded-xl border border-indigo-200/60 dark:border-indigo-500/25 bg-indigo-50/60 dark:bg-indigo-500/10 px-4 py-3 text-sm text-indigo-700 dark:text-indigo-300 flex items-start gap-2.5 animate-fade-in">
              <svg className="h-4 w-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{t("prefillNotice")}</span>
            </div>
          )}
          <ItemForm key={formKey} mode="create" defaultValues={prefill} />
        </div>
      )}
    </div>
  );
}
