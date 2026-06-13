import { z } from "zod";

export const documentCategoryEnum = z.enum([
  "DRAWING",
  "SPECIFICATION",
  "ELIGIBILITY_CRITERIA",
  "SCOPE_OF_SUPPLY",
  "SMI",
  "STANDARD",
  "TENDER",
  "SDR",
  "TEST_REPORT",
  "CERTIFICATE",
  "PROCEDURE",
  "OTHER",
]);

export const documentStatusEnum = z.enum([
  "ACTIVE",
  "OBSOLETE",
  "UNDER_REVIEW",
  "DRAFT",
  "APPROVED",
]);

export const ocrStatusEnum = z.enum([
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "FLAGGED",
  "SKIPPED",
  "NOT_REQUIRED",
]);

export const documentListSchema = z.object({
  limit: z.number().min(1).max(100).default(25),
  offset: z.number().min(0).default(0),
  // Optional keyset cursor ("<createdAtISO>|<id>"). When provided with the
  // default createdAt sort, the query uses efficient keyset pagination instead
  // of OFFSET. Backward compatible: omit to use offset pagination.
  cursor: z.string().optional(),
  sortBy: z
    .enum(["documentNumber", "title", "category", "status", "createdAt", "updatedAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  category: documentCategoryEnum.optional(),
  status: documentStatusEnum.optional(),
  ocrStatus: ocrStatusEnum.optional(),
  fileType: z.string().optional(),
  ownerId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const uploadDocumentSchema = z.object({
  documentNumber: z.string().min(1, "Document number is required"),
  title: z.string().min(1, "Title is required").max(500),
  category: documentCategoryEnum,
  revision: z.string().default("R0"),
  revisionDate: z.string().nullable().optional(),
  agency: z.string().optional(),
  tags: z.array(z.string()).default([]),
  linkedPlIds: z.array(z.string()).default([]),
});

export const updateDocumentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500).optional(),
  category: documentCategoryEnum.optional(),
  status: documentStatusEnum.optional(),
  revision: z.string().optional(),
  revisionDate: z.string().nullable().optional(),
  agency: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const linkPlSchema = z.object({
  documentId: z.string(),
  plId: z.string(),
  linkType: z.enum(["reference", "primary", "supersedes"]).default("reference"),
});

export const unlinkPlSchema = z.object({
  documentId: z.string(),
  plId: z.string(),
});

export const approveDocumentSchema = z.object({
  id: z.string(),
  notes: z.string().optional(),
});

export const bulkActionEnum = z.enum([
  "archive",
  "tag",
  "untag",
  "cabinet_add",
  "cabinet_remove",
  "classify",
  "delete",
]);

export const bulkActionSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "At least one document ID is required"),
  action: bulkActionEnum,
  value: z.string().optional(),
});

export type DocumentListInput = z.infer<typeof documentListSchema>;
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
