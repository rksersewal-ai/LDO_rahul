import { index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { documents } from "./documents";

export const documentRelations = pgTable(
  "document_relations",
  {
    id: text("id").primaryKey(),
    documentAId: text("document_a_id")
      .notNull()
      .references(() => documents.id),
    documentBId: text("document_b_id")
      .notNull()
      .references(() => documents.id),
    relationType: varchar("relation_type", { length: 32 }).notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_document_relations_doc_a").on(table.documentAId),
    index("idx_document_relations_doc_b").on(table.documentBId),
  ],
);
