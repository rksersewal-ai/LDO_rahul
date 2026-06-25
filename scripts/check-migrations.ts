import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const migrationsDir = join(process.cwd(), "drizzle");
const migrationFiles = readdirSync(migrationsDir)
  .filter((file) => /^\d{4}_.+\.sql$/.test(file))
  .sort();

if (migrationFiles.length === 0) {
  console.error("No SQL migration files found in drizzle/.");
  process.exit(1);
}

const journal = JSON.parse(readFileSync(join(migrationsDir, "meta", "_journal.json"), "utf8")) as {
  entries?: Array<{ tag?: string }>;
};

const journalTags = new Set((journal.entries ?? []).map((entry) => `${entry.tag}.sql`));
const missingFromJournal = migrationFiles.filter((file) => !journalTags.has(file));

if (missingFromJournal.length > 0) {
  console.error(`Migration journal is missing entries for: ${missingFromJournal.join(", ")}`);
  process.exit(1);
}

for (const file of migrationFiles) {
  const sql = readFileSync(join(migrationsDir, file), "utf8").trim();
  if (!sql) {
    console.error(`Migration ${file} is empty.`);
    process.exit(1);
  }
}

console.log(`Validated ${migrationFiles.length} SQL migration files and drizzle journal entries.`);
