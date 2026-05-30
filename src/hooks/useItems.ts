"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import {
  getItems,
  deleteItem,
  updateItemStatus,
  type GetItemsParams,
} from "@/lib/api-client";
import type { StatusItem } from "@/lib/types";

type Status = "TO_CHECK" | "EXPIRED" | "DONE" | "NOT_ACTUAL" | "IDEAS_BACKLOG";

interface UseItemsOptions {
  month: Date;
  statuses: Status[];
}

interface UseItemsReturn {
  items: StatusItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  silentRefresh: () => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  changeStatus: (id: string, status: Status) => Promise<void>;
  addItemOptimistic: (item: StatusItem) => void;
}

export function useItems({ month, statuses }: UseItemsOptions): UseItemsReturn {
  const [items, setItems] = useState<StatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchItems = useCallback(async () => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    const params: GetItemsParams = {
      month: format(month, "yyyy-MM"),
    };
    if (statuses.length > 0) {
      params.status = statuses.join(",");
    }

    try {
      const data = await getItems(params);
      if (!controller.signal.aborted) {
        setItems(data);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : "Failed to load items");
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [month, statuses]);

  useEffect(() => {
    fetchItems();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchItems]);

  // Optimistic delete
  const removeItem = useCallback(async (id: string) => {
    const snapshot = items;
    setItems((prev) => prev.filter((item) => item.id !== id));
    try {
      await deleteItem(id);
    } catch (err) {
      // Rollback
      setItems(snapshot);
      throw err;
    }
  }, [items]);

  // Optimistic status change
  const changeStatus = useCallback(
    async (id: string, status: Status) => {
      const snapshot = items;
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item))
      );
      try {
        const updated = await updateItemStatus(id, status);
        setItems((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );
      } catch (err) {
        setItems(snapshot);
        throw err;
      }
    },
    [items]
  );

  // Re-fetch without showing loading state (preserves scroll position)
  const silentRefresh = useCallback(async () => {
    const params: GetItemsParams = { month: format(month, "yyyy-MM") };
    if (statuses.length > 0) params.status = statuses.join(",");
    try {
      const data = await getItems(params);
      setItems(data);
    } catch {}
  }, [month, statuses]);

  // Prepend a newly created item (optimistic add)
  const addItemOptimistic = useCallback((item: StatusItem) => {
    setItems((prev) => {
      // Insert in deadline-ascending order
      const newList = [...prev, item];
      return newList.sort(
        (a, b) => (a.deadline ? new Date(a.deadline).getTime() : Infinity) - (b.deadline ? new Date(b.deadline).getTime() : Infinity)
      );
    });
  }, []);

  return {
    items,
    loading,
    error,
    refresh: fetchItems,
    silentRefresh,
    removeItem,
    changeStatus,
    addItemOptimistic,
  };
}
