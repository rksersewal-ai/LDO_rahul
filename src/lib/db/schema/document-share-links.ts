import { index, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { documents } from "./documents";

export const documentShareLinks = pgTable(
  "document_share_links",
  {
    id: text("id").primaryKey(),
    token: varchar("token", { length: 48 }).notNull().unique(),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id),
    versionId: text("version_id"),
    createdBy: text("created_by").notNull(),
    passwordHash: text("password_hash"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    maxViews: integer("max_views"),
    viewCount: integer("view_count").notNull().default(0),
    isRevoked: integer("is_revoked").notNull().default(0),
    allowDownload: integer("allow_download").notNull().default(1),
    workspaceId: text("workspace_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_document_share_links_token").on(table.token),
    index("idx_document_share_links_document_id").on(table.documentId),
    index("idx_document_share_links_workspace_id").on(table.workspaceId),
  ],
);
