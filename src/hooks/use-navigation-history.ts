"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { NavigationHistoryService } from "@/lib/services/navigation-history";

/**
 * Hook wrapping NavigationHistoryService.
 * Automatically pushes the current pathname on mount.
 * Returns { push, back, previous, history }.
 */
export function useNavigationHistory() {
  const pathname = usePathname();
  const service = useMemo(() => NavigationHistoryService.getInstance(), []);
  const [history, setHistory] = useState<string[]>([]);
  const [previous, setPrevious] = useState<string | null>(null);

  // Push current pathname on route change
  useEffect(() => {
    if (pathname) {
      service.push(pathname);
      setHistory(service.getHistory());
      setPrevious(service.getPrevious());
    }
  }, [pathname, service]);

  const push = (path: string) => {
    service.push(path);
    setHistory(service.getHistory());
    setPrevious(service.getPrevious());
  };

  const back = (): string | null => {
    const prev = service.back();
    setHistory(service.getHistory());
    setPrevious(service.getPrevious());
    return prev;
  };

  return { push, back, previous, history };
}
