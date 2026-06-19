import {
  index,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { documents } from "./documents";
import { plNumbers } from "./pl-numbers";

export const documentPlLinkTypeEnum = pgEnum("document_pl_link_type", [
  "manual",
  "ocr_candidate",
  "ocr_accepted",
  "bom_inferred",
  "work_record_inferred",
]);

export const documentPlLinks = pgTable(
  "document_pl_links",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id),
    plNumberId: text("pl_number_id")
      .notNull()
      .references(() => plNumbers.id),
    linkType: documentPlLinkTypeEnum("link_type").notNull().default("manual"),
    confidence: real("confidence"),
    linkedBy: text("linked_by"),
    linkedAt: timestamp("linked_at", { withTimezone: true }).notNull().defaultNow(),
    sourceVersionId: text("source_version_id"),
    notes: text("notes"),
  },
  (table) => [
    unique("uq_document_pl_links_doc_pl").on(table.documentId, table.plNumberId),
    index("idx_doc_pl_links_document_id").on(table.documentId),
    index("idx_doc_pl_links_pl_number_id").on(table.plNumberId),
  ],
);
