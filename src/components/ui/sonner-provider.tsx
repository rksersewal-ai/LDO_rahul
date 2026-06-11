"use client";

import { useTheme } from "next-themes";
import { Toaster as SonnerToaster } from "sonner";

export function SonnerProvider() {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={theme as "light" | "dark" | "system"}
      position="bottom-right"
      toastOptions={{
        style: {
          fontSize: "var(--text-sm)",
        },
      }}
    />
  );
}
