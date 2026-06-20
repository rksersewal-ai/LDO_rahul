import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

function getConnectionString(): string {
  const url = process.env.DATABASE_URL;
  if (
    !url &&
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  ) {
    throw new Error("DATABASE_URL environment variable is required in production");
  }
  return url || "postgresql://postgres:postgres@localhost:5432/ldo_edms";
}

const globalForDb = globalThis as unknown as {
  pgPool: Pool | undefined;
  schemaChecked: boolean | undefined;
};

const pool =
  globalForDb.pgPool ??
  new Pool({
    connectionString: getConnectionString(),
    max: Number(process.env.DB_POOL_MAX ?? "40"),
    idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT_MS ?? "30000"),
    connectionTimeoutMillis: Number(process.env.DB_POOL_CONNECTION_TIMEOUT_MS ?? "5000"),
  });

// Always preserve pool in global to prevent connection count explosion under
// hot reload (was previously guarded by NODE_ENV !== "production").
globalForDb.pgPool = pool;

export const db = drizzle(pool, { schema });

export type Database = typeof db;

/**
 * One-shot schema sanity check. Verifies that critical columns match the Drizzle
 * schema's expected types (boolean vs integer, bigint vs integer). Runs once per
 * process lifetime on the first query, then caches the result globally.
 *
 * If the check fails, logs a clear error explaining which migration to run,
 * rather than letting the app produce cryptic SQL type-mismatch errors at
 * runtime. Non-blocking in development (warning only); fatal in production.
 */
export async function verifySchemaAlignment(): Promise<void> {
  if (globalForDb.schemaChecked) return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (!process.env.DATABASE_URL) return; // No DB to check

  try {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'documents'
          AND column_name IN ('is_deleted', 'file_size')
      `);

      const colTypes = Object.fromEntries(rows.map((r: { column_name: string; data_type: string }) => [r.column_name, r.data_type]));

      const issues: string[] = [];
      if (colTypes.is_deleted && colTypes.is_deleted !== "boolean") {
        issues.push(`documents.is_deleted is "${colTypes.is_deleted}" (expected "boolean")`);
      }
      if (colTypes.file_size && colTypes.file_size === "integer") {
        issues.push(`documents.file_size is "integer" (expected "bigint")`);
      }

      if (issues.length > 0) {
        const msg = [
          "[DB SCHEMA DRIFT] The database does not match the application schema:",
          ...issues.map((i) => `  - ${i}`),
          "",
          "Run the alignment migration to fix:",
          "  psql $DATABASE_URL -f drizzle/0011_schema_type_alignment.sql",
          "Or run: npx drizzle-kit push",
          "",
        ].join("\n");

        if (process.env.NODE_ENV === "production") {
          throw new Error(msg);
        }
        console.warn(`\n⚠️  ${msg}`);
      }
    } finally {
      client.release();
    }
    globalForDb.schemaChecked = true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("DB SCHEMA DRIFT")) {
      throw error; // Re-throw the schema drift error in production
    }
    // Swallow connection errors during startup (DB might not be up yet in dev)
    globalForDb.schemaChecked = true;
  }
}

// Fire-and-forget on module load (non-blocking).
void verifySchemaAlignment();
