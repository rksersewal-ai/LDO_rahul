"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

export interface BannerItem {
  id: string;
  type: "info" | "warning" | "critical";
  message: string;
  actionLabel?: string;
  actionHref?: string;
  targetRoles?: string[];
}

const tickerStyles: Record<BannerItem["type"], string> = {
  info: "bg-[oklch(0.95_0.02_250)] text-[oklch(0.35_0.08_250)] dark:bg-[oklch(0.25_0.04_250)] dark:text-[oklch(0.85_0.06_250)]",
  warning:
    "bg-[oklch(0.95_0.04_85)] text-[oklch(0.35_0.1_85)] dark:bg-[oklch(0.25_0.04_85)] dark:text-[oklch(0.85_0.08_85)]",
  critical:
    "bg-[oklch(0.93_0.04_25)] text-[oklch(0.35_0.12_25)] dark:bg-[oklch(0.25_0.06_25)] dark:text-[oklch(0.85_0.08_25)]",
};

const SEPARATOR = " \u2022 ";

export function SystemBanner() {
  const { data: session } = useSession();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const { data: banners = [] } = trpc.settings.getActiveBanners.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  useEffect(() => {
    const stored = sessionStorage.getItem("dismissed-banners");
    if (stored) {
      try {
        setDismissed(new Set(JSON.parse(stored)));
      } catch {
        // Ignore corrupted sessionStorage
      }
    }
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

  // Filter by dismissed and targetRoles
  const userRole = (session?.user?.role as string) ?? "";
  const visibleBanners = banners.filter((b: BannerItem) => {
    if (dismissed.has(b.id)) return false;
    if (b.targetRoles && b.targetRoles.length > 0) {
      if (!userRole || !b.targetRoles.includes(userRole)) return false;
    }
    return true;
  });

  if (visibleBanners.length === 0) return null;

  // Determine the dominant type for styling (critical > warning > info)
  const dominantType: BannerItem["type"] = visibleBanners.some(
    (b: BannerItem) => b.type === "critical",
  )
    ? "critical"
    : visibleBanners.some((b: BannerItem) => b.type === "warning")
      ? "warning"
      : "info";

  // Build ticker content: concatenate messages with separator dots
  const tickerSegments = visibleBanners.map((b: BannerItem) => ({
    id: b.id,
    message: b.message,
    actionHref: b.actionHref,
    actionLabel: b.actionLabel,
  }));

  return (
    <div
      className={cn(
        "relative flex items-center h-7 w-full overflow-hidden text-xs font-medium border-b",
        tickerStyles[dominantType],
      )}
    >
      {/* Scrolling ticker content */}
      <div className="flex-1 overflow-hidden h-full flex items-center group">
        <div className="animate-marquee whitespace-nowrap group-hover:[animation-play-state:paused]">
          {tickerSegments.map((segment, idx) => (
            <span key={segment.id} className="inline">
              {idx > 0 && <span className="mx-2 opacity-50">{SEPARATOR}</span>}
              {segment.actionHref ? (
                <Link href={segment.actionHref} className="hover:underline underline-offset-2">
                  {segment.message}
                  {segment.actionLabel && (
                    <span className="ml-1 font-semibold">[{segment.actionLabel}]</span>
                  )}
                </Link>
              ) : (
                <span>{segment.message}</span>
              )}
            </span>
          ))}
          {/* Duplicate content for seamless loop */}
          <span className="mx-2 opacity-50">{SEPARATOR}</span>
          {tickerSegments.map((segment, idx) => (
            <span key={`dup-${segment.id}`} className="inline">
              {idx > 0 && <span className="mx-2 opacity-50">{SEPARATOR}</span>}
              {segment.actionHref ? (
                <Link href={segment.actionHref} className="hover:underline underline-offset-2">
                  {segment.message}
                  {segment.actionLabel && (
                    <span className="ml-1 font-semibold">[{segment.actionLabel}]</span>
                  )}
                </Link>
              ) : (
                <span>{segment.message}</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Dismiss button for all visible banners */}
      <button
        type="button"
        onClick={() => {
          for (const b of visibleBanners) {
            dismissBanner(b.id);
          }
        }}
        className="shrink-0 mr-2 rounded p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        aria-label="Dismiss all banners"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
