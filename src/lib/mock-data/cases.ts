export type CaseType =
  | "failure_investigation"
  | "discrepancy"
  | "vendor_issue"
  | "design_deviation"
  | "safety_concern";
export type CaseStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "ESCALATED";
export type CaseSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface MockCase {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  type: CaseType;
  status: CaseStatus;
  severity: CaseSeverity;
  assigneeId: string;
  assigneeName: string;
  reporterId: string;
  reporterName: string;
  plNumber: string | null;
  vendorName: string | null;
  tenderNumber: string | null;
  linkedDocumentIds: string[];
  resolution: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export const MOCK_CASES: MockCase[] = [
  {
    id: "case-001",
    caseNumber: "CASE-2026-001",
    title: "Traction Motor Bearing Premature Failure",
    description:
      "TM-4907 unit #12 bearing failed at 45,000 km against expected 120,000 km life. Root cause analysis required.",
    type: "failure_investigation",
    status: "IN_PROGRESS",
    severity: "CRITICAL",
    assigneeId: "u-003-engineer",
    assigneeName: "Shri P.K. Gupta",
    reporterId: "u-002-supervisor",
    reporterName: "Shri A.K. Verma",
    plNumber: "20260045",
    vendorName: "SKF India Ltd.",
    tenderNumber: "CLW/STORES/TM/2025-26/001",
    linkedDocumentIds: ["doc-001", "doc-005"],
    resolution: null,
    createdAt: "2026-01-10T08:00:00Z",
    updatedAt: "2026-01-20T14:00:00Z",
    closedAt: null,
  },
  {
    id: "case-002",
    caseNumber: "CASE-2026-002",
    title: "Transformer Oil Leakage from Radiator Assembly",
    description:
      "Recurring oil leakage from transformer radiator on WAP-7 #37019. Third occurrence in 6 months.",
    type: "failure_investigation",
    status: "OPEN",
    severity: "HIGH",
    assigneeId: "u-006-engineer2",
    assigneeName: "Smt. K. Lakshmi",
    reporterId: "u-003-engineer",
    reporterName: "Shri P.K. Gupta",
    plNumber: "20260078",
    vendorName: "BHEL Bhopal",
    tenderNumber: null,
    linkedDocumentIds: ["doc-008"],
    resolution: null,
    createdAt: "2026-01-12T10:30:00Z",
    updatedAt: "2026-01-18T09:00:00Z",
    closedAt: null,
  },
  {
    id: "case-003",
    caseNumber: "CASE-2026-003",
    title: "BOM Discrepancy: Incorrect Part Number for Brake Pad",
    description:
      "BOM lists part CLW-BP-2024 but vendor supplies CLW-BP-2024A. Material composition differs.",
    type: "discrepancy",
    status: "RESOLVED",
    severity: "MEDIUM",
    assigneeId: "u-003-engineer",
    assigneeName: "Shri P.K. Gupta",
    reporterId: "u-004-reviewer",
    reporterName: "Shri V.K. Singh",
    plNumber: null,
    vendorName: "Hindustan Composites",
    tenderNumber: "CLW/STORES/BRK/2025-26/005",
    linkedDocumentIds: [],
    resolution:
      "BOM updated to reflect correct part number CLW-BP-2024A. Vendor confirmed same material spec.",
    createdAt: "2026-01-05T11:00:00Z",
    updatedAt: "2026-01-15T16:00:00Z",
    closedAt: null,
  },
  {
    id: "case-004",
    caseNumber: "CASE-2026-004",
    title: "Vendor Non-Compliance: Carbon Brush Quality",
    description:
      "Carbon brushes from Mersen India showing excessive wear rate. Hardness values below specified minimum.",
    type: "vendor_issue",
    status: "IN_PROGRESS",
    severity: "HIGH",
    assigneeId: "u-006-engineer2",
    assigneeName: "Smt. K. Lakshmi",
    reporterId: "u-002-supervisor",
    reporterName: "Shri A.K. Verma",
    plNumber: "20260102",
    vendorName: "Mersen India Pvt. Ltd.",
    tenderNumber: "CLW/STORES/CB/2025-26/012",
    linkedDocumentIds: ["doc-003"],
    resolution: null,
    createdAt: "2026-01-08T09:00:00Z",
    updatedAt: "2026-01-19T11:00:00Z",
    closedAt: null,
  },
  {
    id: "case-005",
    caseNumber: "CASE-2026-005",
    title: "Design Deviation: Pantograph Contact Strip Geometry",
    description:
      "Pantograph contact strip profile deviates from RDSO drawing by 2.5mm. Impact assessment needed.",
    type: "design_deviation",
    status: "OPEN",
    severity: "MEDIUM",
    assigneeId: "u-003-engineer",
    assigneeName: "Shri P.K. Gupta",
    reporterId: "u-006-engineer2",
    reporterName: "Smt. K. Lakshmi",
    plNumber: "20260078",
    vendorName: null,
    tenderNumber: null,
    linkedDocumentIds: ["doc-001"],
    resolution: null,
    createdAt: "2026-01-14T14:00:00Z",
    updatedAt: "2026-01-14T14:00:00Z",
    closedAt: null,
  },
  {
    id: "case-006",
    caseNumber: "CASE-2026-006",
    title: "Safety Concern: Bogie Frame Crack Detection",
    description:
      "Ultrasonic testing revealed 3mm crack in bogie frame weld joint during routine inspection of loco #37025.",
    type: "safety_concern",
    status: "ESCALATED",
    severity: "CRITICAL",
    assigneeId: "u-001-admin",
    assigneeName: "Shri R.K. Sharma",
    reporterId: "u-002-supervisor",
    reporterName: "Shri A.K. Verma",
    plNumber: "20260134",
    vendorName: null,
    tenderNumber: null,
    linkedDocumentIds: ["doc-005", "doc-010"],
    resolution: null,
    createdAt: "2026-01-16T07:00:00Z",
    updatedAt: "2026-01-21T10:00:00Z",
    closedAt: null,
  },
  {
    id: "case-007",
    caseNumber: "CASE-2026-007",
    title: "Discrepancy in Torque Values Documentation",
    description:
      "Assembly manual specifies 180 Nm for main bearing cap bolts but drawing shows 200 Nm. Clarification needed.",
    type: "discrepancy",
    status: "OPEN",
    severity: "LOW",
    assigneeId: "u-004-reviewer",
    assigneeName: "Shri V.K. Singh",
    reporterId: "u-003-engineer",
    reporterName: "Shri P.K. Gupta",
    plNumber: null,
    vendorName: null,
    tenderNumber: null,
    linkedDocumentIds: ["doc-001"],
    resolution: null,
    createdAt: "2026-01-18T13:00:00Z",
    updatedAt: "2026-01-18T13:00:00Z",
    closedAt: null,
  },
  {
    id: "case-008",
    caseNumber: "CASE-2026-008",
    title: "Vendor Late Delivery: Traction Motor Armature",
    description:
      "TM armatures from BHEL delayed by 45 days. Production schedule impacted for 3 locos.",
    type: "vendor_issue",
    status: "IN_PROGRESS",
    severity: "HIGH",
    assigneeId: "u-002-supervisor",
    assigneeName: "Shri A.K. Verma",
    reporterId: "u-001-admin",
    reporterName: "Shri R.K. Sharma",
    plNumber: null,
    vendorName: "BHEL Bhopal",
    tenderNumber: "CLW/STORES/TM/2025-26/003",
    linkedDocumentIds: [],
    resolution: null,
    createdAt: "2026-01-07T10:00:00Z",
    updatedAt: "2026-01-20T16:00:00Z",
    closedAt: null,
  },
  {
    id: "case-009",
    caseNumber: "CASE-2026-009",
    title: "Axle Journal Surface Finish Non-Conformance",
    description:
      "Axle journal surface finish measured at Ra 1.2 against specified Ra 0.8. Batch of 10 axles affected.",
    type: "failure_investigation",
    status: "CLOSED",
    severity: "MEDIUM",
    assigneeId: "u-003-engineer",
    assigneeName: "Shri P.K. Gupta",
    reporterId: "u-006-engineer2",
    reporterName: "Smt. K. Lakshmi",
    plNumber: "20260045",
    vendorName: "Rail Wheel Factory",
    tenderNumber: "CLW/STORES/AXL/2025-26/007",
    linkedDocumentIds: ["doc-005"],
    resolution:
      "Root cause: grinding wheel wear not detected. Corrective action: reduced grinding wheel replacement interval from 500 to 300 pieces. All 10 axles reworked successfully.",
    createdAt: "2025-12-20T09:00:00Z",
    updatedAt: "2026-01-05T14:00:00Z",
    closedAt: "2026-01-05T14:00:00Z",
  },
  {
    id: "case-010",
    caseNumber: "CASE-2026-010",
    title: "Insulation Resistance Drop in Stator Winding",
    description:
      "IR value dropped from 500 MOhm to 50 MOhm after storage. Moisture ingress suspected in 4 stator assemblies.",
    type: "failure_investigation",
    status: "OPEN",
    severity: "HIGH",
    assigneeId: "u-006-engineer2",
    assigneeName: "Smt. K. Lakshmi",
    reporterId: "u-003-engineer",
    reporterName: "Shri P.K. Gupta",
    plNumber: "20260102",
    vendorName: null,
    tenderNumber: null,
    linkedDocumentIds: ["doc-001", "doc-008"],
    resolution: null,
    createdAt: "2026-01-19T08:30:00Z",
    updatedAt: "2026-01-21T11:00:00Z",
    closedAt: null,
  },
  {
    id: "case-011",
    caseNumber: "CASE-2026-011",
    title: "Design Deviation: GTO Thyristor Heat Sink Dimensions",
    description:
      "Heat sink fins 1mm shorter than drawing specification. Thermal analysis required to assess impact.",
    type: "design_deviation",
    status: "IN_PROGRESS",
    severity: "MEDIUM",
    assigneeId: "u-006-engineer2",
    assigneeName: "Smt. K. Lakshmi",
    reporterId: "u-004-reviewer",
    reporterName: "Shri V.K. Singh",
    plNumber: null,
    vendorName: "Semikron India",
    tenderNumber: "CLW/STORES/PE/2025-26/009",
    linkedDocumentIds: [],
    resolution: null,
    createdAt: "2026-01-17T15:00:00Z",
    updatedAt: "2026-01-21T09:00:00Z",
    closedAt: null,
  },
  {
    id: "case-012",
    caseNumber: "CASE-2026-012",
    title: "Safety Concern: Inadequate Earth Connection",
    description:
      "Earth bus bar connection found loose on 2 locos during PDI. Potential safety hazard identified.",
    type: "safety_concern",
    status: "RESOLVED",
    severity: "CRITICAL",
    assigneeId: "u-002-supervisor",
    assigneeName: "Shri A.K. Verma",
    reporterId: "u-003-engineer",
    reporterName: "Shri P.K. Gupta",
    plNumber: "20260134",
    vendorName: null,
    tenderNumber: null,
    linkedDocumentIds: ["doc-003"],
    resolution:
      "Torque verification added to checklist. All locos in production re-inspected. Modified lock washer specification introduced.",
    createdAt: "2026-01-11T07:30:00Z",
    updatedAt: "2026-01-18T16:00:00Z",
    closedAt: null,
  },
];
