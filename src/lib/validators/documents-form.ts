import { z } from "zod";
import { documentCategoryEnum } from "./documents";

/**
 * Form validation schema for document upload wizard.
 */
export const uploadFormSchema = z.object({
  documentNumber: z
    .string()
    .min(1, "Document number is required")
    .regex(/^[A-Z0-9/:.\\-]+$/i, "Invalid document number format"),
  title: z.string().min(1, "Title is required").max(500, "Title must be 500 characters or less"),
  category: documentCategoryEnum,
  revision: z
    .string()
    .min(1, "Revision is required")
    .regex(/^R\d+$/i, "Revision must be in format R0, R1, R2..."),
  revisionDate: z.string().nullable().optional(),
  agency: z.string().min(1, "Agency is required"),
  tags: z.array(z.string()).default([]),
  linkedPlIds: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

/**
 * Form validation schema for document metadata editing.
 */
export const metadataEditFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(500, "Title must be 500 characters or less"),
  category: documentCategoryEnum,
  revision: z.string().optional(),
  revisionDate: z.string().nullable().optional(),
  agency: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

/**
 * Schema for bulk action form.
 */
export const bulkActionFormSchema = z.object({
  action: z.enum(["delete", "archive", "addTag", "removeTag", "changeStatus"]),
  value: z.string().optional(),
  ids: z.array(z.string()).min(1, "Select at least one document"),
});

export type UploadFormValues = z.infer<typeof uploadFormSchema>;
export type MetadataEditFormValues = z.infer<typeof metadataEditFormSchema>;
export type BulkActionFormValues = z.infer<typeof bulkActionFormSchema>;
