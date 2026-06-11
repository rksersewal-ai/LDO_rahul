"use client";

import { ClipboardList, Cpu, FileText, FolderTree, LayoutDashboard, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useSuggest } from "@/hooks/use-search";
import { useSearchStore } from "@/stores/search-store";

const quickNavItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "PL Knowledge Hub", href: "/pl", icon: Cpu },
  { label: "Work Ledger", href: "/ledger", icon: ClipboardList },
  { label: "BOM Explorer", href: "/bom", icon: FolderTree },
  { label: "Search Explorer", href: "/search", icon: Search },
];

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  document: FileText,
  pl: Cpu,
  work_record: ClipboardList,
  case: FileText,
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { recentSearches, addRecentSearch } = useSearchStore();
  const { data: suggestions } = useSuggest(query, open);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = useCallback(
    (value: string) => {
      setOpen(false);
      setQuery("");
      router.push(value);
    },
    [router],
  );

  const handleSearchSubmit = useCallback(() => {
    if (query.length >= 2) {
      addRecentSearch(query);
      setOpen(false);
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setQuery("");
    }
  }, [query, router, addRecentSearch]);

  const handleRecentSelect = useCallback(
    (search: string) => {
      setOpen(false);
      setQuery("");
      router.push(`/search?q=${encodeURIComponent(search)}`);
    },
    [router],
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command className="rounded-xl" shouldFilter={false}>
        <CommandInput
          placeholder="Search documents, PL numbers, work records..."
          value={query}
          onValueChange={setQuery}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !suggestions?.length) {
              handleSearchSubmit();
            }
          }}
        />
        <CommandList>
          <CommandEmpty>
            {query.length >= 2 ? (
              <div className="flex flex-col items-center gap-1">
                <span className="text-muted-foreground">No results found</span>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={handleSearchSubmit}
                >
                  Search for &quot;{query}&quot; in Search Explorer
                </button>
              </div>
            ) : (
              <span className="text-muted-foreground">Type at least 2 characters to search</span>
            )}
          </CommandEmpty>

          {/* Live Search Results */}
          {suggestions && suggestions.length > 0 && (
            <CommandGroup heading="Results">
              {suggestions.map((suggestion) => {
                const Icon = typeIcons[suggestion.type] || FileText;
                return (
                  <CommandItem key={suggestion.id} value={suggestion.url} onSelect={handleSelect}>
                    <Icon className="size-4 text-muted-foreground" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm truncate">{suggestion.title}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {suggestion.subtitle}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
              {query.length >= 2 && (
                <CommandItem
                  value={`/search?q=${encodeURIComponent(query)}`}
                  onSelect={handleSelect}
                >
                  <Search className="size-4 text-muted-foreground" />
                  <span className="text-sm">View all results for &quot;{query}&quot;</span>
                </CommandItem>
              )}
            </CommandGroup>
          )}

          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <>
              <CommandGroup heading="Recent Searches">
                {recentSearches.slice(0, 5).map((search) => (
                  <CommandItem
                    key={search}
                    value={`recent-${search}`}
                    onSelect={() => handleRecentSelect(search)}
                  >
                    <Search className="size-4 text-muted-foreground" />
                    <span className="text-sm">{search}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Quick Navigation */}
          {!query && (
            <CommandGroup heading="Quick Navigation">
              {quickNavItems.map((item) => (
                <CommandItem key={item.href} value={item.href} onSelect={handleSelect}>
                  <item.icon className="size-4 text-muted-foreground" />
                  <span className="text-sm">{item.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
