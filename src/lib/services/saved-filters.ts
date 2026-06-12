/**
 * SavedFiltersService - persists filter combinations per page key in localStorage.
 * Pure TypeScript, no React dependencies.
 * Uses localStorage for persistence (SSR-safe).
 */

const STORAGE_KEY = "saved-filters";

export interface SavedFilter {
  id: string;
  label: string;
  pageKey: string;
  filters: Record<string, unknown>;
  createdAt: string;
}

function generateId(): string {
  return `sf_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export class SavedFiltersService {
  private static instance: SavedFiltersService | null = null;

  private constructor() {}

  static getInstance(): SavedFiltersService {
    if (!SavedFiltersService.instance) {
      SavedFiltersService.instance = new SavedFiltersService();
    }
    return SavedFiltersService.instance;
  }

  private isClient(): boolean {
    return typeof window !== "undefined";
  }

  private load(): SavedFilter[] {
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

  private saveAll(filters: SavedFilter[]): void {
    if (!this.isClient()) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch {
      // localStorage full or unavailable - silently ignore
    }
  }

  save(pageKey: string, label: string, filters: Record<string, unknown>): SavedFilter {
    const all = this.load();
    const entry: SavedFilter = {
      id: generateId(),
      label,
      pageKey,
      filters,
      createdAt: new Date().toISOString(),
    };
    all.push(entry);
    this.saveAll(all);
    return entry;
  }

  getForPage(pageKey: string): SavedFilter[] {
    return this.load().filter((f) => f.pageKey === pageKey);
  }

  remove(id: string): void {
    const all = this.load();
    const filtered = all.filter((f) => f.id !== id);
    this.saveAll(filtered);
  }

  getAll(): SavedFilter[] {
    return this.load();
  }
}
