/**
 * PreferencesService - user preferences (theme, density, sidebar, page size).
 * Pure TypeScript, no React dependencies.
 * Uses localStorage for persistence (SSR-safe).
 */

const STORAGE_KEY = "user-preferences";

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  density: "compact" | "normal";
  sidebarCollapsed: boolean;
  defaultPageSize: number;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "system",
  density: "normal",
  sidebarCollapsed: false,
  defaultPageSize: 20,
};

export class PreferencesService {
  private static instance: PreferencesService | null = null;

  private constructor() {}

  static getInstance(): PreferencesService {
    if (!PreferencesService.instance) {
      PreferencesService.instance = new PreferencesService();
    }
    return PreferencesService.instance;
  }

  private isClient(): boolean {
    return typeof window !== "undefined";
  }

  private load(): UserPreferences {
    if (!this.isClient()) return { ...DEFAULT_PREFERENCES };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_PREFERENCES };
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PREFERENCES, ...parsed };
    } catch {
      return { ...DEFAULT_PREFERENCES };
    }
  }

  private save(prefs: UserPreferences): void {
    if (!this.isClient()) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // localStorage full or unavailable - silently ignore
    }
  }

  get(): UserPreferences {
    return this.load();
  }

  set(partial: Partial<UserPreferences>): UserPreferences {
    const current = this.load();
    const updated = { ...current, ...partial };
    this.save(updated);
    return updated;
  }

  reset(): UserPreferences {
    const defaults = { ...DEFAULT_PREFERENCES };
    this.save(defaults);
    return defaults;
  }
}
