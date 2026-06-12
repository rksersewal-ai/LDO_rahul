import { boolean, index, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const plCategoryEnum = pgEnum("pl_category", ["CAT-A", "CAT-B", "CAT-C", "CAT-D"]);

export const plStatusEnum = pgEnum("pl_status", [
  "active",
  "inactive",
  "deprecated",
  "under_review",
]);

export const plNumbers = pgTable(
  "pl_numbers",
  {
    id: text("id").primaryKey(),
    plNumber: varchar("pl_number", { length: 8 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: plCategoryEnum("category").notNull(),
    status: plStatusEnum("status").notNull().default("active"),
    safetyCritical: boolean("safety_critical").notNull().default(false),
    drawingRef: varchar("drawing_ref", { length: 64 }),
    specification: varchar("specification", { length: 128 }),
    unit: varchar("unit", { length: 32 }),
    workshop: varchar("workshop", { length: 128 }),
    searchVector: text("search_vector"),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
    workspaceId: text("workspace_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_pl_numbers_pl_number").on(table.plNumber),
    index("idx_pl_numbers_category").on(table.category),
    index("idx_pl_numbers_status").on(table.status),
    index("idx_pl_numbers_safety_critical").on(table.safetyCritical),
  ],
);
