import { FileQuestion } from "lucide-react";
import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <div className="flex flex-col items-center text-center px-4">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="size-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Page Not Found</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-8 items-center rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/documents"
            className="inline-flex h-8 items-center rounded-lg border px-4 text-xs font-medium hover:bg-muted transition-colors"
          >
            View Documents
          </Link>
        </div>
        <p className="mt-8 text-xs text-muted-foreground">Error 404 &middot; LDO EDMS</p>
      </div>
    </div>
  );
}
