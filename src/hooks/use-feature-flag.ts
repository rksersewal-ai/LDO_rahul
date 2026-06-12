"use client";

import { useMemo } from "react";
import type { FeatureToggle } from "@/lib/mock-data/admin-settings";
import { featureFlagService } from "@/lib/services/feature-flags";

/**
 * Hook to check whether a specific feature flag is enabled.
 * @param flagKey - The key of the feature flag (e.g., 'bulk_upload', 'search_analytics')
 * @returns boolean indicating whether the flag is enabled
 */
export function useFeatureFlag(flagKey: string): boolean {
  return useMemo(() => featureFlagService.isEnabled(flagKey), [flagKey]);
}

/**
 * Hook to retrieve all feature flags.
 * @returns Array of all FeatureToggle objects
 */
export function useFeatureFlags(): FeatureToggle[] {
  return useMemo(() => featureFlagService.getAll(), []);
}
