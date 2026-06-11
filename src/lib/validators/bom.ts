import { z } from "zod";

export const bomEntryTypeEnum = z.enum(["assembly", "sub_assembly", "component"]);
export const bomProductStatusEnum = z.enum(["draft", "active", "deprecated"]);

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  code: z.string().min(1, "Product code is required").max(50),
  description: z.string().min(1, "Description is required"),
});

export const addEntrySchema = z.object({
  productId: z.string().min(1),
  parentId: z.string().nullable(),
  name: z.string().min(1, "Name is required").max(200),
  type: bomEntryTypeEnum,
  plId: z.string().nullable().optional(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unit: z.string().min(1, "Unit is required"),
  material: z.string().nullable().optional(),
  weight: z.number().nullable().optional(),
  drawingRef: z.string().nullable().optional(),
  specifications: z.string().nullable().optional(),
  vendor: z.string().nullable().optional(),
});

export const moveEntrySchema = z.object({
  entryId: z.string().min(1),
  newParentId: z.string().nullable(),
  newPosition: z.number().min(0),
});

export const linkPlSchema = z.object({
  entryId: z.string().min(1),
  plId: z.string().nullable(),
});

export const updateEntrySchema = z.object({
  entryId: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  type: bomEntryTypeEnum.optional(),
  quantity: z.number().min(1).optional(),
  unit: z.string().min(1).optional(),
  material: z.string().nullable().optional(),
  weight: z.number().nullable().optional(),
  drawingRef: z.string().nullable().optional(),
  specifications: z.string().nullable().optional(),
  vendor: z.string().nullable().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type AddEntryInput = z.infer<typeof addEntrySchema>;
export type MoveEntryInput = z.infer<typeof moveEntrySchema>;
export type LinkPlInput = z.infer<typeof linkPlSchema>;
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;
