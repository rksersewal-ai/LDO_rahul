import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { documents } from "./documents";

export const documentComments = pgTable(
  "document_comments",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id),
    versionId: text("version_id"),
    parentId: text("parent_id"),
    content: text("content").notNull(),
    isDeleted: boolean("is_deleted").notNull().default(false),
    isResolved: boolean("is_resolved").notNull().default(false),
    resolvedBy: text("resolved_by"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdBy: text("created_by").notNull(),
    workspaceId: text("workspace_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_document_comments_document_id").on(table.documentId),
    index("idx_document_comments_parent_id").on(table.parentId),
    index("idx_document_comments_created_by").on(table.createdBy),
  ],
);
