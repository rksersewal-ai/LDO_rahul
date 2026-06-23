"use client";

import { AppHeader } from "@/components/layout/app-header";
import { Sidebar } from "@/components/layout/sidebar";
import { SystemBanner } from "@/components/layout/system-banner";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { KeyboardShortcuts } from "@/components/shared/keyboard-shortcuts";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar-store";

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebarStore();

  return (
    <div className="h-dvh grid grid-rows-[var(--header-height)_auto_1fr]">
      <AppHeader />
      <SystemBanner />
      <div
        className={cn(
          "grid overflow-hidden transition-[grid-template-columns] duration-200 min-h-0",
          collapsed ? "grid-cols-[64px_1fr]" : "grid-cols-[var(--sidebar-width)_1fr]",
        )}
      >
        {/* Sidebar with independent scroll */}
        <Sidebar />
        {/* Main content with independent scroll */}
        <main className="overflow-y-auto min-h-0">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
      <KeyboardShortcuts />
    </div>
  );
}
