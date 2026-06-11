import { z } from "zod";

export const plCategoryEnum = z.enum(["CAT-A", "CAT-B", "CAT-C", "CAT-D"]);
export const plStatusEnum = z.enum(["active", "inactive", "deprecated", "under_review"]);

export const plListSchema = z.object({
  limit: z.number().min(1).max(100).default(25),
  offset: z.number().min(0).default(0),
  sortBy: z
    .enum(["plNumber", "name", "category", "status", "createdAt", "updatedAt"])
    .default("plNumber"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  search: z.string().optional(),
  category: plCategoryEnum.optional(),
  status: plStatusEnum.optional(),
  safetyCritical: z.boolean().optional(),
  workshop: z.string().optional(),
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
});

export const plSearchSchema = z.object({
  query: z.string().min(2, "Search query must be at least 2 characters"),
  limit: z.number().min(1).max(50).default(10),
});

export type PlListInput = z.infer<typeof plListSchema>;
export type CreatePlInput = z.infer<typeof createPlSchema>;
export type UpdatePlInput = z.infer<typeof updatePlSchema>;
