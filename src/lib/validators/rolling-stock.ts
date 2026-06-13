import { z } from "zod";

export const rollingStockStatusEnum = z.enum([
  "active",
  "under_overhaul",
  "condemned",
  "transferred",
  "awaiting_commissioning",
]);

export const createRollingStockSchema = z.object({
  productId: z.string().optional(),
  unitNumber: z.string().min(1, "Unit number is required").max(64),
  serialNumber: z.string().max(64).nullable().optional(),
  manufacturedDate: z.string().datetime().nullable().optional(),
  commissioningDate: z.string().datetime().nullable().optional(),
  status: rollingStockStatusEnum.default("active"),
  homeWorkshop: z.string().min(1, "Home workshop is required").max(128),
  currentLocation: z.string().max(128).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const updateRollingStockSchema = z.object({
  id: z.string().min(1),
  productId: z.string().nullable().optional(),
  unitNumber: z.string().min(1).max(64).optional(),
  serialNumber: z.string().max(64).nullable().optional(),
  manufacturedDate: z.string().datetime().nullable().optional(),
  commissioningDate: z.string().datetime().nullable().optional(),
  status: rollingStockStatusEnum.optional(),
  homeWorkshop: z.string().min(1).max(128).optional(),
  currentLocation: z.string().max(128).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const listRollingStockSchema = z.object({
  search: z.string().optional(),
  productId: z.string().optional(),
  status: rollingStockStatusEnum.optional(),
  homeWorkshop: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  sortBy: z
    .enum(["unitNumber", "status", "homeWorkshop", "createdAt", "updatedAt"])
    .default("unitNumber"),
  sortDir: z.enum(["asc", "desc"]).default("asc"),
});

export type CreateRollingStockInput = z.infer<typeof createRollingStockSchema>;
export type UpdateRollingStockInput = z.infer<typeof updateRollingStockSchema>;
export type ListRollingStockInput = z.infer<typeof listRollingStockSchema>;
