"use client";

import { AlertTriangle, Info, X, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface BannerItem {
  id: string;
  type: "info" | "warning" | "critical";
  message: string;
  actionLabel?: string;
  actionHref?: string;
}

const bannerStyles: Record<BannerItem["type"], string> = {
  info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-200",
  warning:
    "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-200",
  critical:
    "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/50 dark:border-red-800 dark:text-red-200",
};

const bannerIcons: Record<BannerItem["type"], React.ComponentType<{ className?: string }>> = {
  info: Info,
  warning: AlertTriangle,
  critical: XCircle,
};

export function SystemBanner() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load dismissed banners from session storage
    const stored = sessionStorage.getItem("dismissed-banners");
    if (stored) {
      setDismissed(new Set(JSON.parse(stored)));
    }
    // No mock banners - will be wired to admin banners tRPC query when available
    setBanners([]);
  }, []);

  const dismissBanner = useCallback(
    (id: string) => {
      const newDismissed = new Set(dismissed);
      newDismissed.add(id);
      setDismissed(newDismissed);
      sessionStorage.setItem("dismissed-banners", JSON.stringify([...newDismissed]));
    },
    [dismissed],
  );

  const visibleBanners = banners.filter((b) => !dismissed.has(b.id));

  if (visibleBanners.length === 0) return null;

  return (
    <div className="flex flex-col">
      {visibleBanners.map((banner) => {
        const Icon = bannerIcons[banner.type];
        return (
          <div
            key={banner.id}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 text-xs border-b",
              bannerStyles[banner.type],
            )}
          >
            <Icon className="size-3.5 shrink-0" />
            <span className="flex-1 truncate">{banner.message}</span>
            {banner.actionLabel && banner.actionHref && (
              <a
                href={banner.actionHref}
                className="font-medium underline underline-offset-2 hover:no-underline shrink-0"
              >
                {banner.actionLabel}
              </a>
            )}
            <button
              type="button"
              onClick={() => dismissBanner(banner.id)}
              className="shrink-0 rounded p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
