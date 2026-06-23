"use client";

import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  CheckSquare,
  ClipboardList,
  Cpu,
  FileText,
  FolderOpen,
  FolderTree,
  Landmark,
  LayoutDashboard,
  Megaphone,
  MonitorCheck,
  RotateCcw,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Tag,
  Train,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/stores/notification-store";
import { useSidebarStore } from "@/stores/sidebar-store";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
  adminOnly?: boolean;
}

const navSections: NavSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Documents", href: "/documents", icon: FileText },
      { label: "PL Knowledge Hub", href: "/pl", icon: Cpu },
      { label: "Work Ledger", href: "/ledger", icon: ClipboardList },
      { label: "Ledger Reports", href: "/ledger/reports", icon: BarChart3 },
      { label: "BOM Explorer", href: "/bom", icon: FolderTree },
      { label: "Rolling Stock", href: "/rolling-stock", icon: Train },
      { label: "Approvals", href: "/approvals", icon: CheckSquare },
      { label: "Cases", href: "/cases", icon: AlertTriangle },
      { label: "Cabinets", href: "/cabinets", icon: FolderOpen },
      { label: "Tags", href: "/tags", icon: Tag },
      { label: "Recycle Bin", href: "/documents/recycle-bin", icon: Trash2 },
    ],
  },
  {
    title: "Admin",
    adminOnly: true,
    items: [
      { label: "Admin Dashboard", href: "/admin", icon: ShieldCheck },
      { label: "User Management", href: "/admin/users", icon: Users },
      { label: "Organizations", href: "/admin/organizations", icon: Landmark },
      { label: "Workspaces", href: "/admin/workspaces", icon: Building2 },
      { label: "System Health", href: "/admin/health", icon: MonitorCheck },
      { label: "OCR Monitor", href: "/admin/ocr", icon: Cpu },
      { label: "Audit Log", href: "/admin/audit", icon: Shield },
      { label: "Records & Retention", href: "/admin/records", icon: RotateCcw },
      { label: "Deduplication", href: "/admin/dedup", icon: FileText },
      { label: "Settings", href: "/admin/settings", icon: Settings },
      { label: "Banners", href: "/admin/banners", icon: Megaphone },
    ],
  },
];

function NavLink({
  item,
  collapsed,
  active,
}: {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
}) {
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-2 h-[30px] rounded-md px-2 text-xs font-semibold transition-colors",
        active
          ? "bg-primary text-primary-foreground font-bold"
          : "text-foreground/80 hover:bg-accent hover:text-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && item.badge != null && item.badge > 0 && (
        <span className="ml-auto inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold min-w-[16px] h-4 px-1">
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
      {collapsed && item.badge != null && item.badge > 0 && (
        <span className="absolute top-0 right-0.5 inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[8px] font-bold min-w-[14px] h-3.5 px-0.5">
          {item.badge > 99 ? "99+" : item.badge}
        </span>
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={<span className="block relative" />}>{link}</TooltipTrigger>
        <TooltipContent side="right">
          <span>{item.label}</span>
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

export function Sidebar() {
  const { collapsed } = useSidebarStore();
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const utilityItems: NavItem[] = [
    { label: "Notifications", href: "/notifications", icon: Bell, badge: unreadCount },
    { label: "Profile", href: "/profile", icon: Settings },
    { label: "Search", href: "/search", icon: Search },
  ];

  const visibleSections = navSections.filter((section) => !section.adminOnly || isAdmin);

  const allHrefs = visibleSections.flatMap((s) => s.items.map((i) => i.href));
  const matches = allHrefs.filter(
    (href) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`)),
  );
  const bestMatch = matches.sort((a, b) => b.length - a.length)[0] || "/";

  return (
    <aside
      className={cn(
        "grid h-full border-r bg-sidebar transition-[width] duration-200",
        collapsed ? "w-16" : "w-[var(--sidebar-width)]",
      )}
      style={{ gridTemplateRows: "auto 1fr auto" }}
    >
      {/* Brand area */}
      <div
        className={cn("flex items-center h-12 border-b px-3", collapsed && "justify-center px-2")}
      >
        <Link href="/" className="flex items-center gap-2">
          {collapsed ? (
            <div className="flex items-center justify-center size-8 rounded-md bg-primary text-primary-foreground font-bold text-sm">
              L
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center size-7 rounded-md bg-primary text-primary-foreground font-bold text-xs">
                L2
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold leading-tight">LDO-2 EDMS</span>
                <span className="text-[10px] text-muted-foreground leading-tight">
                  Document Intelligence
                </span>
              </div>
            </>
          )}
        </Link>
      </div>

      {/* Scrollable nav section */}
      <nav className="overflow-y-auto px-2 py-2">
        {visibleSections.map((section) => (
          <div key={section.title} className="mb-3">
            {!collapsed && (
              <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  active={item.href === "/" ? pathname === "/" : item.href === bestMatch}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Fixed utility section at bottom */}
      <div className="border-t px-2 py-2">
        <div className="flex flex-col gap-0.5">
          {utilityItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              collapsed={collapsed}
              active={pathname === item.href}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
