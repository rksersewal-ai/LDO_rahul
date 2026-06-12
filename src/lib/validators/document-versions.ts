import { z } from "zod";

export const uploadVersionSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
  changeNote: z.string().max(2000).optional(),
  revision: z.string().max(16).optional(),
});

export const getVersionHistorySchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const restoreVersionSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
  versionNumber: z.number().int().min(1, "Version number must be at least 1"),
});

export const getDiffSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
  fromVersion: z.number().int().min(1),
  toVersion: z.number().int().min(1),
});

export type UploadVersionInput = z.infer<typeof uploadVersionSchema>;
export type GetVersionHistoryInput = z.infer<typeof getVersionHistorySchema>;
export type RestoreVersionInput = z.infer<typeof restoreVersionSchema>;
export type GetDiffInput = z.infer<typeof getDiffSchema>;
