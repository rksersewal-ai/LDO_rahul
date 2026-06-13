import { and, eq, isNull } from "drizzle-orm";
import { getCached, invalidateCache } from "@/lib/cache/query-cache";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";

/** TTL for resolved setting values. Short, since settings change rarely but
 * staleness must be bounded; writes also invalidate explicitly. */
const SETTING_CACHE_TTL_MS = 60_000;

/** Build the cache key for a resolved setting in a given scope context. */
function settingCacheKey(key: string, opts: GetEffectiveSettingOpts): string {
  return `setting:${key}:u=${opts.userId ?? ""}:w=${opts.workspaceId ?? ""}:o=${opts.orgId ?? ""}`;
}

/**
 * Invalidate all cached resolved settings. Called after any setting write so
 * subsequent reads reflect the change immediately (across instances via Redis).
 */
export function invalidateSettingsCache(): void {
  invalidateCache("setting:");
}

/**
 * Hardcoded system defaults used when no override exists in the database.
 */
export const SYSTEM_DEFAULTS: Record<string, string> = {
  "security.login.maxFailedAttempts": "5",
  "security.session.maxMinutes": "60",
  "documents.ocr.autoRun": "true",
  "documents.pl.mod11Required": "false",
  "documents.share.defaultExpiryHours": "72",
  "approvals.defaultDueDays": "3",
  "notifications.email.enabled": "true",
};

interface GetEffectiveSettingOpts {
  userId?: string;
  workspaceId?: string;
  orgId?: string;
}

/**
 * Resolves the effective value of a setting key using hierarchical resolution:
 * user -> workspace -> organization -> system -> hardcoded default.
 *
 * Result is cached (L1 + Redis) for SETTING_CACHE_TTL_MS; writes call
 * invalidateSettingsCache() to clear it.
 *
 * Returns the first found value, or null if no match anywhere.
 */
export async function getEffectiveSetting(
  key: string,
  opts: GetEffectiveSettingOpts,
): Promise<string | null> {
  return getCached(settingCacheKey(key, opts), SETTING_CACHE_TTL_MS, () =>
    resolveEffectiveSetting(key, opts),
  );
}

async function resolveEffectiveSetting(
  key: string,
  opts: GetEffectiveSettingOpts,
): Promise<string | null> {
  // 1. User scope
  if (opts.userId) {
    const [row] = await db
      .select({ value: settings.value })
      .from(settings)
      .where(
        and(eq(settings.scope, "user"), eq(settings.scopeId, opts.userId), eq(settings.key, key)),
      )
      .limit(1);
    if (row) return row.value;
  }

  // 2. Workspace scope
  if (opts.workspaceId) {
    const [row] = await db
      .select({ value: settings.value })
      .from(settings)
      .where(
        and(
          eq(settings.scope, "workspace"),
          eq(settings.scopeId, opts.workspaceId),
          eq(settings.key, key),
        ),
      )
      .limit(1);
    if (row) return row.value;
  }

  // 3. Organization scope
  if (opts.orgId) {
    const [row] = await db
      .select({ value: settings.value })
      .from(settings)
      .where(
        and(
          eq(settings.scope, "organization"),
          eq(settings.scopeId, opts.orgId),
          eq(settings.key, key),
        ),
      )
      .limit(1);
    if (row) return row.value;
  }

  // 4. System scope (scope_id is null)
  const [systemRow] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(and(eq(settings.scope, "system"), isNull(settings.scopeId), eq(settings.key, key)))
    .limit(1);
  if (systemRow) return systemRow.value;

  // 5. Hardcoded default
  return SYSTEM_DEFAULTS[key] ?? null;
}
