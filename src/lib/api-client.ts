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
}

export async function getItems(params?: GetItemsParams): Promise<StatusItem[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.month) qs.set("month", params.month);
  const query = qs.toString();
  return apiFetch<StatusItem[]>(`/api/items${query ? `?${query}` : ""}`);
}

export interface CreateItemPayload {
  title: string;
  description?: string;
  deadline: string; // ISO 8601
  creator_name: string;
}

export async function createItem(payload: CreateItemPayload): Promise<StatusItem> {
  return apiFetch<StatusItem>("/api/items", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface UpdateItemPayload {
  title?: string;
  description?: string | null;
  deadline?: string; // ISO 8601
  creator_name?: string;
  status?: "PENDING" | "IN_PROGRESS" | "DONE" | "OVERDUE";
}

export async function updateItem(id: string, payload: UpdateItemPayload): Promise<StatusItem> {
  return apiFetch<StatusItem>(`/api/items/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updateItemStatus(
  id: string,
  status: "PENDING" | "IN_PROGRESS" | "DONE"
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
// AI / NL parse
// ---------------------------------------------------------------------------

export interface ParseTextResult {
  title: string;
  deadline?: string; // ISO 8601 UTC string, present only when a date was found
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
