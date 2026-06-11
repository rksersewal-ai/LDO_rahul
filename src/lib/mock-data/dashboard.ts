import type { StatusType } from "@/components/ui/status-badge";

export interface DashboardMetric {
  id: string;
  title: string;
  value: string | number;
  delta: string;
  deltaDirection: "up" | "down" | "neutral";
  context: string;
}

export interface TrendDataPoint {
  date: string;
  uploads: number;
  processed: number;
}

export interface ActivityItem {
  id: string;
  action: "upload" | "approve" | "verify" | "reject" | "comment" | "assign";
  description: string;
  user: string;
  timestamp: string;
  entityId: string;
  entityType: "document" | "case" | "work_record";
}

export interface RecentDocument {
  id: string;
  documentNumber: string;
  title: string;
  category: string;
  status: StatusType;
  owner: string;
  date: string;
  ocrStatus: "completed" | "processing" | "queued" | "failed" | "not_required";
}

export interface DrillDownItem {
  label: string;
  value: number;
  percentage?: number;
}

export interface DrillDownData {
  metricId: string;
  title: string;
  items: DrillDownItem[];
}

// KPI Metrics
export const dashboardMetrics: DashboardMetric[] = [
  {
    id: "total_documents",
    title: "Total Documents",
    value: "12,847",
    delta: "+3.2%",
    deltaDirection: "up",
    context: "142 added this week",
  },
  {
    id: "pending_approvals",
    title: "Pending Approvals",
    value: "23",
    delta: "-12%",
    deltaDirection: "down",
    context: "5 overdue by >48h",
  },
  {
    id: "ocr_queue",
    title: "OCR Queue",
    value: "5",
    delta: "2 failed",
    deltaDirection: "neutral",
    context: "3 processing, 2 failed",
  },
  {
    id: "open_cases",
    title: "Open Cases",
    value: "3",
    delta: "+1",
    deltaDirection: "up",
    context: "1 high priority",
  },
  {
    id: "work_records",
    title: "Work Records",
    value: "8,234",
    delta: "+1.8%",
    deltaDirection: "up",
    context: "67 updated today",
  },
];

// Generate 30 days of trend data
function generateTrendData(days: number): TrendDataPoint[] {
  const data: TrendDataPoint[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const baseUploads = 35 + Math.floor(Math.random() * 25);
    const baseProcessed = baseUploads - Math.floor(Math.random() * 8);
    data.push({
      date: date.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      uploads: baseUploads,
      processed: Math.max(baseProcessed, 20),
    });
  }
  return data;
}

export const trendData30D = generateTrendData(30);
export const trendData7D = generateTrendData(7);
export const trendData90D = generateTrendData(90);
export const trendData365D = generateTrendData(365);

// Activity feed
export const activityFeed: ActivityItem[] = [
  {
    id: "act-1",
    action: "upload",
    description: "Uploaded brake inspection report BR-2024-0891",
    user: "Ramesh Kumar",
    timestamp: "2 min ago",
    entityId: "doc-891",
    entityType: "document",
  },
  {
    id: "act-2",
    action: "approve",
    description: "Approved wheel profile measurement WP-2024-1204",
    user: "Suresh Patel",
    timestamp: "8 min ago",
    entityId: "doc-1204",
    entityType: "document",
  },
  {
    id: "act-3",
    action: "verify",
    description: "Verified OCR extraction for bogie frame report",
    user: "Priya Singh",
    timestamp: "15 min ago",
    entityId: "doc-445",
    entityType: "document",
  },
  {
    id: "act-4",
    action: "assign",
    description: "Assigned case CS-2024-003 to Quality team",
    user: "Ajay Sharma",
    timestamp: "22 min ago",
    entityId: "case-003",
    entityType: "case",
  },
  {
    id: "act-5",
    action: "upload",
    description: "Uploaded axle load test results AX-2024-0567",
    user: "Deepak Verma",
    timestamp: "35 min ago",
    entityId: "doc-567",
    entityType: "document",
  },
  {
    id: "act-6",
    action: "reject",
    description: "Returned document for revision - missing signatures",
    user: "Suresh Patel",
    timestamp: "42 min ago",
    entityId: "doc-788",
    entityType: "document",
  },
  {
    id: "act-7",
    action: "comment",
    description: "Added note on coupler inspection findings",
    user: "Ramesh Kumar",
    timestamp: "1h ago",
    entityId: "doc-332",
    entityType: "document",
  },
  {
    id: "act-8",
    action: "verify",
    description: "Completed verification of spring testing batch",
    user: "Priya Singh",
    timestamp: "1.5h ago",
    entityId: "wr-456",
    entityType: "work_record",
  },
  {
    id: "act-9",
    action: "upload",
    description: "Uploaded traction motor test TM-2024-0234",
    user: "Vikram Reddy",
    timestamp: "2h ago",
    entityId: "doc-234",
    entityType: "document",
  },
  {
    id: "act-10",
    action: "approve",
    description: "Approved batch of 12 material test certificates",
    user: "Ajay Sharma",
    timestamp: "3h ago",
    entityId: "doc-batch-12",
    entityType: "document",
  },
];

// Recent documents
export const recentDocuments: RecentDocument[] = [
  {
    id: "doc-1",
    documentNumber: "BR-2024-0891",
    title: "Brake Pad Inspection Report - WAP7 30521",
    category: "Inspection",
    status: "pending",
    owner: "Ramesh Kumar",
    date: "2024-12-19",
    ocrStatus: "completed",
  },
  {
    id: "doc-2",
    documentNumber: "WP-2024-1204",
    title: "Wheel Profile Measurement - BOXN 12345",
    category: "Measurement",
    status: "done",
    owner: "Suresh Patel",
    date: "2024-12-19",
    ocrStatus: "completed",
  },
  {
    id: "doc-3",
    documentNumber: "BF-2024-0445",
    title: "Bogie Frame Crack Detection Report",
    category: "NDT",
    status: "in_process",
    owner: "Priya Singh",
    date: "2024-12-18",
    ocrStatus: "processing",
  },
  {
    id: "doc-4",
    documentNumber: "AX-2024-0567",
    title: "Axle Load Test Results - Batch A42",
    category: "Testing",
    status: "done",
    owner: "Deepak Verma",
    date: "2024-12-18",
    ocrStatus: "completed",
  },
  {
    id: "doc-5",
    documentNumber: "TM-2024-0234",
    title: "Traction Motor Insulation Resistance Test",
    category: "Testing",
    status: "pending",
    owner: "Vikram Reddy",
    date: "2024-12-18",
    ocrStatus: "queued",
  },
  {
    id: "doc-6",
    documentNumber: "SP-2024-0089",
    title: "Spring Testing Certificate - Lot 78",
    category: "Certificate",
    status: "done",
    owner: "Priya Singh",
    date: "2024-12-17",
    ocrStatus: "completed",
  },
  {
    id: "doc-7",
    documentNumber: "CP-2024-0332",
    title: "Coupler Assembly Inspection - CBC Type",
    category: "Inspection",
    status: "failed",
    owner: "Ramesh Kumar",
    date: "2024-12-17",
    ocrStatus: "failed",
  },
  {
    id: "doc-8",
    documentNumber: "MT-2024-0456",
    title: "Material Test Certificate - Steel Plates",
    category: "Certificate",
    status: "done",
    owner: "Ajay Sharma",
    date: "2024-12-17",
    ocrStatus: "completed",
  },
  {
    id: "doc-9",
    documentNumber: "BK-2024-0902",
    title: "Brake Block Wear Analysis Report",
    category: "Analysis",
    status: "in_process",
    owner: "Deepak Verma",
    date: "2024-12-16",
    ocrStatus: "processing",
  },
  {
    id: "doc-10",
    documentNumber: "WD-2024-0178",
    title: "Welding Procedure Qualification Record",
    category: "Procedure",
    status: "done",
    owner: "Vikram Reddy",
    date: "2024-12-16",
    ocrStatus: "completed",
  },
  {
    id: "doc-11",
    documentNumber: "HL-2024-0234",
    title: "Hydraulic Lift Inspection - Shop Floor 3",
    category: "Inspection",
    status: "pending",
    owner: "Suresh Patel",
    date: "2024-12-16",
    ocrStatus: "not_required",
  },
  {
    id: "doc-12",
    documentNumber: "TR-2024-0567",
    title: "Track Geometry Measurement Report - KM 234",
    category: "Measurement",
    status: "done",
    owner: "Ramesh Kumar",
    date: "2024-12-15",
    ocrStatus: "completed",
  },
  {
    id: "doc-13",
    documentNumber: "SG-2024-0089",
    title: "Signal Equipment Testing - Station XYZ",
    category: "Testing",
    status: "in_process",
    owner: "Priya Singh",
    date: "2024-12-15",
    ocrStatus: "processing",
  },
  {
    id: "doc-14",
    documentNumber: "PA-2024-0445",
    title: "Pantograph Inspection Report - WAP7",
    category: "Inspection",
    status: "done",
    owner: "Ajay Sharma",
    date: "2024-12-15",
    ocrStatus: "completed",
  },
  {
    id: "doc-15",
    documentNumber: "OC-2024-0678",
    title: "Oil Contamination Analysis - DLW Batch",
    category: "Analysis",
    status: "pending",
    owner: "Deepak Verma",
    date: "2024-12-14",
    ocrStatus: "queued",
  },
  {
    id: "doc-16",
    documentNumber: "GF-2024-0901",
    title: "Gear Case Fitment Record - ALCo DL",
    category: "Record",
    status: "done",
    owner: "Vikram Reddy",
    date: "2024-12-14",
    ocrStatus: "completed",
  },
  {
    id: "doc-17",
    documentNumber: "CT-2024-0123",
    title: "Compressor Test Certificate - 3-Phase",
    category: "Certificate",
    status: "done",
    owner: "Suresh Patel",
    date: "2024-12-14",
    ocrStatus: "completed",
  },
  {
    id: "doc-18",
    documentNumber: "AB-2024-0456",
    title: "Air Brake System Overhaul Report",
    category: "Overhaul",
    status: "blocked",
    owner: "Ramesh Kumar",
    date: "2024-12-13",
    ocrStatus: "failed",
  },
  {
    id: "doc-19",
    documentNumber: "ER-2024-0789",
    title: "Electrical Resistance Test - Coach Wiring",
    category: "Testing",
    status: "done",
    owner: "Priya Singh",
    date: "2024-12-13",
    ocrStatus: "completed",
  },
  {
    id: "doc-20",
    documentNumber: "FM-2024-0012",
    title: "Final Measurement Report - New Build LHB",
    category: "Measurement",
    status: "in_process",
    owner: "Ajay Sharma",
    date: "2024-12-13",
    ocrStatus: "processing",
  },
];

// Drill-down data for each metric
export const drillDownData: Record<string, DrillDownData> = {
  total_documents: {
    metricId: "total_documents",
    title: "Documents by Category",
    items: [
      { label: "Inspection Reports", value: 3421, percentage: 26.6 },
      { label: "Test Certificates", value: 2890, percentage: 22.5 },
      { label: "Measurement Records", value: 2156, percentage: 16.8 },
      { label: "Analysis Reports", value: 1834, percentage: 14.3 },
      { label: "Procedure Documents", value: 1245, percentage: 9.7 },
      { label: "Overhaul Records", value: 897, percentage: 7.0 },
      { label: "Other", value: 404, percentage: 3.1 },
    ],
  },
  pending_approvals: {
    metricId: "pending_approvals",
    title: "Pending Approval Items",
    items: [
      { label: "Inspection Reports", value: 8 },
      { label: "Test Certificates", value: 6 },
      { label: "NDT Reports", value: 4 },
      { label: "Material Certificates", value: 3 },
      { label: "Overhaul Records", value: 2 },
    ],
  },
  ocr_queue: {
    metricId: "ocr_queue",
    title: "OCR Processing Status",
    items: [
      { label: "Processing", value: 3 },
      { label: "Failed - Low Quality Scan", value: 1 },
      { label: "Failed - Unsupported Format", value: 1 },
    ],
  },
  open_cases: {
    metricId: "open_cases",
    title: "Open Cases",
    items: [
      { label: "High Priority - Wheel Defect", value: 1 },
      { label: "Medium - Document Mismatch", value: 1 },
      { label: "Low - Classification Error", value: 1 },
    ],
  },
  work_records: {
    metricId: "work_records",
    title: "Work Records by Status",
    items: [
      { label: "Completed", value: 6892, percentage: 83.7 },
      { label: "In Progress", value: 845, percentage: 10.3 },
      { label: "Pending Review", value: 312, percentage: 3.8 },
      { label: "On Hold", value: 185, percentage: 2.2 },
    ],
  },
};
