import { index, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { documents } from "./documents";
import { plNumbers } from "./pl-numbers";

export const documentPlLinks = pgTable(
  "document_pl_links",
  {
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id),
    plNumberId: text("pl_number_id")
      .notNull()
      .references(() => plNumbers.id),
    linkedBy: text("linked_by"),
    linkedAt: timestamp("linked_at", { withTimezone: true }).notNull().defaultNow(),
    notes: text("notes"),
  },
  (table) => [
    primaryKey({ columns: [table.documentId, table.plNumberId] }),
    index("idx_doc_pl_links_document_id").on(table.documentId),
    index("idx_doc_pl_links_pl_number_id").on(table.plNumberId),
  ],
);
