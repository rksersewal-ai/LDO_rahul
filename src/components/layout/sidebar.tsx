"use client";

import {
  BarChart3,
  ClipboardList,
  Cpu,
  FileText,
  FolderOpen,
  FolderTree,
  HelpCircle,
  LayoutDashboard,
  Package,
  Search,
  Send,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar-store";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
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
      { label: "Folders", href: "/folders", icon: FolderOpen },
      { label: "Transmittals", href: "/transmittals", icon: Send },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Projects", href: "/projects", icon: Package },
      { label: "Users", href: "/users", icon: Users },
    ],
  },
];

const utilityItems: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Help Center", href: "/help", icon: HelpCircle },
  { label: "Search", href: "/search", icon: Search },
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
        "flex items-center gap-2 h-[30px] rounded-md px-2 text-xs font-semibold transition-colors",
        active
          ? "bg-primary text-primary-foreground font-bold"
          : "text-foreground/80 hover:bg-accent hover:text-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      <Icon className="size-4 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={<span className="block" />}>{link}</TooltipTrigger>
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
        {collapsed ? (
          <div className="flex items-center justify-center size-8 rounded-md bg-primary text-primary-foreground font-bold text-sm">
            L
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center size-7 rounded-md bg-primary text-primary-foreground font-bold text-xs">
              L2
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-tight">LDO-2 EDMS</span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                Document Intelligence
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable nav section */}
      <nav className="overflow-y-auto px-2 py-2">
        {navSections.map((section) => (
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
                  active={pathname === item.href}
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
