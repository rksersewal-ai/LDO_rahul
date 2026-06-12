import { type FeatureToggle, MOCK_FEATURE_TOGGLES } from "@/lib/mock-data/admin-settings";

/**
 * FeatureFlagService - Singleton service for managing feature flags.
 * Reads initial state from MOCK_FEATURE_TOGGLES and provides
 * methods to check, list, and update flag states.
 */
class FeatureFlagService {
  private static instance: FeatureFlagService | null = null;
  private flags: Map<string, FeatureToggle>;

  private constructor() {
    this.flags = new Map();
    for (const toggle of MOCK_FEATURE_TOGGLES) {
      this.flags.set(toggle.key, { ...toggle });
    }
  }

  static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  /** Check if a feature flag is enabled by its key */
  isEnabled(key: string): boolean {
    const flag = this.flags.get(key);
    return flag?.enabled ?? false;
  }

  /** Get all feature flags */
  getAll(): FeatureToggle[] {
    return Array.from(this.flags.values());
  }

  /** Get a single feature flag by key */
  getFlag(key: string): FeatureToggle | undefined {
    return this.flags.get(key);
  }

  /** Update a flag's enabled state */
  setEnabled(key: string, enabled: boolean): void {
    const flag = this.flags.get(key);
    if (flag) {
      flag.enabled = enabled;
      flag.lastModified = new Date().toISOString();
      this.flags.set(key, flag);
    }
  }

  /** Reset service (useful for testing) */
  static reset(): void {
    FeatureFlagService.instance = null;
  }
}

export const featureFlagService = FeatureFlagService.getInstance();
export { FeatureFlagService };
