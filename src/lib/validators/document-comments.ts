import { z } from "zod";

export const addCommentSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
  versionId: z.string().optional(),
  parentId: z.string().optional(),
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(5000, "Comment must be 5000 characters or fewer"),
});

export const editCommentSchema = z.object({
  commentId: z.string().min(1, "Comment ID is required"),
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(5000, "Comment must be 5000 characters or fewer"),
});

export const deleteCommentSchema = z.object({
  commentId: z.string().min(1, "Comment ID is required"),
});

export const resolveCommentSchema = z.object({
  commentId: z.string().min(1, "Comment ID is required"),
});

export const getCommentsSchema = z.object({
  documentId: z.string().min(1, "Document ID is required"),
  versionId: z.string().optional(),
});

export type AddCommentInput = z.infer<typeof addCommentSchema>;
export type EditCommentInput = z.infer<typeof editCommentSchema>;
export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>;
export type ResolveCommentInput = z.infer<typeof resolveCommentSchema>;
export type GetCommentsInput = z.infer<typeof getCommentsSchema>;
