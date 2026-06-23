import {
  boolean,
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

export const duplicateDetections = pgTable(
  "duplicate_detections",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    documentAId: text("document_a_id")
      .notNull()
      .references(() => documents.id),
    documentBId: text("document_b_id")
      .notNull()
      .references(() => documents.id),
    score: real("score").notNull(),
    hashMatch: boolean("hash_match").notNull().default(false),
    docNumberMatch: boolean("doc_number_match").notNull().default(false),
    titleSimilarity: real("title_similarity").notNull(),
    ocrTextSimilarity: real("ocr_text_similarity").notNull(),
    plOverlap: real("pl_overlap").notNull(),
    metaMatch: boolean("meta_match").notNull().default(false),
    thumbPhashDistance: integer("thumb_phash_distance"),
    status: varchar("status", { length: 16 }).notNull().default("pending"),
    reviewedBy: text("reviewed_by"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewNote: text("review_note"),
    detectedAt: timestamp("detected_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("uq_duplicate_detections_pair").on(table.documentAId, table.documentBId),
    index("idx_duplicate_detections_workspace_status").on(table.workspaceId, table.status),
    index("idx_duplicate_detections_doc_a").on(table.documentAId),
    index("idx_duplicate_detections_doc_b").on(table.documentBId),
  ],
);
