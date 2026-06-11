"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import type { EntityType } from "@/lib/validators/search";
import { useSearchStore } from "@/stores/search-store";

interface UseSearchOptions {
  entityType?: EntityType;
  limit?: number;
  debounceMs?: number;
  minChars?: number;
}

export function useSearch(options: UseSearchOptions = {}) {
  const { entityType = "all", limit = 20, debounceMs = 300, minChars = 2 } = options;

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [sortBy, setSortBy] = useState<"relevance" | "date" | "name">("relevance");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<{
    category?: string;
    status?: string;
  }>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { addRecentSearch } = useSearchStore();

  // Debounce query
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (query.length >= minChars) {
      timerRef.current = setTimeout(() => {
        setDebouncedQuery(query);
      }, debounceMs);
    } else {
      setDebouncedQuery("");
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [query, debounceMs, minChars]);

  const enabled = debouncedQuery.length >= minChars;

  const results = trpc.search.global.useQuery(
    {
      query: debouncedQuery,
      entityType,
      limit,
      offset,
      sortBy,
      sortOrder,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    },
    { enabled },
  );

  const facets = trpc.search.facets.useQuery({ query: debouncedQuery, entityType }, { enabled });

  const suggestions = trpc.search.suggest.useQuery(
    { query: debouncedQuery, limit: 5 },
    { enabled },
  );

  const search = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);
      setOffset(0);
      if (newQuery.length >= minChars) {
        addRecentSearch(newQuery);
      }
    },
    [minChars, addRecentSearch],
  );

  return {
    query,
    setQuery,
    debouncedQuery,
    results: results.data,
    facets: facets.data,
    suggestions: suggestions.data,
    isLoading: results.isLoading || facets.isLoading,
    isSuggestLoading: suggestions.isLoading,
    search,
    offset,
    setOffset,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filters,
    setFilters,
  };
}

export function useSuggest(query: string, enabled = true) {
  const debouncedQuery = useDebouncedValue(query, 300);
  const isReady = debouncedQuery.length >= 2 && enabled;

  return trpc.search.suggest.useQuery({ query: debouncedQuery, limit: 5 }, { enabled: isReady });
}

function useDebouncedValue(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
