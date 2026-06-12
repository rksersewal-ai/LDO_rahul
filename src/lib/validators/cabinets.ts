import { z } from "zod";

export const createCabinetSchema = z.object({
  name: z.string().min(1, "Name is required").max(128, "Name must be 128 characters or fewer"),
  description: z.string().optional(),
  parentId: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color")
    .optional(),
  icon: z.string().max(32).optional(),
});

export const updateCabinetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(128).optional(),
  description: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color")
    .optional(),
  icon: z.string().max(32).optional(),
});

export const addDocumentsToCabinetSchema = z.object({
  cabinetId: z.string().min(1),
  documentIds: z.array(z.string().min(1)).min(1).max(100),
});

export const removeDocumentFromCabinetSchema = z.object({
  cabinetId: z.string().min(1),
  documentId: z.string().min(1),
});

export const cabinetGetDocumentsSchema = z.object({
  cabinetId: z.string().min(1),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});

export type CreateCabinetInput = z.infer<typeof createCabinetSchema>;
export type UpdateCabinetInput = z.infer<typeof updateCabinetSchema>;
export type AddDocumentsToCabinetInput = z.infer<typeof addDocumentsToCabinetSchema>;
export type RemoveDocumentFromCabinetInput = z.infer<typeof removeDocumentFromCabinetSchema>;
