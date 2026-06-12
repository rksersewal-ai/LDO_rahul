"use client";

import {
  ArrowDown,
  ArrowDownAZ,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Bookmark,
  BookmarkCheck,
  Calendar,
  Clock,
  Command,
  FileText,
  Filter,
  Search,
  Sparkles,
  Trash2,
  Type,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { SearchFiltersPanel } from "@/components/search/search-filters-panel";
import { SearchMetricCard } from "@/components/search/search-metric-card";
import { SearchResultCard } from "@/components/search/search-result-card";
import { Badge } from "@/components/ui/badge";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import { useSearch } from "@/hooks/use-search";
import { useSearchHistory } from "@/hooks/use-search-history";
import { cn } from "@/lib/utils";
import type { EntityType } from "@/lib/validators/search";
import { type SearchScope, type SortField, useSearchStore } from "@/stores/search-store";

const SCOPE_OPTIONS: Array<{ label: string; scope: SearchScope; entityType: EntityType }> = [
  { label: "All", scope: "ALL", entityType: "all" },
  { label: "Documents", scope: "DOCUMENTS", entityType: "document" },
  { label: "PL", scope: "PL", entityType: "pl" },
  { label: "Work", scope: "WORK", entityType: "work_record" },
  { label: "Cases", scope: "CASES", entityType: "case" },
];

const EXAMPLE_QUERIES = [
  "traction motor insulation",
  "WAP7 bogie frame",
  "38110000",
  "pantograph DSA380",
];

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const {
    scope,
    setScope,
    inputFocused,
    setInputFocused,
    savedSearches,
    addSavedSearch,
    removeSavedSearch,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    showFilters,
    setShowFilters,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
  } = useSearchStore();

  const { addEntry: addHistoryEntry } = useSearchHistory();

  // Track the last submitted query so we can record history after results arrive
  const [pendingHistoryQuery, setPendingHistoryQuery] = useState<{
    query: string;
    scope: SearchScope;
  } | null>(null);

  const searchAnalyticsEnabled = useFeatureFlag("search_analytics");

  const activeEntityType = SCOPE_OPTIONS.find((s) => s.scope === scope)?.entityType ?? "all";

  const {
    query,
    setQuery,
    results,
    facets,
    isLoading,
    search,
    offset,
    setOffset,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filters,
    setFilters,
  } = useSearch({ entityType: activeEntityType, limit: 20 });

  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Record search history after results arrive
  useEffect(() => {
    if (pendingHistoryQuery && !isLoading && results) {
      addHistoryEntry({
        query: pendingHistoryQuery.query,
        scope: pendingHistoryQuery.scope,
        resultCount: results.total ?? 0,
        timestamp: new Date().toISOString(),
      });
      setPendingHistoryQuery(null);
    }
  }, [pendingHistoryQuery, isLoading, results, addHistoryEntry]);

  // Initialize from URL param
  useEffect(() => {
    if (initialQuery && !query) {
      setQuery(initialQuery);
      search(initialQuery);
    }
  }, [initialQuery, query, setQuery, search]);

  // URL sync: update ?q= param when query changes
  const syncUrlRef = useRef(false);
  useEffect(() => {
    if (syncUrlRef.current) {
      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) {
        params.set("q", query.trim());
      } else {
        params.delete("q");
      }
      const newUrl = `?${params.toString()}`;
      window.history.replaceState(null, "", newUrl);
    } else {
      syncUrlRef.current = true;
    }
  }, [query, searchParams]);

  // AbortController: abort pending search on navigation
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  // Abort on scope change
  const handleScopeChange = useCallback(
    (newScope: SearchScope) => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();
      setScope(newScope);
      setOffset(0);
    },
    [setScope, setOffset],
  );

  // Debounced input handler
  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();
      debounceRef.current = setTimeout(() => {
        if (value.length >= 2) {
          search(value);
        }
      }, 300);
    },
    [setQuery, search],
  );

  // Cmd+K keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const isSaved = savedSearches.some((s) => s.q === query && s.scope === scope);

  const handleSaveSearch = () => {
    if (!query.trim() || isSaved) return;
    const scopeLabel = SCOPE_OPTIONS.find((s) => s.scope === scope)?.label ?? "All";
    addSavedSearch({
      q: query.trim(),
      scope,
      label: `${query.trim()}${scope !== "ALL" ? ` (${scopeLabel})` : ""}`,
    });
  };

  const handleSelectSaved = (entry: { q: string; scope: SearchScope }) => {
    setQuery(entry.q);
    setScope(entry.scope);
    search(entry.q);
    setInputFocused(false);
  };

  const handleSelectRecent = (q: string) => {
    setQuery(q);
    search(q);
    setInputFocused(false);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    // Also sync with the useSearch hook
    if (field === "relevance" || field === "date") {
      setSortBy(field);
    } else if (field === "title") {
      setSortBy("name");
    }
    setSortOrder(sortDirection === "asc" ? "desc" : "asc");
  };

  const totalResults = results?.total || 0;
  const pageSize = 20;
  const currentPage = Math.floor(offset / pageSize) + 1;
  const totalPages = Math.ceil(totalResults / pageSize);

  // Scope counts from facets
  const scopeCounts: Record<SearchScope, number | undefined> = {
    ALL: facets?.entityTypes.reduce((acc, e) => acc + e.count, 0),
    DOCUMENTS: facets?.entityTypes.find((e) => e.value === "document")?.count,
    PL: facets?.entityTypes.find((e) => e.value === "pl")?.count,
    WORK: facets?.entityTypes.find((e) => e.value === "work_record")?.count,
    CASES: facets?.entityTypes.find((e) => e.value === "case")?.count,
  };

  // Placeholder status counts from facets
  const [statusCounts] = useState<Record<string, number>>({
    Approved: 12,
    "In Progress": 8,
    Draft: 5,
    Verified: 3,
    Closed: 7,
    Obsolete: 2,
  });

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-md bg-accent border border-border">
          <Sparkles className="size-4 text-primary" />
        </div>
        <h1 className="text-lg font-bold">Search Explorer</h1>
      </div>

      {/* Bento Metrics Strip - gated behind search_analytics feature flag */}
      {searchAnalyticsEnabled ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SearchMetricCard label="Indexed domains" value="4" hint="Documents, PL, work, cases" />
          <SearchMetricCard
            label="Saved playbooks"
            value={String(savedSearches.length)}
            hint="Reusable operator queries"
          />
          <SearchMetricCard
            label="Recent queries"
            value={String(recentSearches.length)}
            hint="Session query recall"
          />
          <SearchMetricCard
            label="Search focus"
            value={totalResults > 0 ? String(totalResults) : "Ready"}
            hint={totalResults > 0 ? "Results in current view" : "Waiting for query"}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Search Analytics coming soon. This feature is currently disabled.
          </p>
        </div>
      )}

      {/* Search Input with Cmd+K hint and bookmark action */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none z-10" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setTimeout(() => setInputFocused(false), 200)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.length >= 2) {
                search(query);
                addRecentSearch(query);
                setPendingHistoryQuery({
                  query: query.trim(),
                  scope,
                });
              }
            }}
            placeholder="Search across documents, PL numbers, work records, and cases..."
            className={cn(
              "w-full h-10 pl-10 pr-24 rounded-lg border bg-background text-sm",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
            )}
          />
          {/* Bookmark button */}
          <button
            type="button"
            onClick={handleSaveSearch}
            disabled={!query.trim() || isSaved}
            className={cn(
              "absolute right-14 top-1/2 -translate-y-1/2 flex items-center justify-center size-6 rounded transition-colors",
              isSaved ? "text-primary" : "text-muted-foreground hover:text-foreground",
              (!query.trim() || isSaved) && "opacity-50 cursor-not-allowed",
            )}
            title={isSaved ? "Search saved" : "Save this search"}
          >
            {isSaved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
          </button>
          {/* Cmd+K badge */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-muted-foreground text-[10px] border border-border rounded px-1.5 py-0.5 pointer-events-none">
            <Command className="size-2.5" />K
          </div>

          {/* Saved & Recent Searches Dropdown */}
          {inputFocused && (savedSearches.length > 0 || recentSearches.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card/95 backdrop-blur-xl border border-border/50 rounded-md shadow-2xl overflow-hidden">
              {savedSearches.length > 0 && (
                <div className="p-2">
                  <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Saved
                  </p>
                  {savedSearches.slice(0, 5).map((s, i) => (
                    <div
                      key={`saved-${s.q}-${s.scope}`}
                      className="flex items-center gap-2 rounded-lg hover:bg-muted group transition-colors"
                    >
                      <button
                        type="button"
                        onMouseDown={() => handleSelectSaved(s)}
                        className="flex-1 flex items-center gap-2 px-2 py-2 text-left"
                      >
                        <BookmarkCheck className="size-3.5 text-primary shrink-0" />
                        <span className="text-sm text-foreground/90 truncate">{s.label}</span>
                      </button>
                      <button
                        type="button"
                        onMouseDown={() => removeSavedSearch(i)}
                        className="mr-2 size-5 flex items-center justify-center text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {recentSearches.length > 0 && (
                <div className={cn("p-2", savedSearches.length > 0 && "border-t border-border")}>
                  <div className="flex items-center justify-between px-2 py-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Recent
                    </p>
                    <button
                      type="button"
                      onMouseDown={clearRecentSearches}
                      className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                  {recentSearches.slice(0, 5).map((s) => (
                    <div
                      key={`recent-${s}`}
                      className="flex items-center gap-2 rounded-lg hover:bg-muted group transition-colors"
                    >
                      <button
                        type="button"
                        onMouseDown={() => handleSelectRecent(s)}
                        className="flex-1 flex items-center gap-2 px-2 py-2 text-left"
                      >
                        <Clock className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm text-muted-foreground">{s}</span>
                      </button>
                      <button
                        type="button"
                        onMouseDown={() => removeRecentSearch(s)}
                        className="mr-2 size-5 flex items-center justify-center text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scope Tabs with count badges */}
        <div className="flex items-center gap-1 border-b">
          {SCOPE_OPTIONS.map((tab) => (
            <button
              key={tab.scope}
              type="button"
              className={cn(
                "px-3 py-1.5 text-xs font-medium border-b-2 transition-colors -mb-px",
                scope === tab.scope
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30",
              )}
              onClick={() => handleScopeChange(tab.scope)}
            >
              {tab.label}
              {scopeCounts[tab.scope] !== undefined && scopeCounts[tab.scope] !== 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1">
                  {scopeCounts[tab.scope]}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Example Queries / Quick Actions Row */}
      <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-xl p-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
            onClick={() => {
              const example = EXAMPLE_QUERIES[Math.floor(Math.random() * EXAMPLE_QUERIES.length)];
              handleInputChange(example);
              search(example);
            }}
          >
            <Sparkles className="size-3.5" />
            Run Example Search
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-secondary/50 px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
            onClick={() => {
              handleScopeChange("DOCUMENTS");
              inputRef.current?.focus();
            }}
          >
            <FileText className="size-3.5" />
            Document-Only Mode
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-secondary/50 px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
            onClick={() => router.push("/documents")}
          >
            <ArrowRight className="size-3.5" />
            Open Document Hub
          </button>
          {/* Filter toggle button */}
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
              showFilters
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border/50 bg-secondary/50 text-foreground hover:bg-secondary",
            )}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="size-3.5" />
            Filters
          </button>
          {(query || scope !== "ALL") && (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={() => {
                setQuery("");
                setScope("ALL");
                setFilters({});
                search("");
              }}
            >
              <X className="size-3.5" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex gap-4">
        {/* Collapsible Filters Panel */}
        {showFilters && (
          <div className="w-52 shrink-0 hidden lg:block">
            <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold">Filters</p>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="size-5 flex items-center justify-center rounded hover:bg-muted"
                >
                  <X className="size-3" />
                </button>
              </div>
              <SearchFiltersPanel statusCounts={statusCounts} />
            </div>
          </div>
        )}

        {/* Results Area */}
        <div className="flex-1 min-w-0">
          {/* Sort Controls Row */}
          {results && results.total > 0 && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">
                {results.total} result{results.total !== 1 ? "s" : ""} found
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors",
                    sortField === "relevance" ? "bg-muted font-medium" : "hover:bg-muted",
                  )}
                  onClick={() => handleSort("relevance")}
                >
                  <ArrowUpDown className="size-3" />
                  Relevance
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors",
                    sortField === "date" ? "bg-muted font-medium" : "hover:bg-muted",
                  )}
                  onClick={() => handleSort("date")}
                >
                  <Calendar className="size-3" />
                  Date
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors",
                    sortField === "title" ? "bg-muted font-medium" : "hover:bg-muted",
                  )}
                  onClick={() => handleSort("title")}
                >
                  <ArrowDownAZ className="size-3" />
                  Title
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors",
                    sortField === "type" ? "bg-muted font-medium" : "hover:bg-muted",
                  )}
                  onClick={() => handleSort("type")}
                >
                  <Type className="size-3" />
                  Type
                </button>
                {/* Direction toggle */}
                <button
                  type="button"
                  className="px-2 py-1 rounded text-xs hover:bg-muted transition-colors text-muted-foreground"
                  onClick={() => {
                    const next = sortDirection === "asc" ? "desc" : "asc";
                    setSortDirection(next);
                    setSortOrder(next);
                  }}
                  title={sortDirection === "asc" ? "Ascending" : "Descending"}
                >
                  {sortDirection === "asc" ? (
                    <ArrowUp className="size-3.5" />
                  ) : (
                    <ArrowDown className="size-3.5" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Loading */}
          {isLoading && query.length >= 2 && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="size-4 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
                Searching...
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && query.length >= 2 && results?.total === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium">No results found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try adjusting your search terms or filters
              </p>
            </div>
          )}

          {/* Initial State */}
          {!isLoading && query.length < 2 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium">Search across all entities</p>
              <p className="text-xs text-muted-foreground mt-1">
                Type at least 2 characters to start searching
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Use{" "}
                <kbd className="inline-flex h-4 items-center rounded border bg-muted px-1 text-[10px] font-medium">
                  <Command className="size-2.5 mr-0.5" />K
                </kbd>{" "}
                for quick search
              </p>
            </div>
          )}

          {/* Results List */}
          {results && results.data.length > 0 && (
            <div className="flex flex-col gap-2">
              {results.data.map((result) => (
                <SearchResultCard key={result.id} result={result} query={query} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              <span className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="px-3 py-1 rounded text-xs border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentPage <= 1}
                  onClick={() => setOffset(Math.max(0, offset - pageSize))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="px-3 py-1 rounded text-xs border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentPage >= totalPages}
                  onClick={() => setOffset(offset + pageSize)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="size-4 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
            Loading...
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
