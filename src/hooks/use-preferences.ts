"use client";

import { useCallback, useMemo, useState } from "react";
import { PreferencesService, type UserPreferences } from "@/lib/services/preferences";

/**
 * Hook wrapping PreferencesService.
 * Returns { preferences, setPreferences, resetPreferences }.
 */
export function usePreferences() {
  const service = useMemo(() => PreferencesService.getInstance(), []);
  const [preferences, setPrefsState] = useState<UserPreferences>(() => service.get());

  const setPreferences = useCallback(
    (partial: Partial<UserPreferences>) => {
      const updated = service.set(partial);
      setPrefsState(updated);
    },
    [service],
  );

  const resetPreferences = useCallback(() => {
    const defaults = service.reset();
    setPrefsState(defaults);
  }, [service]);

  return { preferences, setPreferences, resetPreferences };
}
