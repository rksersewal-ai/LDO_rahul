// Initialize TLS settings before any database connections
import "@/lib/tls-init";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

function getConnectionString(): string {
  // Prefer DATABASE_URL, but fall back to POSTGRES_URL which is the variable
  // provided by the Supabase/Vercel Postgres integration. This keeps the app
  // working whether the connection string is configured manually or supplied
  // automatically by the connected integration.
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (
    !url &&
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  ) {
    throw new Error(
      "DATABASE_URL (or POSTGRES_URL) environment variable is required in production",
    );
  }
  if (!url) {
    console.warn(
      "[db] Neither DATABASE_URL nor POSTGRES_URL is set — falling back to local " +
        "development default. Set DATABASE_URL explicitly to silence this warning.",
    );
  }
  return url || "postgresql://postgres:postgres@localhost:5432/ldo2_edms";
}

const globalForDb = globalThis as unknown as {
  pgPool: Pool | undefined;
};

const pool =
  globalForDb.pgPool ??
  new Pool({
    connectionString: getConnectionString(),
    // Limit max connections to avoid exhausting the PostgreSQL / PgBouncer pool.
    // The default (10) is too low for 200+ concurrent users; 40 matches the
    // PgBouncer default_pool_size recommended in the README.
    max: Number(process.env.DB_POOL_MAX ?? "40"),
    // Milliseconds a client can sit idle before being removed from the pool.
    idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT_MS ?? "30000"),
    // Milliseconds to wait for a new client before throwing an error.
    connectionTimeoutMillis: Number(process.env.DB_POOL_CONNECTION_TIMEOUT_MS ?? "5000"),
    // SSL for Supabase - must disable cert validation for self-signed certs
    ssl: getConnectionString().includes("supabase") ? { rejectUnauthorized: false } : undefined,
  });

// Always persist the pool on globalThis so that module re-evaluations in
// production (e.g. Next.js route segment caching) reuse the same pool
// instead of creating a new one and exhausting available connections.
globalForDb.pgPool = pool;

export const db = drizzle(pool, { schema });

export type Database = typeof db;
