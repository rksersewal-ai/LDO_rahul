"use client";

import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbNavProps {
  items?: BreadcrumbItem[];
}

export function BreadcrumbNav({ items }: BreadcrumbNavProps) {
  const breadcrumbs = items ?? [{ label: "Dashboard" }];

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <span key={item.label} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="size-3 text-muted-foreground" />}
            {isLast ? (
              <span className="font-semibold text-foreground">{item.label}</span>
            ) : (
              <span className="text-muted-foreground">{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
