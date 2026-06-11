import { z } from "zod";

export const caseTypeEnum = z.enum([
  "failure_investigation",
  "discrepancy",
  "vendor_issue",
  "design_deviation",
  "safety_concern",
]);
export const caseStatusEnum = z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "ESCALATED"]);
export const caseSeverityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const caseListSchema = z.object({
  limit: z.number().min(1).max(100).default(25),
  offset: z.number().min(0).default(0),
  status: caseStatusEnum.optional(),
  severity: caseSeverityEnum.optional(),
  type: caseTypeEnum.optional(),
  assigneeId: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "severity", "caseNumber"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const createCaseSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(5000),
  type: caseTypeEnum,
  severity: caseSeverityEnum,
  plNumber: z
    .string()
    .regex(/^\d{8}$/, "PL number must be 8 digits")
    .optional()
    .or(z.literal("")),
  vendorName: z.string().max(200).optional().or(z.literal("")),
  tenderNumber: z.string().max(100).optional().or(z.literal("")),
  assigneeId: z.string().min(1, "Assignee is required"),
});

export const updateCaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  type: caseTypeEnum.optional(),
  severity: caseSeverityEnum.optional(),
  status: caseStatusEnum.optional(),
  plNumber: z
    .string()
    .regex(/^\d{8}$/, "PL number must be 8 digits")
    .optional()
    .or(z.literal("")),
  vendorName: z.string().max(200).optional().or(z.literal("")),
  tenderNumber: z.string().max(100).optional().or(z.literal("")),
  assigneeId: z.string().optional(),
  resolution: z.string().max(5000).optional(),
});

export const closeCaseSchema = z.object({
  id: z.string().min(1),
  resolution: z.string().min(1, "Resolution is required").max(5000),
});

export const assignCaseSchema = z.object({
  id: z.string().min(1),
  assigneeId: z.string().min(1, "Assignee is required"),
});

export type CaseListInput = z.infer<typeof caseListSchema>;
export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;
export type CloseCaseInput = z.infer<typeof closeCaseSchema>;
export type AssignCaseInput = z.infer<typeof assignCaseSchema>;
