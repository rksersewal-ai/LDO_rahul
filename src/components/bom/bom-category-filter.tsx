"use client";

import type { BomProductCategory } from "@/lib/mock-data/bom";
import { cn } from "@/lib/utils";

interface BomCategoryFilterProps {
  categories: BomProductCategory[];
  activeCategory: BomProductCategory | "all";
  onCategoryChange: (category: BomProductCategory | "all") => void;
}

export function BomCategoryFilter({
  categories,
  activeCategory,
  onCategoryChange,
}: BomCategoryFilterProps) {
  const uniqueCategories = [...new Set(categories)];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={() => onCategoryChange("all")}
        className={cn(
          "inline-flex items-center rounded-full px-3 py-1 text-[var(--text-xs)] font-medium border transition-colors duration-150",
          activeCategory === "all"
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground",
        )}
      >
        All
      </button>
      {uniqueCategories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onCategoryChange(category)}
          className={cn(
            "inline-flex items-center rounded-full px-3 py-1 text-[var(--text-xs)] font-medium border capitalize transition-colors duration-150",
            activeCategory === category
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground",
          )}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
