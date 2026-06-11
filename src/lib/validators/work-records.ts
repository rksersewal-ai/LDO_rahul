import { z } from "zod";

export const workCategoryEnum = z.enum([
  "DWG",
  "SPEC",
  "TENDER",
  "INSP",
  "TEST",
  "CERT",
  "CORR",
  "PROC",
  "SDR",
  "PL",
]);

export const workRecordStatusEnum = z.enum(["OPEN", "SUBMITTED", "VERIFIED", "CLOSED"]);

export const workPriorityEnum = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);

export const workRecordListSchema = z.object({
  limit: z.number().min(1).max(100).default(25),
  offset: z.number().min(0).default(0),
  sortBy: z
    .enum(["date", "workCategory", "workTypeCode", "status", "priority", "daysTaken", "createdAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  search: z.string().optional(),
  userId: z.string().optional(),
  workCategory: workCategoryEnum.optional(),
  status: workRecordStatusEnum.optional(),
  priority: workPriorityEnum.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type WorkRecordListInput = z.infer<typeof workRecordListSchema>;

export const createWorkRecordSchema = z.object({
  date: z.string().min(1, "Date is required"),
  workCategory: workCategoryEnum,
  workTypeCode: z.string().min(1, "Work type is required"),
  description: z.string().min(1, "Description is required").max(1000),
  referenceNumber: z.string().min(1, "Reference number is required"),
  plNumber: z
    .string()
    .regex(/^\d{8}$/, "PL number must be exactly 8 digits")
    .nullable()
    .optional(),
  drawingNumber: z.string().nullable().optional(),
  specificationNumber: z.string().nullable().optional(),
  tenderNumber: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  priority: workPriorityEnum.default("MEDIUM"),
  concernedOfficer: z.string().nullable().optional(),
});

export type CreateWorkRecordInput = z.infer<typeof createWorkRecordSchema>;

export const updateWorkRecordSchema = z.object({
  id: z.string(),
  description: z.string().min(1).max(1000).optional(),
  referenceNumber: z.string().optional(),
  plNumber: z
    .string()
    .regex(/^\d{8}$/, "PL number must be exactly 8 digits")
    .nullable()
    .optional(),
  drawingNumber: z.string().nullable().optional(),
  specificationNumber: z.string().nullable().optional(),
  tenderNumber: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  priority: workPriorityEnum.optional(),
  concernedOfficer: z.string().nullable().optional(),
});

export type UpdateWorkRecordInput = z.infer<typeof updateWorkRecordSchema>;

export const submitWorkRecordSchema = z.object({
  id: z.string(),
});

export const verifyWorkRecordSchema = z.object({
  id: z.string(),
  action: z.enum(["verify", "reject"]),
  remarks: z.string().optional(),
});

export const lockWorkRecordSchema = z.object({
  id: z.string(),
});

export const getKPIsSchema = z.object({
  userId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type GetKPIsInput = z.infer<typeof getKPIsSchema>;
