import { index, integer, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const classificationNameEnum = pgEnum("classification_name", [
  "UNCLASSIFIED",
  "INTERNAL",
  "RESTRICTED",
  "CONFIDENTIAL",
]);

export const classificationLabels = pgTable(
  "classification_labels",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    name: classificationNameEnum("name").notNull(),
    level: integer("level").notNull(),
    color: varchar("color", { length: 16 }),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_classification_labels_workspace_id").on(table.workspaceId)],
);
