import { z } from "zod";

export const approvalTypeEnum = z.enum(["document_release", "work_verification", "bom_change"]);
export const approvalStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED", "ESCALATED"]);
export const approvalUrgencyEnum = z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]);

export const approvalListSchema = z.object({
  limit: z.number().min(1).max(100).default(25),
  offset: z.number().min(0).default(0),
  status: approvalStatusEnum.optional(),
  type: approvalTypeEnum.optional(),
  approverId: z.string().optional(),
  urgency: approvalUrgencyEnum.optional(),
  sortBy: z.enum(["createdAt", "dueDate", "urgency"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const approveActionSchema = z.object({
  id: z.string().min(1, "Approval ID is required"),
  notes: z.string().max(1000).optional(),
});

export const rejectActionSchema = z.object({
  id: z.string().min(1, "Approval ID is required"),
  reason: z.string().min(1, "Rejection reason is required").max(1000),
});

export const escalateActionSchema = z.object({
  id: z.string().min(1, "Approval ID is required"),
  reason: z.string().min(1, "Escalation reason is required").max(1000),
  escalateTo: z.string().optional(),
});

export type ApprovalListInput = z.infer<typeof approvalListSchema>;
export type ApproveActionInput = z.infer<typeof approveActionSchema>;
export type RejectActionInput = z.infer<typeof rejectActionSchema>;
export type EscalateActionInput = z.infer<typeof escalateActionSchema>;
