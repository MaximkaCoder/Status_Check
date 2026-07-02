"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ComboboxInput } from "@/components/ui/ComboboxInput";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { createItem, updateItem } from "@/lib/api-client";
import type { TranslationKey } from "@/lib/i18n";

type Status = "TO_CHECK" | "EXPIRED" | "DONE" | "NOT_ACTUAL" | "IDEAS_BACKLOG";
type Priority = "LOW" | "MEDIUM" | "HIGH";

export interface ItemFormValues {
  title: string;
  description: string;
  deadline: string;
  creator_name: string;
  project?: string;
  assignee?: string;
  reviewer?: string;
  status?: Status;
  priority?: Priority;
}

interface ItemFormProps {
  defaultValues?: Partial<ItemFormValues>;
  mode: "create" | "edit";
  itemId?: string;
  onCreated?: (id: string) => void;
}

const USER_SETTABLE_STATUSES: Status[] = ["TO_CHECK", "EXPIRED", "DONE", "NOT_ACTUAL", "IDEAS_BACKLOG"];

const STATUS_STYLES: Record<Status, { active: string; inactive: string; dot: string; label: (t: (k: TranslationKey) => string) => string }> = {
  TO_CHECK:      { active: "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",   inactive: "border-border text-muted-foreground hover:border-indigo-300 hover:text-indigo-600",  dot: "bg-indigo-500",  label: (t) => t("toCheck")      },
  EXPIRED:       { active: "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",             inactive: "border-border text-muted-foreground hover:border-rose-300 hover:text-rose-600",      dot: "bg-rose-500",    label: (t) => t("expired")      },
  DONE:          { active: "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", inactive: "border-border text-muted-foreground hover:border-emerald-300 hover:text-emerald-600", dot: "bg-emerald-500", label: (t) => t("done")         },
  NOT_ACTUAL:    { active: "border-slate-500 bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300",        inactive: "border-border text-muted-foreground hover:border-slate-300 hover:text-slate-600",    dot: "bg-slate-400",   label: (t) => t("notActual")    },
  IDEAS_BACKLOG: { active: "border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",   inactive: "border-border text-muted-foreground hover:border-violet-300 hover:text-violet-600",  dot: "bg-violet-500",  label: (t) => t("ideasBacklog") },
};

const inputBase = cn(
  "w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground",
  "placeholder:text-muted-foreground",
  "focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400",
  "transition-all duration-150"
);

function toDatetimeLocal(isoOrDatetime: string): string {
  if (!isoOrDatetime) return "";
  try {
    const d = new Date(isoOrDatetime);
    if (isNaN(d.getTime())) return "";
    return format(d, "yyyy-MM-dd'T'HH:mm");
  } catch {
    return "";
  }
}

function FieldLabel({
  children,
  required,
  htmlFor,
}: {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-semibold text-foreground mb-1.5"
    >
      {children}
      {required && (
        <span className="text-rose-500 ml-0.5" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

function FieldError({ message, id }: { message?: string; id?: string }) {
  if (!message) return null;
  return (
    <p
      id={id}
      className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1"
      role="alert"
    >
      <svg
        className="h-3 w-3 flex-shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      {message}
    </p>
  );
}

export function ItemForm({ defaultValues, mode, itemId, onCreated }: ItemFormProps) {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();

  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [deadline, setDeadline] = useState(() => {
    if (!defaultValues?.deadline) return "";
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(defaultValues.deadline))
      return defaultValues.deadline;
    return toDatetimeLocal(defaultValues.deadline);
  });
  const [creatorName, setCreatorName] = useState(defaultValues?.creator_name ?? user?.name ?? "");
  const [project,  setProject]  = useState(defaultValues?.project  ?? "");
  const [assignee, setAssignee] = useState(defaultValues?.assignee ?? "");
  const [reviewer, setReviewer] = useState(defaultValues?.reviewer ?? "");

  const [priority, setPriority] = useState<Priority>((defaultValues?.priority as Priority | undefined) ?? "MEDIUM");

  const [userNames,     setUserNames]     = useState<string[]>([]);
  const [projectNames,  setProjectNames]  = useState<string[]>([]);
  const [newProjectPending, setNewProjectPending] = useState<string | null>(null);
  const [pendingSubmitData, setPendingSubmitData] = useState<null | (() => Promise<void>)>(null);

  useEffect(() => {
    fetch("/api/users").then((r) => r.ok ? r.json() : []).then((data: { name: string }[]) => setUserNames(data.map((u) => u.name))).catch(() => {});
    fetch("/api/projects").then((r) => r.ok ? r.json() : []).then((data: { name: string }[]) => setProjectNames(data.map((p) => p.name))).catch(() => {});
  }, []);
  const initialStatus: Status =
    (defaultValues?.status as Status | undefined) ?? "TO_CHECK";
  const [status, setStatus] = useState<Status>(initialStatus);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = t("errorTitleRequired");
    if (title.trim().length > 200) newErrors.title = t("errorTitleLength");
    if (!deadline) newErrors.deadline = t("errorDeadlineRequired");
    if (!project.trim())  newErrors.project  = t("errorProjectRequired");
    if (!assignee.trim()) newErrors.assignee = t("errorAssigneeRequired");
    if (!reviewer.trim()) newErrors.reviewer = t("errorReviewerRequired");
    // only validate creator_name if user is not logged in
    if (!user) {
      if (!creatorName.trim()) newErrors.creator_name = t("errorNameRequired");
      if (creatorName.trim().length > 100) newErrors.creator_name = t("errorNameLength");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function doSubmit() {
    setSubmitting(true);
    setApiError(null);
    try {
      if (mode === "create") {
        const created = await createItem({
          title: title.trim(),
          description: description.trim() || undefined,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          creator_name: user?.name || creatorName.trim(),
          project:  project.trim()  || null,
          assignee: assignee.trim() || null,
          reviewer: reviewer.trim() || null,
          priority,
        });
        toast(
          locale === "uk" ? "Задачу створено" : "Item created successfully",
          "success"
        );
        if (onCreated) { onCreated(created.id); return; }
      } else {
        if (!itemId) throw new Error("itemId is required in edit mode");
        await updateItem(itemId, {
          title: title.trim(),
          description: description.trim() || null,
          deadline: deadline ? new Date(deadline).toISOString() : null,
          project:  project.trim()  || null,
          assignee: assignee.trim() || null,
          reviewer: reviewer.trim() || null,
          status,
          priority,
        });
        toast(
          locale === "uk" ? "Зміни збережено" : "Changes saved successfully",
          "success"
        );
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : t("networkError");
      // Check if it looks like a field-specific error
      const lower = message.toLowerCase();
      if (lower.includes("title")) {
        setErrors({ title: message });
      } else if (lower.includes("deadline")) {
        setErrors({ deadline: message });
      } else if (lower.includes("creator") || lower.includes("name")) {
        setErrors({ creator_name: message });
      } else {
        setApiError(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Check project membership before field validation so the toast always shows.
    if (mode === "create" && !user?.isAdmin) {
      const trimmedProject = project.trim();
      if (projectNames.length === 0) {
        toast(locale === "uk" ? "Вас не додано до жодного з проєктів" : "You are not a member of any project", "error");
        return;
      }
      if (trimmedProject && !projectNames.includes(trimmedProject)) {
        toast(locale === "uk" ? `Проєкт "${trimmedProject}" не знайдено. Тільки адмін може створювати проєкти.` : `Project "${trimmedProject}" not found. Only admins can create projects.`, "error");
        return;
      }
    }

    if (!validate()) return;

    const trimmedProject = project.trim();
    if (trimmedProject && !projectNames.includes(trimmedProject)) {
      if (!user?.isAdmin) {
        return;
      }
      setNewProjectPending(trimmedProject);
      setPendingSubmitData(() => doSubmit);
      return;
    }

    await doSubmit();
  }

  async function confirmCreateProject() {
    if (!newProjectPending) return;
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProjectPending }),
      });
      if (res.ok) {
        setProjectNames((prev) => [...prev, newProjectPending].sort());
      }
    } catch {}
    setNewProjectPending(null);
    if (pendingSubmitData) await pendingSubmitData();
    setPendingSubmitData(null);
  }

  return (
    <>
    {newProjectPending && (
      <ConfirmDialog
        title={locale === "uk" ? "Проєкт не існує" : "Project not found"}
        description={locale === "uk"
          ? `Проєкт "${newProjectPending}" не знайдено. Бажаєте створити?`
          : `Project "${newProjectPending}" does not exist. Create it?`}
        confirmLabel={locale === "uk" ? "Створити" : "Create"}
        cancelLabel={t("cancelBtn")}
        variant="default"
        onConfirm={confirmCreateProject}
        onCancel={() => { setNewProjectPending(null); setPendingSubmitData(null); }}
      />
    )}
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Title */}
      <div>
        <FieldLabel required htmlFor="form-title">
          {t("title")}
        </FieldLabel>
        <input
          id="form-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("titlePlaceholder")}
          maxLength={200}
          aria-required="true"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? "title-error" : undefined}
          className={cn(
            inputBase,
            errors.title
              ? "border-rose-400 focus:ring-rose-400/40 focus:border-rose-400"
              : "border-input"
          )}
        />
        <FieldError message={errors.title} id="title-error" />
      </div>

      {/* Description */}
      <div>
        <FieldLabel htmlFor="form-description">
          {t("description")}{" "}
          <span className="text-muted-foreground font-normal text-xs">
            {t("descriptionOptional")}
          </span>
        </FieldLabel>
        <textarea
          id="form-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("descriptionPlaceholder")}
          rows={3}
          maxLength={2000}
          className={cn(inputBase, "border-input resize-none")}
        />
      </div>

      {/* Deadline */}
      <div>
        <FieldLabel required htmlFor="form-deadline">
          {t("deadline")}
        </FieldLabel>
        <input
          id="form-deadline"
          type="datetime-local"
          lang="en-US"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          aria-required="true"
          aria-invalid={!!errors.deadline}
          aria-describedby={errors.deadline ? "deadline-error" : undefined}
          className={cn(
            inputBase,
            "[color-scheme:light] dark:[color-scheme:dark]",
            errors.deadline
              ? "border-rose-400 focus:ring-rose-400/40 focus:border-rose-400"
              : "border-input"
          )}
        />
        <FieldError message={errors.deadline} id="deadline-error" />
      </div>

      {/* Project */}
      <div>
        <FieldLabel required htmlFor="form-project">{t("project")}</FieldLabel>
        <ComboboxInput
          id="form-project"
          value={project}
          onChange={setProject}
          options={projectNames}
          placeholder={locale === "uk" ? "Назва проєкту..." : "Project name..."}
        />
        <FieldError message={errors.project} id="project-error" />
      </div>

      {/* Assignee */}
      <div>
        <FieldLabel required htmlFor="form-assignee">{t("assignee")}</FieldLabel>
        <ComboboxInput
          id="form-assignee"
          value={assignee}
          onChange={setAssignee}
          options={userNames}
          placeholder={locale === "uk" ? "Виконавець..." : "Assignee..."}
        />
        <FieldError message={errors.assignee} id="assignee-error" />
      </div>

      {/* Reviewer */}
      <div>
        <FieldLabel required htmlFor="form-reviewer">{t("reviewer")}</FieldLabel>
        <ComboboxInput
          id="form-reviewer"
          value={reviewer}
          onChange={setReviewer}
          options={userNames}
          placeholder={locale === "uk" ? "Перевіряючий..." : "Reviewer..."}
        />
        <FieldError message={errors.reviewer} id="reviewer-error" />
      </div>

      {/* Priority */}
      <div>
        <FieldLabel>{locale === "uk" ? "Пріоритет" : "Priority"}</FieldLabel>
        <div className="flex gap-2" role="group">
          {(["LOW", "MEDIUM", "HIGH"] as Priority[]).map((p) => {
            const active = priority === p;
            const cfg = {
              LOW:    { label: locale === "uk" ? "Низький" : "Low",    active: "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",   dot: "bg-blue-500"   },
              MEDIUM: { label: locale === "uk" ? "Середній" : "Medium", active: "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300", dot: "bg-amber-500" },
              HIGH:   { label: locale === "uk" ? "Високий" : "High",   active: "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",     dot: "bg-rose-500"   },
            }[p];
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                  "text-xs font-semibold border-2 transition-all duration-150 cursor-pointer",
                  active ? cfg.active : "border-border text-muted-foreground hover:border-slate-400"
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full inline-block", active ? cfg.dot : "bg-muted-foreground/40")} />
                {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status — edit mode only */}
      {mode === "edit" && (
        <div>
          <FieldLabel>{t("status")}</FieldLabel>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Select status">
            {USER_SETTABLE_STATUSES.map((s) => {
              const style = STATUS_STYLES[s];
              const isActive = status === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  aria-pressed={isActive}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                    "text-xs font-semibold border-2 transition-all duration-150 cursor-pointer",
                    isActive ? style.active : style.inactive
                  )}
                >
                  <span
                    className={cn("h-1.5 w-1.5 rounded-full inline-block", style.dot)}
                  />
                  {style.label(t)}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{t("overdueAuto")}</p>
        </div>
      )}

      {/* Creator name — hidden when logged in */}
      {!user && (
        <div>
          <FieldLabel required htmlFor="form-creator">
            {t("yourName")}
          </FieldLabel>
          <input
            id="form-creator"
            type="text"
            value={creatorName}
            onChange={(e) => setCreatorName(e.target.value)}
            placeholder={t("yourNamePlaceholder")}
            maxLength={100}
            aria-required="true"
            aria-invalid={!!errors.creator_name}
            aria-describedby={errors.creator_name ? "creator-error" : undefined}
            className={cn(
              inputBase,
              errors.creator_name
                ? "border-rose-400 focus:ring-rose-400/40 focus:border-rose-400"
                : "border-input"
            )}
          />
          <FieldError message={errors.creator_name} id="creator-error" />
        </div>
      )}

      {/* API-level error */}
      {apiError && (
        <div
          className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-500/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-fade-in"
          role="alert"
        >
          <svg
            className="h-4 w-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          {apiError}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold",
            "bg-indigo-600 text-white hover:bg-indigo-700",
            "shadow-sm hover:shadow-md hover:-translate-y-0.5",
            "transition-all duration-200 cursor-pointer",
            "disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
          )}
        >
          {submitting && (
            <Spinner size="sm" className="border-white/40 border-t-white" />
          )}
          {mode === "create" ? t("createItemBtn") : t("saveChanges")}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={submitting}
          className={cn(
            "inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-medium",
            "border border-border text-foreground hover:bg-muted/60",
            "transition-all duration-200 cursor-pointer",
            "disabled:opacity-60"
          )}
        >
          {t("cancelBtn")}
        </button>
      </div>
    </form>
    </>
  );
}
