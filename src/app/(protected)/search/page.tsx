"use client";

import { ArrowDownAZ, ArrowUpDown, Calendar, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { RecentSearches } from "@/components/search/recent-searches";
import { SearchFacetsSidebar } from "@/components/search/search-facets";
import { SearchResultCard } from "@/components/search/search-result-card";
import { Badge } from "@/components/ui/badge";
import { useSearch } from "@/hooks/use-search";
import { cn } from "@/lib/utils";
import type { EntityType } from "@/lib/validators/search";

const entityTabs: Array<{ label: string; value: EntityType }> = [
  { label: "All", value: "all" },
  { label: "Documents", value: "document" },
  { label: "PL Numbers", value: "pl" },
  { label: "Work Records", value: "work_record" },
];

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [activeTab, setActiveTab] = useState<EntityType>("all");
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
  } = useSearch({ entityType: activeTab, limit: 20 });

  // Initialize from URL param
  useEffect(() => {
    if (initialQuery && !query) {
      setQuery(initialQuery);
      search(initialQuery);
    }
  }, [initialQuery, query, setQuery, search]);

  const totalResults = results?.total || 0;
  const pageSize = 20;
  const currentPage = Math.floor(offset / pageSize) + 1;
  const totalPages = Math.ceil(totalResults / pageSize);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Search Header */}
      <div className="flex flex-col gap-3">
        <h1 className="text-lg font-bold">Search Explorer</h1>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.length >= 2) {
                search(e.target.value);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.length >= 2) {
                search(query);
              }
            }}
            placeholder="Search across documents, PL numbers, work records, and cases..."
            className={cn(
              "w-full h-10 pl-10 pr-4 rounded-lg border bg-background text-sm",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
            )}
          />
        </div>

        {/* Entity Type Tabs */}
        <div className="flex items-center gap-1 border-b">
          {entityTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={cn(
                "px-3 py-1.5 text-xs font-medium border-b-2 transition-colors -mb-px",
                activeTab === tab.value
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30",
              )}
              onClick={() => {
                setActiveTab(tab.value);
                setOffset(0);
              }}
            >
              {tab.label}
              {facets?.entityTypes.find((e) => e.value === tab.value) && (
                <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1">
                  {facets.entityTypes.find((e) => e.value === tab.value)?.count}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex gap-4">
        {/* Faceted Sidebar */}
        <div className="w-48 shrink-0 hidden lg:block">
          {query.length >= 2 ? (
            <SearchFacetsSidebar
              facets={facets}
              activeCategory={filters.category}
              activeStatus={filters.status}
              onCategoryChange={(category) => setFilters((prev) => ({ ...prev, category }))}
              onStatusChange={(status) => setFilters((prev) => ({ ...prev, status }))}
            />
          ) : (
            <RecentSearches onSelect={search} />
          )}
        </div>

        {/* Results Area */}
        <div className="flex-1 min-w-0">
          {/* Sort & Meta */}
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
                    sortBy === "relevance" ? "bg-muted font-medium" : "hover:bg-muted",
                  )}
                  onClick={() => setSortBy("relevance")}
                >
                  <ArrowUpDown className="size-3" />
                  Relevance
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors",
                    sortBy === "date" ? "bg-muted font-medium" : "hover:bg-muted",
                  )}
                  onClick={() => setSortBy("date")}
                >
                  <Calendar className="size-3" />
                  Date
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors",
                    sortBy === "name" ? "bg-muted font-medium" : "hover:bg-muted",
                  )}
                  onClick={() => setSortBy("name")}
                >
                  <ArrowDownAZ className="size-3" />
                  Name
                </button>
                <button
                  type="button"
                  className="px-2 py-1 rounded text-xs hover:bg-muted transition-colors text-muted-foreground"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                >
                  {sortOrder === "asc" ? "ASC" : "DESC"}
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
                  Ctrl+K
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
