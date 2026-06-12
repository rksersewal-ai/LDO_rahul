import { index, pgTable, primaryKey, text, timestamp, unique, varchar } from "drizzle-orm/pg-core";
import { documents } from "./documents";

export const tags = pgTable(
  "tags",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    name: varchar("name", { length: 64 }).notNull(),
    color: varchar("color", { length: 7 }).notNull().default("#6366F1"),
    description: text("description"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("uq_tags_workspace_name").on(table.workspaceId, table.name),
    index("idx_tags_workspace_id").on(table.workspaceId),
  ],
);

export const documentTags = pgTable(
  "document_tags",
  {
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id),
    taggedBy: text("tagged_by"),
    taggedAt: timestamp("tagged_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.documentId, table.tagId] })],
);
