import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { documents } from "./documents";

export const ocrPlCandidateStatusEnum = pgEnum("ocr_pl_candidate_status", [
  "pending",
  "accepted",
  "rejected",
  "unresolved",
]);

export const ocrPlCandidates = pgTable(
  "ocr_pl_candidates",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id),
    versionId: text("version_id"),
    workspaceId: text("workspace_id"),
    plNumber: varchar("pl_number", { length: 8 }).notNull(),
    confidence: real("confidence"),
    pageNumber: integer("page_number"),
    context: text("context"),
    mod11Valid: boolean("mod11_valid").notNull().default(false),
    status: ocrPlCandidateStatusEnum("status").notNull().default("pending"),
    acceptedBy: text("accepted_by"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    rejectedBy: text("rejected_by"),
    rejectedReason: text("rejected_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("idx_ocr_pl_candidates_document_id").on(table.documentId),
    index("idx_ocr_pl_candidates_workspace_id").on(table.workspaceId),
    index("idx_ocr_pl_candidates_pl_number").on(table.plNumber),
    index("idx_ocr_pl_candidates_status").on(table.status),
  ],
);
