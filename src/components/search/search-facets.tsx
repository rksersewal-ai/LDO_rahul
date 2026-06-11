"use client";

import { cn } from "@/lib/utils";
import type { SearchFacets } from "@/lib/validators/search";

interface SearchFacetsProps {
  facets: SearchFacets | undefined;
  activeCategory?: string;
  activeStatus?: string;
  onCategoryChange: (category: string | undefined) => void;
  onStatusChange: (status: string | undefined) => void;
  className?: string;
}

function FacetSection({
  title,
  items,
  activeValue,
  onSelect,
}: {
  title: string;
  items: Array<{ label: string; value: string; count: number }>;
  activeValue?: string;
  onSelect: (value: string | undefined) => void;
}) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mb-4">
      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 px-1">
        {title}
      </h4>
      <div className="flex flex-col gap-0.5">
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            className={cn(
              "flex items-center justify-between rounded-md px-2 py-1 text-xs transition-colors",
              activeValue === item.value
                ? "bg-primary/10 text-primary font-medium"
                : "text-foreground/80 hover:bg-muted",
            )}
            onClick={() => onSelect(activeValue === item.value ? undefined : item.value)}
          >
            <span className="truncate">{item.label}</span>
            <span className="ml-2 text-[10px] text-muted-foreground tabular-nums">
              {item.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function SearchFacetsSidebar({
  facets,
  activeCategory,
  activeStatus,
  onCategoryChange,
  onStatusChange,
  className,
}: SearchFacetsProps) {
  if (!facets) return null;

  const hasActiveFilters = activeCategory || activeStatus;

  return (
    <aside className={cn("w-full", className)}>
      {hasActiveFilters && (
        <button
          type="button"
          className="mb-3 text-[10px] font-medium text-primary hover:underline"
          onClick={() => {
            onCategoryChange(undefined);
            onStatusChange(undefined);
          }}
        >
          Clear all filters
        </button>
      )}

      <FacetSection
        title="Entity Type"
        items={facets.entityTypes}
        activeValue={undefined}
        onSelect={() => {}}
      />

      <FacetSection
        title="Category"
        items={facets.categories}
        activeValue={activeCategory}
        onSelect={onCategoryChange}
      />

      <FacetSection
        title="Status"
        items={facets.statuses}
        activeValue={activeStatus}
        onSelect={onStatusChange}
      />
    </aside>
  );
}
