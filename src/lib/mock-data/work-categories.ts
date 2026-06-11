/**
 * Work categories and type codes from Product Specification Section 12.
 * Each work type has a disposal day target for KPI tracking.
 */

export type WorkCategoryCode =
  | "DWG"
  | "SPEC"
  | "TENDER"
  | "INSP"
  | "TEST"
  | "CERT"
  | "CORR"
  | "PROC"
  | "SDR"
  | "PL";

export type WorkPriority = "HIGH" | "MEDIUM" | "LOW" | "CRITICAL";

export interface WorkType {
  code: string;
  label: string;
  category: WorkCategoryCode;
  categoryLabel: string;
  targetDays: number;
  priority: WorkPriority;
}

export const WORK_CATEGORIES: { code: WorkCategoryCode; label: string }[] = [
  { code: "DWG", label: "Drawing" },
  { code: "SPEC", label: "Specification" },
  { code: "TENDER", label: "Tender" },
  { code: "INSP", label: "Inspection" },
  { code: "TEST", label: "Testing" },
  { code: "CERT", label: "Certification" },
  { code: "CORR", label: "Correspondence" },
  { code: "PROC", label: "Procedure" },
  { code: "SDR", label: "SDR/Deviation" },
  { code: "PL", label: "Parts List" },
];

export const WORK_TYPES: WorkType[] = [
  // Drawing work types
  {
    code: "DWG-001",
    label: "Drawing Review & Approval",
    category: "DWG",
    categoryLabel: "Drawing",
    targetDays: 7,
    priority: "HIGH",
  },
  {
    code: "DWG-002",
    label: "Drawing Revision Check",
    category: "DWG",
    categoryLabel: "Drawing",
    targetDays: 5,
    priority: "MEDIUM",
  },
  {
    code: "DWG-003",
    label: "Drawing Issue to Vendor",
    category: "DWG",
    categoryLabel: "Drawing",
    targetDays: 3,
    priority: "HIGH",
  },
  {
    code: "DWG-004",
    label: "Drawing Compilation",
    category: "DWG",
    categoryLabel: "Drawing",
    targetDays: 10,
    priority: "MEDIUM",
  },
  {
    code: "DWG-005",
    label: "As-Built Drawing Verification",
    category: "DWG",
    categoryLabel: "Drawing",
    targetDays: 14,
    priority: "LOW",
  },

  // Specification work types
  {
    code: "SPEC-001",
    label: "Specification Review",
    category: "SPEC",
    categoryLabel: "Specification",
    targetDays: 10,
    priority: "HIGH",
  },
  {
    code: "SPEC-002",
    label: "Specification Amendment",
    category: "SPEC",
    categoryLabel: "Specification",
    targetDays: 7,
    priority: "MEDIUM",
  },
  {
    code: "SPEC-003",
    label: "New Specification Draft",
    category: "SPEC",
    categoryLabel: "Specification",
    targetDays: 21,
    priority: "HIGH",
  },
  {
    code: "SPEC-004",
    label: "Specification Compliance Check",
    category: "SPEC",
    categoryLabel: "Specification",
    targetDays: 5,
    priority: "MEDIUM",
  },

  // Tender work types
  {
    code: "TENDER-001",
    label: "Tender Document Preparation",
    category: "TENDER",
    categoryLabel: "Tender",
    targetDays: 14,
    priority: "CRITICAL",
  },
  {
    code: "TENDER-002",
    label: "Technical Bid Evaluation",
    category: "TENDER",
    categoryLabel: "Tender",
    targetDays: 10,
    priority: "CRITICAL",
  },
  {
    code: "TENDER-003",
    label: "Tender Amendment Processing",
    category: "TENDER",
    categoryLabel: "Tender",
    targetDays: 5,
    priority: "HIGH",
  },
  {
    code: "TENDER-004",
    label: "Pre-Bid Query Response",
    category: "TENDER",
    categoryLabel: "Tender",
    targetDays: 3,
    priority: "HIGH",
  },

  // Inspection work types
  {
    code: "INSP-001",
    label: "Material Inspection",
    category: "INSP",
    categoryLabel: "Inspection",
    targetDays: 3,
    priority: "HIGH",
  },
  {
    code: "INSP-002",
    label: "In-Process Inspection",
    category: "INSP",
    categoryLabel: "Inspection",
    targetDays: 2,
    priority: "CRITICAL",
  },
  {
    code: "INSP-003",
    label: "Final Inspection & Testing",
    category: "INSP",
    categoryLabel: "Inspection",
    targetDays: 5,
    priority: "CRITICAL",
  },
  {
    code: "INSP-004",
    label: "Vendor Premises Inspection",
    category: "INSP",
    categoryLabel: "Inspection",
    targetDays: 7,
    priority: "HIGH",
  },

  // Testing work types
  {
    code: "TEST-001",
    label: "Type Test Evaluation",
    category: "TEST",
    categoryLabel: "Testing",
    targetDays: 14,
    priority: "HIGH",
  },
  {
    code: "TEST-002",
    label: "Routine Test Review",
    category: "TEST",
    categoryLabel: "Testing",
    targetDays: 5,
    priority: "MEDIUM",
  },
  {
    code: "TEST-003",
    label: "Test Report Analysis",
    category: "TEST",
    categoryLabel: "Testing",
    targetDays: 7,
    priority: "MEDIUM",
  },
  {
    code: "TEST-004",
    label: "Performance Test Monitoring",
    category: "TEST",
    categoryLabel: "Testing",
    targetDays: 10,
    priority: "HIGH",
  },

  // Certification work types
  {
    code: "CERT-001",
    label: "Vendor Approval Processing",
    category: "CERT",
    categoryLabel: "Certification",
    targetDays: 21,
    priority: "HIGH",
  },
  {
    code: "CERT-002",
    label: "Material Certificate Review",
    category: "CERT",
    categoryLabel: "Certification",
    targetDays: 5,
    priority: "MEDIUM",
  },
  {
    code: "CERT-003",
    label: "Quality Certificate Issue",
    category: "CERT",
    categoryLabel: "Certification",
    targetDays: 3,
    priority: "HIGH",
  },
  {
    code: "CERT-004",
    label: "Compliance Certificate",
    category: "CERT",
    categoryLabel: "Certification",
    targetDays: 7,
    priority: "MEDIUM",
  },

  // Correspondence work types
  {
    code: "CORR-001",
    label: "Inter-Department Letter",
    category: "CORR",
    categoryLabel: "Correspondence",
    targetDays: 5,
    priority: "MEDIUM",
  },
  {
    code: "CORR-002",
    label: "Vendor Correspondence",
    category: "CORR",
    categoryLabel: "Correspondence",
    targetDays: 7,
    priority: "MEDIUM",
  },
  {
    code: "CORR-003",
    label: "RDSO/Railway Board Reply",
    category: "CORR",
    categoryLabel: "Correspondence",
    targetDays: 10,
    priority: "HIGH",
  },
  {
    code: "CORR-004",
    label: "Inspection Note",
    category: "CORR",
    categoryLabel: "Correspondence",
    targetDays: 3,
    priority: "LOW",
  },

  // Procedure work types
  {
    code: "PROC-001",
    label: "SOP Development",
    category: "PROC",
    categoryLabel: "Procedure",
    targetDays: 21,
    priority: "MEDIUM",
  },
  {
    code: "PROC-002",
    label: "Procedure Review & Update",
    category: "PROC",
    categoryLabel: "Procedure",
    targetDays: 14,
    priority: "LOW",
  },
  {
    code: "PROC-003",
    label: "Work Instruction Draft",
    category: "PROC",
    categoryLabel: "Procedure",
    targetDays: 10,
    priority: "MEDIUM",
  },

  // SDR/Deviation work types
  {
    code: "SDR-001",
    label: "SDR Processing",
    category: "SDR",
    categoryLabel: "SDR/Deviation",
    targetDays: 7,
    priority: "CRITICAL",
  },
  {
    code: "SDR-002",
    label: "Deviation Request Analysis",
    category: "SDR",
    categoryLabel: "SDR/Deviation",
    targetDays: 5,
    priority: "HIGH",
  },
  {
    code: "SDR-003",
    label: "Concession Note",
    category: "SDR",
    categoryLabel: "SDR/Deviation",
    targetDays: 3,
    priority: "HIGH",
  },

  // Parts List work types
  {
    code: "PL-001",
    label: "PL Number Allotment",
    category: "PL",
    categoryLabel: "Parts List",
    targetDays: 5,
    priority: "MEDIUM",
  },
  {
    code: "PL-002",
    label: "PL Revision Processing",
    category: "PL",
    categoryLabel: "Parts List",
    targetDays: 10,
    priority: "MEDIUM",
  },
  {
    code: "PL-003",
    label: "PL Interchangeability Check",
    category: "PL",
    categoryLabel: "Parts List",
    targetDays: 7,
    priority: "HIGH",
  },
  {
    code: "PL-004",
    label: "PL Database Update",
    category: "PL",
    categoryLabel: "Parts List",
    targetDays: 3,
    priority: "LOW",
  },
];

export function getWorkTypeByCode(code: string): WorkType | undefined {
  return WORK_TYPES.find((wt) => wt.code === code);
}

export function getWorkTypesByCategory(category: WorkCategoryCode): WorkType[] {
  return WORK_TYPES.filter((wt) => wt.category === category);
}
