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
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgPool = pool;
}

export const db = drizzle(pool, { schema });

export type Database = typeof db;
