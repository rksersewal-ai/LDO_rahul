"use client";

import { useCallback, useMemo, useState } from "react";
import { type SearchHistoryEntry, SearchHistoryService } from "@/lib/services/search-history";

/**
 * Hook wrapping SearchHistoryService.
 * Returns { entries, addEntry, removeEntry, clear }.
 * Uses useState to trigger re-renders on changes.
 */
export function useSearchHistory() {
  const service = useMemo(() => SearchHistoryService.getInstance(), []);
  const [entries, setEntries] = useState<SearchHistoryEntry[]>(() => service.getEntries());

  const addEntry = useCallback(
    (entry: SearchHistoryEntry) => {
      service.addEntry(entry);
      setEntries(service.getEntries());
    },
    [service],
  );

  const removeEntry = useCallback(
    (index: number) => {
      service.removeEntry(index);
      setEntries(service.getEntries());
    },
    [service],
  );

  const clear = useCallback(() => {
    service.clear();
    setEntries([]);
  }, [service]);

  return { entries, addEntry, removeEntry, clear };
}
