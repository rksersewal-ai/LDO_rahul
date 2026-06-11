"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface ShortcutDef {
  keys: string;
  description: string;
  category: "navigation" | "actions" | "general";
}

export const SHORTCUTS: ShortcutDef[] = [
  // General
  { keys: "Ctrl+K", description: "Open command palette / search", category: "general" },
  { keys: "Ctrl+/", description: "Show keyboard shortcuts", category: "general" },
  { keys: "Escape", description: "Close modal or panel", category: "general" },
  // Navigation
  { keys: "g then d", description: "Go to Dashboard", category: "navigation" },
  { keys: "g then p", description: "Go to PL Hub", category: "navigation" },
  { keys: "g then o", description: "Go to Documents", category: "navigation" },
  { keys: "g then l", description: "Go to Ledger", category: "navigation" },
  { keys: "g then b", description: "Go to BOM", category: "navigation" },
  // Actions
  { keys: "n", description: "New document upload", category: "actions" },
];

function Dialog_({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
}

export function KeyboardShortcuts() {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);
  const gPendingRef = useRef(false);
  const gTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleShortcut = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      // Ctrl+/ for shortcuts help
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setShowHelp((prev) => !prev);
        return;
      }

      // Skip single-key shortcuts when in inputs
      if (isInput) return;

      // Handle g+X navigation
      if (gPendingRef.current) {
        gPendingRef.current = false;
        if (gTimeoutRef.current) clearTimeout(gTimeoutRef.current);

        switch (e.key) {
          case "d":
            e.preventDefault();
            router.push("/");
            return;
          case "p":
            e.preventDefault();
            router.push("/pl");
            return;
          case "o":
            e.preventDefault();
            router.push("/documents");
            return;
          case "l":
            e.preventDefault();
            router.push("/ledger");
            return;
          case "b":
            e.preventDefault();
            router.push("/bom");
            return;
          case "u":
            e.preventDefault();
            router.push("/profile");
            return;
        }
        return;
      }

      // Start g sequence
      if (e.key === "g" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        gPendingRef.current = true;
        gTimeoutRef.current = setTimeout(() => {
          gPendingRef.current = false;
        }, 800);
        return;
      }

      // n for new document
      if (e.key === "n" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        router.push("/documents/upload");
        return;
      }
    },
    [router],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, [handleShortcut]);

  // Listen for Ctrl+/ dispatched events (from user menu)
  useEffect(() => {
    const handler = (e: Event) => {
      if (e instanceof KeyboardEvent && (e.ctrlKey || e.metaKey) && e.key === "/") {
        setShowHelp(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <Dialog_ open={showHelp} onOpenChange={setShowHelp}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <ShortcutCategory
            title="General"
            shortcuts={SHORTCUTS.filter((s) => s.category === "general")}
          />
          <ShortcutCategory
            title="Navigation"
            shortcuts={SHORTCUTS.filter((s) => s.category === "navigation")}
          />
          <ShortcutCategory
            title="Actions"
            shortcuts={SHORTCUTS.filter((s) => s.category === "actions")}
          />
        </div>
      </DialogContent>
    </Dialog_>
  );
}

function ShortcutCategory({ title, shortcuts }: { title: string; shortcuts: ShortcutDef[] }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {title}
      </h4>
      <div className="space-y-1">
        {shortcuts.map((shortcut) => (
          <div key={shortcut.keys} className="flex items-center justify-between py-1 px-1">
            <span className="text-sm text-foreground">{shortcut.description}</span>
            <kbd className="inline-flex items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground">
              {shortcut.keys}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
}
