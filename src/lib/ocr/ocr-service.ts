/**
 * OCR Service
 *
 * Manages the OCR processing pipeline:
 * - Queue documents for OCR processing
 * - Track job status and progress
 * - Generate mock extraction results (for dev mode)
 * - Parse structured data from OCR text
 *
 * In production, this will integrate with BullMQ and Tesseract workers.
 */

import { MOCK_OCR_JOBS } from "@/lib/mock-data/ocr-jobs";
import type { OcrJob, OcrJobStatus, OcrPriority } from "./pipeline-config";
import { OCR_PIPELINE_CONFIG } from "./pipeline-config";
import { extractStructuredData } from "./structured-extraction";
import { calculateTiles } from "./tile-processor";

// In-memory store (mutable copy of mock data)
let ocrJobs: OcrJob[] = [...MOCK_OCR_JOBS];

// --- Query Functions ---

export interface OcrJobListParams {
  status?: OcrJobStatus;
  priority?: OcrPriority;
  limit?: number;
  offset?: number;
}

export function listOcrJobs(params: OcrJobListParams = {}) {
  let filtered = [...ocrJobs];

  if (params.status) {
    filtered = filtered.filter((j) => j.status === params.status);
  }
  if (params.priority) {
    filtered = filtered.filter((j) => j.priority === params.priority);
  }

  // Sort by createdAt descending (newest first)
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = filtered.length;
  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;
  const data = filtered.slice(offset, offset + limit);

  return { data, total };
}

export function getOcrJob(jobId: string): OcrJob | null {
  return ocrJobs.find((j) => j.id === jobId) ?? null;
}

export function getOcrJobByDocumentId(documentId: string): OcrJob | null {
  // Return the latest job for the document
  const jobs = ocrJobs
    .filter((j) => j.documentId === documentId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return jobs[0] ?? null;
}

// --- Queue Functions ---

let jobCounter = ocrJobs.length + 1;

export interface QueueDocumentInput {
  documentId: string;
  documentNumber: string;
  documentTitle: string;
  pages: number;
  priority?: OcrPriority;
}

export function queueDocument(input: QueueDocumentInput): OcrJob {
  const id = `ocr-job-${String(jobCounter++).padStart(3, "0")}`;
  // Estimate tiles based on assumed A1 drawing size (7016x4960 at 400dpi)
  const estimatedTiles = calculateTiles(7016, 4960).length * input.pages;

  const job: OcrJob = {
    id,
    documentId: input.documentId,
    documentNumber: input.documentNumber,
    documentTitle: input.documentTitle,
    status: "QUEUED",
    priority: input.priority ?? "normal",
    pagesTotal: input.pages,
    pagesProcessed: 0,
    tilesTotal: estimatedTiles,
    tilesProcessed: 0,
    confidence: null,
    structuredOutput: null,
    rawText: null,
    error: null,
    retryCount: 0,
    maxRetries: OCR_PIPELINE_CONFIG.retry_count,
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    duration: null,
  };

  ocrJobs = [job, ...ocrJobs];
  return job;
}

// --- Job Management ---

export function retryJob(jobId: string): OcrJob | null {
  const job = ocrJobs.find((j) => j.id === jobId);
  if (!job) return null;
  if (job.status !== "FAILED") return null;
  if (job.retryCount >= job.maxRetries) return null;

  job.status = "QUEUED";
  job.retryCount += 1;
  job.error = null;
  job.pagesProcessed = 0;
  job.tilesProcessed = 0;
  job.startedAt = null;
  job.completedAt = null;
  job.duration = null;

  return job;
}

export function cancelJob(jobId: string): OcrJob | null {
  const job = ocrJobs.find((j) => j.id === jobId);
  if (!job) return null;
  if (job.status === "COMPLETED" || job.status === "CANCELLED") return null;

  job.status = "CANCELLED";
  job.error = "Cancelled by user";

  return job;
}

// --- Processing (Mock) ---

/**
 * Simulate processing a document. Returns mock structured output.
 * In production, this would be handled by the BullMQ worker with Tesseract.
 */
export function processDocument(jobId: string): OcrJob | null {
  const job = ocrJobs.find((j) => j.id === jobId);
  if (!job) return null;

  // Simulate successful processing with mock OCR text
  const mockRawText = generateMockOcrText(job.documentNumber, job.documentTitle);
  const structured = extractStructuredData(mockRawText);

  job.status = "COMPLETED";
  job.pagesProcessed = job.pagesTotal;
  job.tilesProcessed = job.tilesTotal;
  job.confidence = structured.confidence;
  job.structuredOutput = structured;
  job.rawText = mockRawText;
  job.startedAt = job.startedAt ?? new Date().toISOString();
  job.completedAt = new Date().toISOString();
  job.duration = Math.floor(Math.random() * 300) + 60;

  return job;
}

// --- Stats ---

export interface OcrStats {
  totalJobs: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  avgConfidence: number;
  avgDuration: number;
  failureRate: number;
  processingRate: number;
}

export function getOcrStats(): OcrStats {
  const total = ocrJobs.length;
  const byStatus = {
    queued: ocrJobs.filter((j) => j.status === "QUEUED").length,
    processing: ocrJobs.filter((j) => j.status === "PROCESSING").length,
    completed: ocrJobs.filter((j) => j.status === "COMPLETED").length,
    failed: ocrJobs.filter((j) => j.status === "FAILED").length,
    cancelled: ocrJobs.filter((j) => j.status === "CANCELLED").length,
  };

  const completedJobs = ocrJobs.filter((j) => j.status === "COMPLETED");
  const avgConfidence =
    completedJobs.length > 0
      ? Math.round(
          completedJobs.reduce((sum, j) => sum + (j.confidence ?? 0), 0) / completedJobs.length,
        )
      : 0;

  const jobsWithDuration = completedJobs.filter((j) => j.duration != null);
  const avgDuration =
    jobsWithDuration.length > 0
      ? Math.round(
          jobsWithDuration.reduce((sum, j) => sum + (j.duration ?? 0), 0) / jobsWithDuration.length,
        )
      : 0;

  const processedJobs = byStatus.completed + byStatus.failed;
  const failureRate = processedJobs > 0 ? Math.round((byStatus.failed / processedJobs) * 100) : 0;

  // Jobs completed per hour (mock: assume 8 hour workday)
  const processingRate =
    completedJobs.length > 0 ? Math.round((completedJobs.length / 8) * 10) / 10 : 0;

  return {
    totalJobs: total,
    ...byStatus,
    avgConfidence,
    avgDuration,
    failureRate,
    processingRate,
  };
}

// --- Helpers ---

function generateMockOcrText(documentNumber: string, title: string): string {
  const plNumbers = [
    String(Math.floor(10000000 + Math.random() * 90000000)),
    String(Math.floor(10000000 + Math.random() * 90000000)),
  ];

  return [
    documentNumber,
    `TITLE: ${title}`,
    "R2",
    "SCALE 1:10",
    "SHEET 1 OF 3",
    `${new Date().toLocaleDateString("en-GB")}`,
    "APPROVED BY: Shri R K Sharma",
    `PL ITEMS: ${plNumbers.join(", ")}`,
    "MATERIAL: IS 2062 Grade E350",
    "TOLERANCE: +/- 0.5mm",
    "ALL DIMENSIONS IN MM UNLESS OTHERWISE SPECIFIED",
  ].join("\n");
}
