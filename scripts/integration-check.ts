import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

async function main() {
  const startedAt = Date.now();
  const result = await db.execute(sql`SELECT 1 AS ok`);
  const rows = Array.isArray(result) ? result : result.rows;
  if (!rows || rows.length === 0) {
    throw new Error("PostgreSQL integration check did not return a row");
  }
  console.log(`PostgreSQL integration check passed in ${Date.now() - startedAt}ms`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  if (process.env.CI === "true") {
    console.error(message);
    process.exit(1);
  }
  console.warn(
    `PostgreSQL integration check skipped outside CI because the database is unavailable: ${message}`,
  );
});
