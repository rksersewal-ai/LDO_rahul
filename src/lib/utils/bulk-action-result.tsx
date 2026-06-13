import { toast } from "sonner";

export interface BulkActionResult {
  succeeded: string[];
  failed: string[];
  errors: { id: string; reason: string }[];
}

/**
 * Surface a bulk-action result with explicit partial-failure feedback.
 *
 *  - All succeeded  -> success toast.
 *  - All failed     -> error toast.
 *  - Mixed          -> warning toast listing the failures so nothing fails silently.
 */
export function showBulkActionResult(result: BulkActionResult, actionLabel: string): void {
  const okCount = result.succeeded.length;
  const failCount = result.failed.length;

  if (failCount === 0) {
    toast.success(`${actionLabel}: ${okCount} item${okCount === 1 ? "" : "s"} succeeded`);
    return;
  }

  if (okCount === 0) {
    toast.error(`${actionLabel} failed for all ${failCount} item${failCount === 1 ? "" : "s"}`, {
      description: summarizeErrors(result.errors),
    });
    return;
  }

  toast.warning(`${actionLabel}: ${okCount} succeeded, ${failCount} failed`, {
    description: summarizeErrors(result.errors),
  });
}

function summarizeErrors(errors: { id: string; reason: string }[]): string {
  if (errors.length === 0) return "";
  const shown = errors.slice(0, 3).map((e) => `• ${e.reason}`);
  const remaining = errors.length - shown.length;
  if (remaining > 0) shown.push(`…and ${remaining} more`);
  return shown.join("\n");
}
