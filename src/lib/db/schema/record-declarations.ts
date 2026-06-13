import { index, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const recordDeclarations = pgTable(
  "record_declarations",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id").notNull().unique(),
    workspaceId: text("workspace_id").notNull(),
    recordSeriesId: varchar("record_series_id", { length: 64 }),
    retentionPeriodYears: integer("retention_period_years").notNull(),
    retentionExpiresAt: timestamp("retention_expires_at", { withTimezone: true }).notNull(),
    declaredBy: text("declared_by").notNull(),
    declaredAt: timestamp("declared_at", { withTimezone: true }).notNull().defaultNow(),
    destroyApprovedBy: text("destroy_approved_by"),
    destroyApprovedAt: timestamp("destroy_approved_at", { withTimezone: true }),
    destroyedAt: timestamp("destroyed_at", { withTimezone: true }),
    notes: text("notes"),
  },
  (table) => [
    index("idx_record_declarations_workspace_id").on(table.workspaceId),
    index("idx_record_declarations_document_id").on(table.documentId),
  ],
);
