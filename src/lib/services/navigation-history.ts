/**
 * NavigationHistoryService - tracks previous paths for back navigation.
 * Pure TypeScript, no React dependencies.
 * Uses localStorage for persistence (SSR-safe).
 */

const STORAGE_KEY = "nav-history";
const MAX_ENTRIES = 50;

export class NavigationHistoryService {
  private static instance: NavigationHistoryService | null = null;

  private constructor() {}

  static getInstance(): NavigationHistoryService {
    if (!NavigationHistoryService.instance) {
      NavigationHistoryService.instance = new NavigationHistoryService();
    }
    return NavigationHistoryService.instance;
  }

  private isClient(): boolean {
    return typeof window !== "undefined";
  }

  private load(): string[] {
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

  private save(history: string[]): void {
    if (!this.isClient()) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // localStorage full or unavailable - silently ignore
    }
  }

  push(path: string): void {
    const history = this.load();
    // Avoid duplicating the most recent path
    if (history.length > 0 && history[history.length - 1] === path) {
      return;
    }
    history.push(path);
    // Keep only the last MAX_ENTRIES
    if (history.length > MAX_ENTRIES) {
      history.splice(0, history.length - MAX_ENTRIES);
    }
    this.save(history);
  }

  back(): string | null {
    const history = this.load();
    if (history.length < 2) return null;
    // Remove current page (last entry)
    history.pop();
    const previous = history[history.length - 1] ?? null;
    this.save(history);
    return previous;
  }

  getPrevious(): string | null {
    const history = this.load();
    if (history.length < 2) return null;
    return history[history.length - 2] ?? null;
  }

  getHistory(): string[] {
    return this.load();
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
