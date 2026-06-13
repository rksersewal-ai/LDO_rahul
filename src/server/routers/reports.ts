import { TRPCError } from "@trpc/server";
import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import * as XLSX from "xlsx";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  auditLog,
  bomProducts,
  documentPlLinks,
  documents,
  ocrJobs,
  plNumbers,
  workRecords,
} from "@/lib/db/schema";
import { engineerProcedure, router } from "@/server/trpc";

function requireWorkspaceId(ctx: { session: { user?: { workspaceId?: string | null } } }): string {
  const wsId = ctx.session?.user?.workspaceId;
  if (!wsId) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "No workspace assigned" });
  }
  return wsId;
}

/**
 * Escape a CSV field value to prevent injection and preserve structure.
 */
function escapeCsvField(value: string): string {
  if (/[,"\n\r]/.test(value) || /^[=+\-@]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

const REPORT_TYPES = [
  {
    id: "system-usage",
    title: "System Usage",
    description: "Overall system usage metrics including active users, sessions, and page views",
    icon: "BarChart3",
  },
  {
    id: "storage-growth",
    title: "Storage Growth",
    description: "Document storage utilization and growth trends over time",
    icon: "HardDrive",
  },
  {
    id: "user-activity",
    title: "User Activity",
    description: "Detailed user activity log with login frequency and actions performed",
    icon: "Users",
  },
  {
    id: "document-ingest",
    title: "Document Ingest Velocity",
    description: "Rate of document uploads and processing throughput",
    icon: "Upload",
  },
  {
    id: "ocr-success-rate",
    title: "OCR Success Rate",
    description: "OCR processing outcomes, confidence scores, and failure analysis",
    icon: "ScanText",
  },
  {
    id: "pl-coverage",
    title: "PL Coverage",
    description:
      "PL number utilization and linkage coverage across documents and BOM",
    icon: "Layers",
  },
  {
    id: "work-ledger-summary",
    title: "Work Ledger Summary",
    description: "Work record statistics by category, status, and department",
    icon: "ClipboardList",
  },
  {
    id: "overdue-analysis",
    title: "Overdue Analysis",
    description: "Documents and work items past their target completion dates",
    icon: "AlertTriangle",
  },
] as const;

type ReportRow = Record<string, string | number | null>;

async function generateSystemUsage(
  workspaceId: string,
  _dateFrom?: string,
  _dateTo?: string,
): Promise<{ headers: string[]; rows: ReportRow[] }> {
  const docDateFilters = buildDateFilters(documents.createdAt, _dateFrom, _dateTo);
  const auditDateFilters = buildDateFilters(auditLog.createdAt, _dateFrom, _dateTo);
  const plDateFilters = buildDateFilters(plNumbers.createdAt, _dateFrom, _dateTo);
  const bomDateFilters = buildDateFilters(bomProducts.createdAt, _dateFrom, _dateTo);
  const workDateFilters = buildDateFilters(workRecords.createdAt, _dateFrom, _dateTo);

  const [docCount] = await db
    .select({ count: count() })
    .from(documents)
    .where(and(eq(documents.workspaceId, workspaceId), ...docDateFilters));

  const [plCount] = await db
    .select({ count: count() })
    .from(plNumbers)
    .where(and(eq(plNumbers.workspaceId, workspaceId), ...plDateFilters));

  const [bomCount] = await db
    .select({ count: count() })
    .from(bomProducts)
    .where(and(eq(bomProducts.workspaceId, workspaceId), ...bomDateFilters));

  const [workCount] = await db
    .select({ count: count() })
    .from(workRecords)
    .where(and(eq(workRecords.workspaceId, workspaceId), ...workDateFilters));

  const [auditCount] = await db
    .select({ count: count() })
    .from(auditLog)
    .where(and(eq(auditLog.workspaceId, workspaceId), ...auditDateFilters));

  const headers = ["Metric", "Count"];
  const rows: ReportRow[] = [
    { Metric: "Total Documents", Count: docCount?.count ?? 0 },
    { Metric: "Total PL Numbers", Count: plCount?.count ?? 0 },
    { Metric: "BOM Products", Count: bomCount?.count ?? 0 },
    { Metric: "Work Records", Count: workCount?.count ?? 0 },
    { Metric: "Audit Entries", Count: auditCount?.count ?? 0 },
  ];

  return { headers, rows };
}

async function generateStorageGrowth(
  workspaceId: string,
  _dateFrom?: string,
  _dateTo?: string,
): Promise<{ headers: string[]; rows: ReportRow[] }> {
  const dateFilters = buildDateFilters(documents.createdAt, _dateFrom, _dateTo);

  const result = await db
    .select({
      month: sql<string>`to_char(${documents.createdAt}, 'YYYY-MM')`,
      docCount: count(),
      totalSize: sql<number>`coalesce(sum(${documents.fileSize}), 0)`,
    })
    .from(documents)
    .where(and(eq(documents.workspaceId, workspaceId), ...dateFilters))
    .groupBy(sql`to_char(${documents.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${documents.createdAt}, 'YYYY-MM')`);

  const headers = ["Month", "Document Count", "Total Size (bytes)"];
  const rows: ReportRow[] = result.map((r) => ({
    Month: r.month,
    "Document Count": r.docCount,
    "Total Size (bytes)": Number(r.totalSize),
  }));

  return { headers, rows };
}

async function generateUserActivity(
  workspaceId: string,
  _dateFrom?: string,
  _dateTo?: string,
): Promise<{ headers: string[]; rows: ReportRow[] }> {
  const dateFilters = buildDateFilters(auditLog.createdAt, _dateFrom, _dateTo);

  const result = await db
    .select({
      userId: auditLog.userId,
      userName: auditLog.userName,
      actionCount: count(),
    })
    .from(auditLog)
    .where(and(eq(auditLog.workspaceId, workspaceId), ...dateFilters))
    .groupBy(auditLog.userId, auditLog.userName)
    .orderBy(sql`count(*) desc`);

  const headers = ["User ID", "User Name", "Actions Performed"];
  const rows: ReportRow[] = result.map((r) => ({
    "User ID": r.userId,
    "User Name": r.userName ?? "Unknown",
    "Actions Performed": r.actionCount,
  }));

  return { headers, rows };
}

async function generateDocumentIngest(
  workspaceId: string,
  _dateFrom?: string,
  _dateTo?: string,
): Promise<{ headers: string[]; rows: ReportRow[] }> {
  const dateFilters = buildDateFilters(documents.createdAt, _dateFrom, _dateTo);

  const result = await db
    .select({
      week: sql<string>`to_char(${documents.createdAt}, 'IYYY-"W"IW')`,
      uploadCount: count(),
    })
    .from(documents)
    .where(and(eq(documents.workspaceId, workspaceId), ...dateFilters))
    .groupBy(sql`to_char(${documents.createdAt}, 'IYYY-"W"IW')`)
    .orderBy(sql`to_char(${documents.createdAt}, 'IYYY-"W"IW')`);

  const headers = ["Week", "Uploads"];
  const rows: ReportRow[] = result.map((r) => ({
    Week: r.week,
    Uploads: r.uploadCount,
  }));

  return { headers, rows };
}

async function generateOcrSuccessRate(
  workspaceId: string,
  _dateFrom?: string,
  _dateTo?: string,
): Promise<{ headers: string[]; rows: ReportRow[] }> {
  const dateFilters = buildDateFilters(documents.createdAt, _dateFrom, _dateTo);

  const result = await db
    .select({
      ocrStatus: documents.ocrStatus,
      statusCount: count(),
      avgConfidence: sql<number>`coalesce(avg(${documents.ocrConfidence}), 0)`,
    })
    .from(documents)
    .where(and(eq(documents.workspaceId, workspaceId), ...dateFilters))
    .groupBy(documents.ocrStatus);

  const headers = ["OCR Status", "Count", "Avg Confidence"];
  const rows: ReportRow[] = result.map((r) => ({
    "OCR Status": r.ocrStatus,
    Count: r.statusCount,
    "Avg Confidence": Math.round(Number(r.avgConfidence) * 100) / 100,
  }));

  return { headers, rows };
}

/**
 * Date range filters by PL creation date. Shows coverage status of PLs
 * created within the specified period.
 */
async function generatePlCoverage(
  workspaceId: string,
  _dateFrom?: string,
  _dateTo?: string,
): Promise<{ headers: string[]; rows: ReportRow[] }> {
  const dateFilters = buildDateFilters(plNumbers.createdAt, _dateFrom, _dateTo);

  const [totalPls] = await db
    .select({ count: count() })
    .from(plNumbers)
    .where(and(eq(plNumbers.workspaceId, workspaceId), ...dateFilters));

  const [linkedPls] = await db
    .select({ count: sql<number>`count(distinct ${documentPlLinks.plNumberId})` })
    .from(documentPlLinks)
    .innerJoin(plNumbers, eq(documentPlLinks.plNumberId, plNumbers.id))
    .where(and(eq(plNumbers.workspaceId, workspaceId), ...dateFilters));

  const total = totalPls?.count ?? 0;
  const linked = Number(linkedPls?.count ?? 0);
  const unlinked = total - linked;

  const headers = ["Metric", "Count"];
  const rows: ReportRow[] = [
    { Metric: "Total PL Numbers", Count: total },
    { Metric: "PLs with Linked Documents", Count: linked },
    { Metric: "PLs without Links", Count: unlinked },
  ];

  return { headers, rows };
}

async function generateWorkLedgerSummary(
  workspaceId: string,
  _dateFrom?: string,
  _dateTo?: string,
): Promise<{ headers: string[]; rows: ReportRow[] }> {
  const dateFilters = buildDateFilters(workRecords.createdAt, _dateFrom, _dateTo);

  const result = await db
    .select({
      status: workRecords.status,
      section: workRecords.section,
      recordCount: count(),
    })
    .from(workRecords)
    .where(and(eq(workRecords.workspaceId, workspaceId), ...dateFilters))
    .groupBy(workRecords.status, workRecords.section)
    .orderBy(workRecords.status, workRecords.section);

  const headers = ["Status", "Section", "Count"];
  const rows: ReportRow[] = result.map((r) => ({
    Status: r.status,
    Section: r.section ?? "Unassigned",
    Count: r.recordCount,
  }));

  return { headers, rows };
}

async function generateOverdueAnalysis(
  workspaceId: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<{ headers: string[]; rows: ReportRow[] }> {
  // Use dateTo as the reference date (defaults to now if not provided).
  // Documents in draft/pending_review created more than 30 days before the
  // reference date are considered overdue.
  const referenceDate = dateTo ? new Date(dateTo) : new Date();
  const thirtyDaysBeforeRef = new Date(referenceDate);
  thirtyDaysBeforeRef.setDate(thirtyDaysBeforeRef.getDate() - 30);

  const filters = [
    eq(documents.workspaceId, workspaceId),
    sql`${documents.status} in ('draft', 'pending_review')`,
    lte(documents.createdAt, thirtyDaysBeforeRef),
  ];

  // If dateFrom is provided, only include documents created after dateFrom
  if (dateFrom) {
    filters.push(gte(documents.createdAt, new Date(dateFrom)));
  }

  const overdueDocuments = await db
    .select({
      id: documents.id,
      documentNumber: documents.documentNumber,
      title: documents.title,
      status: documents.status,
      createdAt: documents.createdAt,
    })
    .from(documents)
    .where(and(...filters));

  const headers = ["ID", "Document Number", "Title", "Status", "Created At"];
  const rows: ReportRow[] = overdueDocuments.map((d) => ({
    ID: d.id,
    "Document Number": d.documentNumber,
    Title: d.title,
    Status: d.status,
    "Created At": d.createdAt?.toISOString() ?? "",
  }));

  return { headers, rows };
}

function buildDateFilters(
  dateColumn: Parameters<typeof gte>[0],
  dateFrom?: string,
  dateTo?: string,
) {
  const filters = [];
  if (dateFrom) {
    filters.push(gte(dateColumn, new Date(dateFrom)));
  }
  if (dateTo) {
    filters.push(lte(dateColumn, new Date(dateTo)));
  }
  return filters;
}

function encodeAsCsv(headers: string[], rows: ReportRow[]): string {
  const headerLine = headers.map((h) => escapeCsvField(h)).join(",");
  const dataLines = rows.map((row) =>
    headers.map((h) => escapeCsvField(String(row[h] ?? ""))).join(","),
  );
  return [headerLine, ...dataLines].join("\n");
}

function encodeAsXlsx(headers: string[], rows: ReportRow[]): Buffer {
  const sheetData = rows.map((row) => {
    const obj: Record<string, string | number | null> = {};
    for (const h of headers) {
      obj[h] = row[h] ?? "";
    }
    return obj;
  });

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(sheetData, { header: headers });
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

const REPORT_GENERATORS: Record<
  string,
  (ws: string, from?: string, to?: string) => Promise<{ headers: string[]; rows: ReportRow[] }>
> = {
  "system-usage": generateSystemUsage,
  "storage-growth": generateStorageGrowth,
  "user-activity": generateUserActivity,
  "document-ingest": generateDocumentIngest,
  "ocr-success-rate": generateOcrSuccessRate,
  "pl-coverage": generatePlCoverage,
  "work-ledger-summary": generateWorkLedgerSummary,
  "overdue-analysis": generateOverdueAnalysis,
};

export const reportsRouter = router({
  /** List available report types */
  listReportTypes: engineerProcedure.query(() => {
    return [...REPORT_TYPES];
  }),

  /** Generate a report with real aggregation queries */
  generateReport: engineerProcedure
    .input(
      z.object({
        type: z.string(),
        dateRange: z
          .object({
            from: z.string().optional(),
            to: z.string().optional(),
          })
          .optional(),
        format: z.enum(["csv", "xlsx"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const workspaceId = requireWorkspaceId(ctx);
      const generator = REPORT_GENERATORS[input.type];

      if (!generator) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unknown report type: ${input.type}`,
        });
      }

      const { headers, rows } = await generator(
        workspaceId,
        input.dateRange?.from,
        input.dateRange?.to,
      );

      if (input.format === "csv") {
        const csv = encodeAsCsv(headers, rows);
        const data = Buffer.from(csv, "utf-8").toString("base64");
        return {
          data,
          filename: `${input.type}-report.csv`,
          mimeType: "text/csv" as const,
        };
      }

      // XLSX format
      const buffer = encodeAsXlsx(headers, rows);
      const data = Buffer.from(buffer).toString("base64");
      return {
        data,
        filename: `${input.type}-report.xlsx`,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" as const,
      };
    }),
});
