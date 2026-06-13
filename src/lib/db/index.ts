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
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgPool = pool;
}

export const db = drizzle(pool, { schema });

export type Database = typeof db;
