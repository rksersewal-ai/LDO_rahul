/**
 * SearchHistoryService - persists last 20 search queries with rich metadata.
 * Pure TypeScript, no React dependencies.
 * Uses localStorage for persistence (SSR-safe).
 */

const STORAGE_KEY = "search-history-entries";
const MAX_ENTRIES = 20;

export interface SearchHistoryEntry {
  query: string;
  scope: string;
  resultCount: number;
  timestamp: string;
}

export class SearchHistoryService {
  private static instance: SearchHistoryService | null = null;

  private constructor() {}

  static getInstance(): SearchHistoryService {
    if (!SearchHistoryService.instance) {
      SearchHistoryService.instance = new SearchHistoryService();
    }
    return SearchHistoryService.instance;
  }

  private isClient(): boolean {
    return typeof window !== "undefined";
  }

  private load(): SearchHistoryEntry[] {
    if (!this.isClient()) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch {
      return [];
    }
  }

  private save(entries: SearchHistoryEntry[]): void {
    if (!this.isClient()) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // localStorage full or unavailable - silently ignore
    }
  }

  addEntry(entry: SearchHistoryEntry): void {
    const entries = this.load();
    // Deduplicate by query+scope (keep most recent)
    const filtered = entries.filter((e) => !(e.query === entry.query && e.scope === entry.scope));
    filtered.unshift(entry);
    // Keep only the last MAX_ENTRIES
    if (filtered.length > MAX_ENTRIES) {
      filtered.length = MAX_ENTRIES;
    }
    this.save(filtered);
  }

  getEntries(): SearchHistoryEntry[] {
    return this.load();
  }

  removeEntry(index: number): void {
    const entries = this.load();
    if (index >= 0 && index < entries.length) {
      entries.splice(index, 1);
      this.save(entries);
    }
  }

  clear(): void {
    if (!this.isClient()) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // silently ignore
    }
  }
}
