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
import { documents, ocrStatusEnum } from "./documents";

export const documentVersions = pgTable(
  "document_versions",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id),
    versionNumber: integer("version_number").notNull(),
    revision: varchar("revision", { length: 16 }),
    filePath: text("file_path"),
    fileSize: integer("file_size"),
    fileHash: varchar("file_hash", { length: 64 }),
    mimeType: varchar("mime_type", { length: 128 }),
    originalFilename: varchar("original_filename", { length: 512 }),
    ocrStatus: ocrStatusEnum("ocr_status").notNull().default("not_required"),
    ocrText: text("ocr_text"),
    ocrConfidence: real("ocr_confidence"),
    thumbnailPath: text("thumbnail_path"),
    pageCount: integer("page_count"),
    changeNote: text("change_note"),
    uploadedBy: text("uploaded_by"),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
    isCurrentVersion: integer("is_current_version").notNull().default(0),
    workspaceId: text("workspace_id").notNull(),
  },
  (table) => [
    unique("uq_document_versions_doc_version").on(table.documentId, table.versionNumber),
    index("idx_document_versions_document_id").on(table.documentId),
    index("idx_document_versions_workspace_id").on(table.workspaceId),
  ],
);
