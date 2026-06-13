/**
 * OCR Pipeline Configuration
 * As defined in Product Specification Section 14.
 * These constants control the tiling, processing, and quality thresholds
 * for the document OCR pipeline.
 */

/** OCR job status lifecycle */
export type OcrJobStatus = "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";

/** Priority levels for OCR processing queue */
export type OcrPriority = "high" | "normal" | "low";

/** Structured output from OCR extraction */
export interface OcrStructuredOutput {
  drawingNumber: string | null;
  title: string | null;
  revision: string | null;
  plNumbers: string[];
  rdsoSpecs: string[];
  locoNumbers: string[];
  sheetInfo: string | null;
  scale: string | null;
  date: string | null;
  approvedBy: string | null;
  confidence: number;
  warnings: string[];
}

/** Tile coordinate for image tiling */
export interface TileCoordinate {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
}

/** OCR job record */
export interface OcrJob {
  id: string;
  documentId: string;
  documentNumber: string;
  documentTitle: string;
  status: OcrJobStatus;
  priority: OcrPriority;
  pagesTotal: number;
  pagesProcessed: number;
  tilesTotal: number;
  tilesProcessed: number;
  confidence: number | null;
  structuredOutput: OcrStructuredOutput | null;
  rawText: string | null;
  error: string | null;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null;
}

/** Pipeline configuration constants per Product Spec Section 14 */
export const OCR_PIPELINE_CONFIG = {
  /** Tile size in pixels for large image splitting */
  tile_size: 4096,
  /** Overlap between tiles as a percentage (0-100) */
  overlap_percent: 15,
  /** Target DPI for image preprocessing */
  dpi_target: 400,
  /** Minimum image dimension (px) before tiling is applied */
  min_dimension_for_tiling: 5000,
  /** Maximum total pixels allowed (width * height) */
  max_pixels: 200_000_000,
  /** Maximum file size in megabytes */
  max_file_size_mb: 500,
  /** Maximum number of pages per document */
  max_pages: 100,
  /** Number of concurrent OCR workers */
  worker_concurrency: 4,
  /** Timeout for a single OCR job in seconds */
  ocr_timeout_seconds: 300,
  /** Number of retry attempts for failed jobs */
  retry_count: 3,
  /** Minimum confidence threshold (%) to accept results */
  confidence_threshold: 60,
  /** Threshold for deduplication of overlapping tile text */
  dedup_threshold: 0.6,
} as const;

export type OcrPipelineConfig = typeof OCR_PIPELINE_CONFIG;
