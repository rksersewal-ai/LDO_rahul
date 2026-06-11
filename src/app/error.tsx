"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <div className="flex flex-col items-center text-center px-4">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="size-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-muted-foreground font-mono">Error ID: {error.digest}</p>
        )}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="size-3" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex h-8 items-center rounded-lg border px-4 text-xs font-medium hover:bg-muted transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
        <p className="mt-8 text-xs text-muted-foreground">
          If this problem persists, contact IT support at Ext. 2201
        </p>
      </div>
    </div>
  );
}
