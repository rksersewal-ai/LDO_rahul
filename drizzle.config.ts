import { defineConfig } from "drizzle-kit";
import { getMigrationDatabaseUrl } from "./src/lib/env";

export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: getMigrationDatabaseUrl(),
  },
});
