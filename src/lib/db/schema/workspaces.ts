import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const workspaces = pgTable(
  "workspaces",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id")
      .notNull()
      .references(() => organizations.id),
    name: varchar("name", { length: 255 }).notNull(),
    code: varchar("code", { length: 32 }).notNull().unique(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),
    storageQuotaGb: integer("storage_quota_gb").notNull().default(100),
    usedStorageBytes: bigint("used_storage_bytes", { mode: "bigint" }).notNull().default(sql`0`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_workspaces_org_id").on(table.orgId),
    index("idx_workspaces_code").on(table.code),
  ],
);
