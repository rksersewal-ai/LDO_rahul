import { z } from "zod";

export const createShareLinkSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
  versionId: z.string().optional(),
  password: z.string().min(4, "Password must be at least 4 characters").optional(),
  expiresAt: z.string().datetime({ message: "Must be a valid ISO date" }).optional(),
  maxViews: z.number().int().positive("Max views must be a positive integer").optional(),
  allowDownload: z.boolean().default(true),
});

export const getShareLinksSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
});

export const revokeShareLinkSchema = z.object({
  linkId: z.string().min(1, "Link ID is required"),
});

export const resolveShareTokenSchema = z.object({
  token: z.string().length(48, "Token must be exactly 48 characters"),
  password: z.string().optional(),
});

export type CreateShareLinkInput = z.infer<typeof createShareLinkSchema>;
export type GetShareLinksInput = z.infer<typeof getShareLinksSchema>;
export type RevokeShareLinkInput = z.infer<typeof revokeShareLinkSchema>;
export type ResolveShareTokenInput = z.infer<typeof resolveShareTokenSchema>;
