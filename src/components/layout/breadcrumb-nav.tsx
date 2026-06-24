"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbNavProps {
  items?: BreadcrumbItem[];
}

const ROUTE_LABELS: Record<string, string> = {
  documents: "Documents",
  pl: "PL Knowledge Hub",
  ledger: "Work Ledger",
  bom: "BOM Explorer",
  approvals: "Approvals",
  cases: "Cases",
  admin: "Admin",
  users: "User Management",
  health: "System Health",
  ocr: "OCR Monitor",
  audit: "Audit Log",
  settings: "Settings",
  profile: "Profile",
  search: "Search",
  cabinets: "Cabinets",
  tags: "Tags",
  notifications: "Notifications",
  organizations: "Organizations",
  workspaces: "Workspaces",
  banners: "Banners",
  dedup: "Deduplication",
  reports: "Reports",
  upload: "Upload",
  preview: "Preview",
  traceability: "Traceability",
  "work-records": "Work Records",
  "rolling-stock": "Rolling Stock",
  "sync-conflicts": "Sync Conflicts",
  "change-password": "Change Password",
};

export function BreadcrumbNav({ items }: BreadcrumbNavProps) {
  const pathname = usePathname();

  const autoCrumbs: BreadcrumbItem[] =
    items ??
    pathname
      .split("/")
      .filter(Boolean)
      .map((seg, i, arr) => ({
        label: ROUTE_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
        href: i < arr.length - 1 ? `/${arr.slice(0, i + 1).join("/")}` : undefined,
      }));

  const breadcrumbs = autoCrumbs.length > 0 ? autoCrumbs : [{ label: "Dashboard" }];

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <span key={item.href ?? item.label} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="size-3 text-muted-foreground" />}
            {isLast ? (
              <span className="font-semibold text-foreground">{item.label}</span>
            ) : item.href ? (
              <Link
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-muted-foreground">{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
