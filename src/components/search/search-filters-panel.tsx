"use client";

import { cn } from "@/lib/utils";
import { useSearchStore } from "@/stores/search-store";

const STATUS_OPTIONS = ["Approved", "In Progress", "Draft", "Verified", "Closed", "Obsolete"];
const ENTITY_OPTIONS = [
  { label: "Document", value: "document" },
  { label: "PL", value: "pl" },
  { label: "Work", value: "work_record" },
  { label: "Case", value: "case" },
];

const DATE_OPTIONS = [
  { label: "Any time", value: "any" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "Last year", value: "1yr" },
];

const SOURCE_OPTIONS = ["Internal", "External", "Legacy", "Imported"];
const CATEGORY_OPTIONS = ["Technical", "Administrative", "Safety", "Quality", "Maintenance"];

interface SearchFiltersPanelProps {
  className?: string;
  statusCounts?: Record<string, number>;
}

export function SearchFiltersPanel({ className, statusCounts }: SearchFiltersPanelProps) {
  const {
    dateFilter,
    setDateFilter,
    statusFilters,
    setStatusFilters,
    entityFilters,
    setEntityFilters,
    duplicateFilter,
    setDuplicateFilter,
    sourceFilter,
    setSourceFilter,
    categoryFilter,
    setCategoryFilter,
  } = useSearchStore();

  const toggleStatus = (status: string) => {
    const next = new Set(statusFilters);
    if (next.has(status)) {
      next.delete(status);
    } else {
      next.add(status);
    }
    setStatusFilters(next);
  };

  const toggleEntity = (entity: string) => {
    const next = new Set(entityFilters);
    if (next.has(entity)) {
      next.delete(entity);
    } else {
      next.add(entity);
    }
    setEntityFilters(next);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Date Range */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
          Date Range
        </p>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className={cn(
            "w-full h-8 px-2 text-xs rounded-md border bg-background appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/30",
            dateFilter !== "any" ? "border-primary/40 text-primary" : "border-border/60",
          )}
        >
          {DATE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Status Facets */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
          Status
        </p>
        <div className="space-y-1">
          {STATUS_OPTIONS.map((status) => (
            <label
              key={status}
              className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-muted/50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={statusFilters.has(status)}
                onChange={() => toggleStatus(status)}
                className="size-3.5 rounded border-border accent-primary"
              />
              <span className="text-xs text-foreground/80 flex-1">{status}</span>
              {statusCounts && statusCounts[status] !== undefined && (
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {statusCounts[status]}
                </span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Entity Type Pills */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
          Entity Type
        </p>
        <div className="flex flex-wrap gap-1.5">
          {ENTITY_OPTIONS.map((entity) => (
            <button
              key={entity.value}
              type="button"
              onClick={() => toggleEntity(entity.value)}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors",
                entityFilters.has(entity.value)
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              {entity.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duplicate Filter */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
          Duplicates
        </p>
        <select
          value={duplicateFilter}
          onChange={(e) => setDuplicateFilter(e.target.value)}
          className={cn(
            "w-full h-8 px-2 text-xs rounded-md border bg-background appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/30",
            duplicateFilter !== "include" ? "border-primary/40 text-primary" : "border-border/60",
          )}
        >
          <option value="include">Include all</option>
          <option value="exclude">Exclude duplicates</option>
          <option value="only">Duplicates only</option>
        </select>
      </div>

      {/* Source Filter */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
          Source
        </p>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className={cn(
            "w-full h-8 px-2 text-xs rounded-md border bg-background appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/30",
            sourceFilter ? "border-primary/40 text-primary" : "border-border/60",
          )}
        >
          <option value="">All sources</option>
          {SOURCE_OPTIONS.map((src) => (
            <option key={src} value={src}>
              {src}
            </option>
          ))}
        </select>
      </div>

      {/* Category Filter */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
          Category
        </p>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={cn(
            "w-full h-8 px-2 text-xs rounded-md border bg-background appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/30",
            categoryFilter ? "border-primary/40 text-primary" : "border-border/60",
          )}
        >
          <option value="">All categories</option>
          {CATEGORY_OPTIONS.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
