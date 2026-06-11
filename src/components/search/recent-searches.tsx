"use client";

import { Clock, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSearchStore } from "@/stores/search-store";

interface RecentSearchesProps {
  onSelect: (query: string) => void;
  className?: string;
}

export function RecentSearches({ onSelect, className }: RecentSearchesProps) {
  const { recentSearches, removeRecentSearch, clearRecentSearches } = useSearchStore();

  if (recentSearches.length === 0) return null;

  return (
    <div className={cn("", className)}>
      <div className="flex items-center justify-between px-2 mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Recent Searches
        </span>
        <button
          type="button"
          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          onClick={clearRecentSearches}
        >
          <Trash2 className="size-3" />
        </button>
      </div>
      <div className="flex flex-col gap-0.5">
        {recentSearches.slice(0, 10).map((search) => (
          <div key={search} className="flex items-center group">
            <button
              type="button"
              className="flex-1 flex items-center gap-2 rounded-md px-2 py-1 text-xs text-foreground/80 hover:bg-muted transition-colors text-left"
              onClick={() => onSelect(search)}
            >
              <Clock className="size-3 text-muted-foreground shrink-0" />
              <span className="truncate">{search}</span>
            </button>
            <button
              type="button"
              className="opacity-0 group-hover:opacity-100 flex items-center justify-center size-5 rounded hover:bg-muted transition-all"
              onClick={() => removeRecentSearch(search)}
            >
              <X className="size-3 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
