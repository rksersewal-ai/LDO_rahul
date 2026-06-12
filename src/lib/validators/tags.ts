import { z } from "zod";

export const createTagSchema = z.object({
  name: z.string().min(1, "Name is required").max(64, "Name must be 64 characters or fewer"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color")
    .optional(),
  description: z.string().optional(),
});

export const updateTagSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(64).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color")
    .optional(),
  description: z.string().optional(),
});

export const tagDocumentsSchema = z.object({
  tagId: z.string().min(1),
  documentIds: z.array(z.string().min(1)).min(1).max(100),
});

export const untagDocumentSchema = z.object({
  tagId: z.string().min(1),
  documentId: z.string().min(1),
});

export const tagGetDocumentsSchema = z.object({
  tagId: z.string().min(1),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type TagDocumentsInput = z.infer<typeof tagDocumentsSchema>;
export type UntagDocumentInput = z.infer<typeof untagDocumentSchema>;
