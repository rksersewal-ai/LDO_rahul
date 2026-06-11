"use client";

import {
  Bell,
  CircleHelp,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { LiveClock } from "@/components/layout/live-clock";
import { NotificationPanel } from "@/components/layout/notification-panel";
import { CommandPalette } from "@/components/shared/command-palette";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/stores/notification-store";
import { useSidebarStore } from "@/stores/sidebar-store";

function IconButton({
  onClick,
  label,
  children,
  tooltipSide = "bottom",
  className,
}: {
  onClick?: () => void;
  label: string;
  children: React.ReactNode;
  tooltipSide?: "top" | "bottom" | "left" | "right";
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex items-center justify-center size-[30px] rounded-md",
              "hover:bg-accent text-muted-foreground hover:text-foreground transition-colors",
              className,
            )}
            aria-label={label}
          />
        }
        onClick={onClick}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>
        <span>{label}</span>
      </TooltipContent>
    </Tooltip>
  );
}

export function AppHeader() {
  const { collapsed, toggle } = useSidebarStore();
  const { theme, setTheme } = useTheme();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <>
      <CommandPalette />
      <header
        className="fixed top-0 left-0 right-0 z-30 grid h-[var(--header-height)] items-center border-b bg-background"
        style={{
          gridTemplateColumns: "minmax(240px, 1fr) auto minmax(240px, 1fr)",
        }}
      >
        {/* Left: collapse button + breadcrumb */}
        <div className="flex items-center gap-2 px-3">
          <IconButton onClick={toggle} label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </IconButton>
          <BreadcrumbNav />
        </div>

        {/* Center: search trigger */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            className={cn(
              "flex items-center gap-2 h-[30px] px-3 rounded-md border",
              "text-xs text-muted-foreground bg-muted/40 hover:bg-muted transition-colors",
              "min-w-[240px]",
            )}
            onClick={() => {
              // Dispatch Ctrl+K to open command palette
              document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
            }}
          >
            <Search className="size-3.5" />
            <span>Search documents...</span>
            <kbd className="ml-auto hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-background px-1.5 text-[10px] font-medium text-muted-foreground">
              <span className="text-xs">&#8984;</span>K
            </kbd>
          </button>
        </div>

        {/* Right: notifications, clock, help, theme toggle, avatar */}
        <div className="flex items-center justify-end gap-1 px-3">
          {/* Notification button */}
          <div className="relative">
            <IconButton onClick={() => setNotifOpen(!notifOpen)} label="Notifications">
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 size-2 rounded-full bg-primary" />
              )}
            </IconButton>
            <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
          </div>

          {/* Clock */}
          <LiveClock />

          {/* Help Center */}
          <IconButton label="Help Center">
            <CircleHelp className="size-4" />
          </IconButton>

          {/* Theme toggle */}
          <IconButton
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            label="Toggle theme"
          >
            <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </IconButton>

          {/* User avatar */}
          <IconButton label="User menu">
            <User className="size-4" />
          </IconButton>
        </div>
      </header>
    </>
  );
}
