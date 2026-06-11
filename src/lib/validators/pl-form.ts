import { z } from "zod";
import { plCategoryEnum, plStatusEnum } from "./pl-numbers";

export const plFormSchema = z
  .object({
    plNumber: z
      .string()
      .length(8, "PL number must be exactly 8 digits")
      .regex(/^\d{8}$/, "PL number must contain only digits"),
    name: z.string().min(1, "Name is required").max(500),
    description: z.string().min(1, "Description is required"),
    category: plCategoryEnum,
    status: plStatusEnum,
    safetyCritical: z.boolean(),

    // Safety fields (conditional - required when CAT-A or CAT-B)
    safetyClassification: z.string().optional(),
    severityOfFailure: z.string().optional(),
    consequences: z.string().optional(),

    // Technical fields
    drawingRef: z.string().optional(),
    specification: z.string().optional(),
    applicationArea: z.string().optional(),
    usedIn: z.string().optional(),

    // Administrative fields
    unit: z.string().min(1, "Unit is required"),
    workshop: z.string().min(1, "Workshop is required"),
    supervisors: z.string().optional(),
    eOfficeFile: z.string().optional(),
    vendorType: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.category === "CAT-A" || data.category === "CAT-B") {
      if (!data.safetyClassification || data.safetyClassification.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Safety classification is required for CAT-A/B items",
          path: ["safetyClassification"],
        });
      }
      if (!data.severityOfFailure || data.severityOfFailure.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Severity of failure is required for CAT-A/B items",
          path: ["severityOfFailure"],
        });
      }
      if (!data.consequences || data.consequences.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Consequences are required for CAT-A/B items",
          path: ["consequences"],
        });
      }
    }
  });

export type PlFormInput = z.infer<typeof plFormSchema>;
