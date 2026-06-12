"use client";

import { useCallback, useMemo, useState } from "react";
import { type SavedFilter, SavedFiltersService } from "@/lib/services/saved-filters";

/**
 * Hook wrapping SavedFiltersService.
 * Accepts a pageKey and returns { filters, save, remove }.
 */
export function useSavedFilters(pageKey: string) {
  const service = useMemo(() => SavedFiltersService.getInstance(), []);
  const [filters, setFilters] = useState<SavedFilter[]>(() => service.getForPage(pageKey));

  const save = useCallback(
    (label: string, filterData: Record<string, unknown>) => {
      service.save(pageKey, label, filterData);
      setFilters(service.getForPage(pageKey));
    },
    [service, pageKey],
  );

  const remove = useCallback(
    (id: string) => {
      service.remove(id);
      setFilters(service.getForPage(pageKey));
    },
    [service, pageKey],
  );

  return { filters, save, remove };
}
