/**
 * Typed browser-side API client.
 * All functions throw on non-2xx responses so callers can catch them.
 * No raw fetch() calls elsewhere in the codebase — import from here.
 */

import type { StatusItem } from "@/lib/types";

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

async function apiFetch<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ?? `Request failed (${res.status})`
    );
  }

  return data as T;
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

export interface GetItemsParams {
  status?: string; // comma-separated Status values
  month?: string;  // YYYY-MM
  cursor?: string;
  take?: number;
}

export interface ItemsPage {
  items: StatusItem[];
  nextCursor: string | null;
}

export async function getItems(params?: GetItemsParams): Promise<ItemsPage> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.month) qs.set("month", params.month);
  if (params?.cursor) qs.set("cursor", params.cursor);
  if (params?.take) qs.set("take", String(params.take));
  const query = qs.toString();
  return apiFetch<ItemsPage>(`/api/items${query ? `?${query}` : ""}`);
}

export type Priority = "LOW" | "MEDIUM" | "HIGH";

export interface CreateItemPayload {
  title: string;
  description?: string;
  deadline?: string | null;
  creator_name: string;
  project?:  string | null;
  assignee?: string | null;
  reviewer?: string | null;
  priority?: Priority;
}

export async function createItem(payload: CreateItemPayload): Promise<StatusItem> {
  return apiFetch<StatusItem>("/api/items", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

type Status = "TO_CHECK" | "EXPIRED" | "DONE" | "NOT_ACTUAL" | "IDEAS_BACKLOG";

export interface UpdateItemPayload {
  title?: string;
  description?: string | null;
  deadline?: string | null;
  creator_name?: string;
  status?: Status;
  project?:  string | null;
  assignee?: string | null;
  reviewer?: string | null;
  priority?: Priority;
}

export async function updateItem(id: string, payload: UpdateItemPayload): Promise<StatusItem> {
  return apiFetch<StatusItem>(`/api/items/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updateItemStatus(
  id: string,
  status: Status
): Promise<StatusItem> {
  return apiFetch<StatusItem>(`/api/items/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteItem(id: string): Promise<void> {
  await apiFetch<{ success: boolean }>(`/api/items/${id}`, { method: "DELETE" });
}

export async function getItemById(id: string): Promise<StatusItem> {
  return apiFetch<StatusItem>(`/api/items/${id}`);
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export type NotificationType = "ASSIGNED_ASSIGNEE" | "ASSIGNED_REVIEWER" | "STATUS_CHANGED" | "DEADLINE_APPROACHING" | "NEW_COMMENT" | "MENTIONED";

export interface Notification {
  id: string;
  type: NotificationType;
  itemId: string;
  itemTitle: string;
  read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export async function getNotifications(): Promise<NotificationsResponse> {
  return apiFetch<NotificationsResponse>("/api/notifications");
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiFetch<{ success: boolean }>(`/api/notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch<{ success: boolean }>("/api/notifications", { method: "PATCH" });
}

// ---------------------------------------------------------------------------
// AI / NL parse
// ---------------------------------------------------------------------------

export interface ParseTextResult {
  title: string;
  deadline?: string;
  project?: string;
  assignee?: string;
  reviewer?: string;
}

/**
 * Send free text to the NL parse endpoint and get back a structured result.
 * @throws Error with `.message` from the server on any non-2xx response.
 */
export async function parseText(text: string): Promise<ParseTextResult> {
  return apiFetch<ParseTextResult>("/api/ai/parse", {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}
