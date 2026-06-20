import {
  index,
  integer,
  pgTable,
  real,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { documents } from "./documents";

/**
 * Per-page extraction audit for the hybrid OCR pipeline.
 *
 * Records, for each page of a document, whether the text came from native PDF
 * extraction or from OCR, the OCR confidence, and the DPI used. This lets the
 * system audit native-vs-OCR coverage and tune DPI presets from confidence
 * trends over time.
 */
export const documentPages = pgTable(
  "document_pages",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id),
    pageNumber: integer("page_number").notNull(),
    /** 'native' | 'ocr' | 'failed' */
    extractionMethod: varchar("extraction_method", { length: 20 }).notNull(),
    textContent: text("text_content"),
    ocrConfidence: real("ocr_confidence"),
    dpiUsed: integer("dpi_used"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_document_pages_document_id").on(table.documentId),
    unique("uq_document_pages_doc_page").on(table.documentId, table.pageNumber),
  ],
);
