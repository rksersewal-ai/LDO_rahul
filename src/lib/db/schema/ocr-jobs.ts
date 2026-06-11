import { index, integer, pgEnum, pgTable, real, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { documents } from "./documents";

export const ocrJobStatusEnum = pgEnum("ocr_job_status", [
  "queued",
  "processing",
  "completed",
  "failed",
  "cancelled",
]);

export const ocrJobs = pgTable(
  "ocr_jobs",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id),
    status: ocrJobStatusEnum("ocr_job_status").notNull().default("queued"),
    engine: varchar("engine", { length: 64 }).default("tesseract"),
    language: varchar("language", { length: 16 }).default("eng"),
    confidence: real("confidence"),
    pageCount: integer("page_count"),
    processedPages: integer("processed_pages").default(0),
    extractedText: text("extracted_text"),
    errorMessage: text("error_message"),
    retryCount: integer("retry_count").default(0),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_ocr_jobs_document_id").on(table.documentId),
    index("idx_ocr_jobs_status").on(table.status),
  ],
);
