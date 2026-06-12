"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SearchScope = "ALL" | "DOCUMENTS" | "PL" | "WORK" | "CASES";

export interface SavedSearch {
  q: string;
  scope: SearchScope;
  label: string;
}

interface SearchState {
  // Recent searches
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  removeRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;

  // Saved searches
  savedSearches: SavedSearch[];
  addSavedSearch: (entry: SavedSearch) => void;
  removeSavedSearch: (index: number) => void;

  // Scope
  scope: SearchScope;
  setScope: (scope: SearchScope) => void;

  // Input focus state
  inputFocused: boolean;
  setInputFocused: (focused: boolean) => void;

  // Filters
  dateFilter: string;
  setDateFilter: (filter: string) => void;
  statusFilters: Set<string>;
  setStatusFilters: (filters: Set<string>) => void;
  entityFilters: Set<string>;
  setEntityFilters: (filters: Set<string>) => void;
  duplicateFilter: string;
  setDuplicateFilter: (filter: string) => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      // Recent searches
      recentSearches: [],
      addRecentSearch: (query: string) =>
        set((state) => {
          const filtered = state.recentSearches.filter((s) => s !== query);
          return { recentSearches: [query, ...filtered].slice(0, 10) };
        }),
      removeRecentSearch: (query: string) =>
        set((state) => ({
          recentSearches: state.recentSearches.filter((s) => s !== query),
        })),
      clearRecentSearches: () => set({ recentSearches: [] }),

      // Saved searches
      savedSearches: [],
      addSavedSearch: (entry: SavedSearch) =>
        set((state) => ({
          savedSearches: [entry, ...state.savedSearches],
        })),
      removeSavedSearch: (index: number) =>
        set((state) => ({
          savedSearches: state.savedSearches.filter((_, i) => i !== index),
        })),

      // Scope
      scope: "ALL",
      setScope: (scope: SearchScope) => set({ scope }),

      // Input focus state
      inputFocused: false,
      setInputFocused: (focused: boolean) => set({ inputFocused: focused }),

      // Filters
      dateFilter: "any",
      setDateFilter: (filter: string) => set({ dateFilter: filter }),
      statusFilters: new Set<string>(),
      setStatusFilters: (filters: Set<string>) => set({ statusFilters: filters }),
      entityFilters: new Set<string>(),
      setEntityFilters: (filters: Set<string>) => set({ entityFilters: filters }),
      duplicateFilter: "include",
      setDuplicateFilter: (filter: string) => set({ duplicateFilter: filter }),
    }),
    {
      name: "search-history",
      partialize: (state) => ({
        recentSearches: state.recentSearches,
        savedSearches: state.savedSearches,
      }),
    },
  ),
);
