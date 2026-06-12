import { index, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const documentLegalHolds = pgTable(
  "document_legal_holds",
  {
    documentId: text("document_id").notNull(),
    holdId: text("hold_id").notNull(),
    appliedAt: timestamp("applied_at", { withTimezone: true }).notNull().defaultNow(),
    appliedBy: text("applied_by").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.documentId, table.holdId] }),
    index("idx_document_legal_holds_hold_id").on(table.holdId),
  ],
);
