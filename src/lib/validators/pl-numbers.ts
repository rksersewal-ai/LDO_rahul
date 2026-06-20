import { z } from "zod";

export const plCategoryEnum = z.enum(["CAT-A", "CAT-B", "CAT-C", "CAT-D"]);
export const plStatusEnum = z.enum([
  "active",
  "inactive",
  "deprecated",
  "under_review",
  "obsolete",
]);
export const lifecycleStageEnum = z.enum([
  "draft",
  "active",
  "restricted",
  "obsolete",
  "deprecated",
]);

export const plItemTypeEnum = z.enum(["VD", "NVD"]);
export const inspectionAgencyEnum = z.enum(["RDSO", "ZONAL", "WORKSHOP", "STORES"]);

export const plAliasTypeEnum = z.enum(["legacy", "vendor", "drawing", "local_name"]);
export const plRelationTypeEnum = z.enum([
  "equivalent_to",
  "substitute_for",
  "supersedes",
  "child_of",
  "accessory_of",
  "related_to",
]);
export const plDocumentLinkTypeEnum = z.enum([
  "manual",
  "ocr_candidate",
  "ocr_accepted",
  "bom_inferred",
  "work_record_inferred",
]);

/** Semantic role of a PL<->document association in the ledger. */
export const plLinkRoleEnum = z.enum([
  "general",
  "te", // technical evaluation
  "prototype_approval",
  "correspondence",
]);

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});

export const plListSchema = z.object({
  search: z.string().optional(),
  category: plCategoryEnum.optional(),
  status: plStatusEnum.optional(),
  lifecycleStage: lifecycleStageEnum.optional(),
  safetyCritical: z.boolean().optional(),
  workshop: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  sortBy: z
    .enum(["plNumber", "name", "category", "status", "createdAt", "updatedAt"])
    .default("plNumber"),
  sortDir: z.enum(["asc", "desc"]).default("asc"),
});

export const createPlSchema = z.object({
  plNumber: z
    .string()
    .length(8, "PL number must be exactly 8 digits")
    .regex(/^\d{8}$/, "PL number must contain only digits"),
  name: z.string().min(1, "Name is required").max(500),
  description: z.string().min(1, "Description is required"),
  category: plCategoryEnum,
  status: plStatusEnum.default("active"),
  safetyCritical: z.boolean().default(false),
  drawingRef: z.string().nullable().optional(),
  specification: z.string().nullable().optional(),
  unit: z.string().default("nos"),
  workshop: z.string().min(1, "Workshop is required"),
  manufacturer: z.string().nullable().optional(),
  vendorCode: z.string().nullable().optional(),
  partFamily: z.string().nullable().optional(),
  lifecycleStage: lifecycleStageEnum.optional(),
  // Railway-specific fields
  itemType: plItemTypeEnum.nullable().optional(),
  uvamItemId: z.string().max(64).nullable().optional(),
  eligibilityCriteriaText: z.string().nullable().optional(),
  eligibilityCriteriaDocId: z.string().nullable().optional(),
  strDocId: z.string().nullable().optional(),
  qapDocId: z.string().nullable().optional(),
  inspectionAgency: inspectionAgencyEnum.nullable().optional(),
  unitOfMeasurement: z.string().max(16).nullable().optional(),
  shelfLifeMonths: z.number().int().min(0).nullable().optional(),
  lastProcurementRate: z.number().min(0).nullable().optional(),
  lastProcurementDate: z.string().datetime().nullable().optional(),
});

export const updatePlSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  category: plCategoryEnum.optional(),
  status: plStatusEnum.optional(),
  safetyCritical: z.boolean().optional(),
  drawingRef: z.string().nullable().optional(),
  specification: z.string().nullable().optional(),
  unit: z.string().optional(),
  workshop: z.string().optional(),
  manufacturer: z.string().nullable().optional(),
  vendorCode: z.string().nullable().optional(),
  partFamily: z.string().nullable().optional(),
  lifecycleStage: lifecycleStageEnum.optional(),
  // Railway-specific fields
  itemType: plItemTypeEnum.nullable().optional(),
  uvamItemId: z.string().max(64).nullable().optional(),
  eligibilityCriteriaText: z.string().nullable().optional(),
  eligibilityCriteriaDocId: z.string().nullable().optional(),
  strDocId: z.string().nullable().optional(),
  qapDocId: z.string().nullable().optional(),
  inspectionAgency: inspectionAgencyEnum.nullable().optional(),
  unitOfMeasurement: z.string().max(16).nullable().optional(),
  shelfLifeMonths: z.number().int().min(0).nullable().optional(),
  lastProcurementRate: z.number().min(0).nullable().optional(),
  lastProcurementDate: z.string().datetime().nullable().optional(),
});

export const plSearchSchema = z.object({
  query: z.string().min(2, "Search query must be at least 2 characters"),
  limit: z.number().min(1).max(50).default(10),
});

export const plAliasSchema = z.object({
  plId: z.string().min(1),
  alias: z.string().min(1).max(128),
  aliasType: plAliasTypeEnum,
});

export const plRelationshipSchema = z.object({
  sourcePlId: z.string().min(1),
  targetPlId: z.string().min(1),
  relationType: plRelationTypeEnum,
  notes: z.string().optional(),
});

export const plLinkDocumentSchema = z.object({
  plId: z.string().min(1),
  documentId: z.string().min(1),
  linkType: plDocumentLinkTypeEnum.default("manual"),
  linkRole: plLinkRoleEnum.default("general"),
  confidence: z.number().min(0).max(1).optional(),
  notes: z.string().optional(),
});

export const plLedgerSchema = z.object({
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});

export const plBulkImportSchema = z.object({
  rows: z.array(
    z.object({
      plNumber: z
        .string()
        .length(8)
        .regex(/^\d{8}$/),
      name: z.string().min(1).max(500),
      description: z.string().min(1),
      category: plCategoryEnum,
      status: plStatusEnum.default("active"),
      safetyCritical: z.boolean().default(false),
      drawingRef: z.string().nullable().optional(),
      specification: z.string().nullable().optional(),
      unit: z.string().default("nos"),
      workshop: z.string().min(1),
      manufacturer: z.string().nullable().optional(),
      vendorCode: z.string().nullable().optional(),
      partFamily: z.string().nullable().optional(),
      lifecycleStage: lifecycleStageEnum.optional(),
    }),
  ),
});

export const plChangeStatusSchema = z.object({
  id: z.string().min(1),
  status: plStatusEnum,
  reason: z.string().min(1, "Reason is required for status changes"),
});

export const searchDocumentsForLinkingSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  limit: z.number().int().min(1).max(50).default(10),
});

export type PlListInput = z.infer<typeof plListSchema>;
export type CreatePlInput = z.infer<typeof createPlSchema>;
export type UpdatePlInput = z.infer<typeof updatePlSchema>;
export type PlAliasInput = z.infer<typeof plAliasSchema>;
export type PlRelationshipInput = z.infer<typeof plRelationshipSchema>;
export type PlLinkDocumentInput = z.infer<typeof plLinkDocumentSchema>;
export type PlLinkRole = z.infer<typeof plLinkRoleEnum>;
export type PlLedgerInput = z.infer<typeof plLedgerSchema>;
export type PlBulkImportInput = z.infer<typeof plBulkImportSchema>;
export type PlChangeStatusInput = z.infer<typeof plChangeStatusSchema>;
export type SearchDocumentsForLinkingInput = z.infer<typeof searchDocumentsForLinkingSchema>;
