import { logWarn } from "@/lib/logging/structured-logger";
import { createOcrSession, type OcrSession } from "./ocr-engine-pool";
import { type ClassificationResult, classifyDocument } from "./pdf-classifier";
import {
  extractTile,
  getPdfPageCount,
  imageDimensions,
  RENDER_PROFILES,
  type RenderProfileName,
  renderPdfPage,
} from "./pdf-to-image";
import { OCR_PIPELINE_CONFIG } from "./pipeline-config";
import { calculateTiles, mergeTileResults, requiresTiling } from "./tile-processor";

/**
 * Hybrid OCR orchestrator (digital-first with adaptive fallback).
 *
 *   Stage 1  Fast text gate   — native PDFs return immediately, zero OCR.
 *   Stage 2  Classification   — native / scanned / hybrid / image.
 *   Stage 3  Adaptive OCR     — render + OCR only the pages that need it, at a
 *                               DPI/preprocessing profile suited to the doc,
 *                               tiling very large drawings.
 */

export type ExtractionMethod = "native" | "ocr" | "failed";

export interface HybridPageResult {
  pageNumber: number;
  method: ExtractionMethod;
  text: string;
  confidence: number;
  dpiUsed: number | null;
}

export interface HybridOcrResult {
  /** Overall method: native (no OCR at all), ocr (all pages), or hybrid (mix). */
  method: "native" | "ocr" | "hybrid";
  pageCount: number;
  ocrPageCount: number;
  text: string;
  confidence: number;
  pages: HybridPageResult[];
  modality: ClassificationResult["modality"];
}

export interface HybridProgress {
  stage: "classify" | "ocr";
  currentPage: number;
  totalPages: number;
}

export interface RunHybridOptions {
  /** Chosen render profile for OCR pages (default: standard 300 DPI grayscale). */
  profile?: RenderProfileName;
  onProgress?: (p: HybridProgress) => void | Promise<void>;
}

/** OCR one image buffer, tiling it first if it is a very large drawing. */
async function ocrImage(
  session: OcrSession,
  image: Buffer,
): Promise<{ text: string; confidence: number }> {
  const { width, height } = await imageDimensions(image);

  if (!width || !height || !requiresTiling(width, height)) {
    const r = await session.recognize(image);
    return { text: r.text, confidence: r.confidence };
  }

  // Large drawing: OCR overlapping tiles and merge (dedup overlap text).
  const tiles = calculateTiles(width, height);
  const texts: string[] = [];
  let confSum = 0;
  let confN = 0;
  for (const tile of tiles) {
    try {
      const tileBuf = await extractTile(image, {
        x: tile.x,
        y: tile.y,
        width: tile.width,
        height: tile.height,
      });
      const r = await session.recognize(tileBuf);
      texts.push(r.text);
      if (r.confidence > 0) {
        confSum += r.confidence;
        confN += 1;
      }
    } catch (error) {
      logWarn("[hybrid-ocr] Tile OCR failed; skipping tile", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return { text: mergeTileResults(texts), confidence: confN > 0 ? confSum / confN : 0 };
}

/**
 * Run the hybrid pipeline over a document buffer. Never throws for content
 * reasons — pages that fail to render/OCR are reported with method "failed".
 */
export async function runHybridOcr(
  buffer: Buffer,
  mimeType: string,
  options: RunHybridOptions = {},
): Promise<HybridOcrResult> {
  const profileName = options.profile ?? "standard";
  const profile = RENDER_PROFILES[profileName];

  await options.onProgress?.({ stage: "classify", currentPage: 0, totalPages: 0 });
  const classification = await classifyDocument(buffer, mimeType);

  // --- Stage 1 fast path: fully native PDF → zero OCR --------------------
  if (classification.modality === "native-pdf") {
    return {
      method: "native",
      pageCount: classification.pageCount,
      ocrPageCount: 0,
      text: classification.nativeText,
      confidence: Math.max(0.9, classification.quality.score),
      modality: classification.modality,
      pages: classification.pages.map((p) => ({
        pageNumber: p.pageNumber,
        method: "native" as const,
        text: p.nativeText,
        confidence: 0.99,
        dpiUsed: null,
      })),
    };
  }

  // --- Standalone image -------------------------------------------------
  if (classification.modality === "image" || !mimeType.startsWith("application/pdf")) {
    const session = await createOcrSession();
    try {
      await options.onProgress?.({ stage: "ocr", currentPage: 1, totalPages: 1 });
      const { text, confidence } = await ocrImage(session, buffer);
      const ok = text.trim().length > 0;
      return {
        method: "ocr",
        pageCount: 1,
        ocrPageCount: 1,
        text,
        confidence: ok ? confidence : 0.3,
        modality: "image",
        pages: [
          {
            pageNumber: 1,
            method: ok ? "ocr" : "failed",
            text,
            confidence: ok ? confidence : 0.3,
            dpiUsed: null,
          },
        ],
      };
    } finally {
      await session.close();
    }
  }

  // --- Scanned / hybrid PDF: OCR only the pages that need it ------------
  let pageCount = classification.pageCount;
  let gate = classification.pages;
  // pdf-parse failed entirely → discover page count via the rasterizer.
  if (pageCount === 0 || gate.length === 0) {
    pageCount = Math.min(await getPdfPageCount(buffer), OCR_PIPELINE_CONFIG.max_pages);
    gate = Array.from({ length: pageCount }, (_, i) => ({
      pageNumber: i + 1,
      nativeText: "",
      charCount: 0,
      needsOcr: true,
    }));
  }

  const cappedPages = Math.min(pageCount, OCR_PIPELINE_CONFIG.max_pages);
  const ocrTargets = gate.slice(0, cappedPages).filter((p) => p.needsOcr);
  const totalOcr = ocrTargets.length;

  const session = await createOcrSession();
  const pages: HybridPageResult[] = [];
  let done = 0;

  try {
    for (const page of gate.slice(0, cappedPages)) {
      if (!page.needsOcr) {
        // Native page — use the text we already extracted, no rendering.
        pages.push({
          pageNumber: page.pageNumber,
          method: "native",
          text: page.nativeText,
          confidence: 0.99,
          dpiUsed: null,
        });
        continue;
      }

      done += 1;
      await options.onProgress?.({ stage: "ocr", currentPage: done, totalPages: totalOcr });

      try {
        const img = await renderPdfPage(buffer, page.pageNumber - 1, profile);
        const { text, confidence } = await ocrImage(session, img);
        const ok = text.trim().length > 0;
        pages.push({
          pageNumber: page.pageNumber,
          method: ok ? "ocr" : "failed",
          text,
          confidence: ok ? confidence : 0.3,
          dpiUsed: profile.dpi,
        });
      } catch (error) {
        logWarn("[hybrid-ocr] Page render/OCR failed", {
          code: String(page.pageNumber),
          error: error instanceof Error ? error.message : String(error),
        });
        pages.push({
          pageNumber: page.pageNumber,
          method: "failed",
          text: "",
          confidence: 0,
          dpiUsed: profile.dpi,
        });
      }
    }
  } finally {
    await session.close();
  }

  pages.sort((a, b) => a.pageNumber - b.pageNumber);
  const mergedText = pages
    .map((p) => p.text)
    .filter((t) => t.trim().length > 0)
    .join("\n\n");

  const nativeCount = pages.filter((p) => p.method === "native").length;
  const ocrConfidences = pages.filter((p) => p.method === "ocr").map((p) => p.confidence);
  const avgOcrConfidence =
    ocrConfidences.length > 0
      ? ocrConfidences.reduce((s, c) => s + c, 0) / ocrConfidences.length
      : 0;

  const method: HybridOcrResult["method"] = nativeCount > 0 ? "hybrid" : "ocr";

  return {
    method,
    pageCount: cappedPages,
    ocrPageCount: totalOcr,
    text: mergedText,
    // Blend: native pages are high-confidence, OCR pages use measured confidence.
    confidence:
      pages.length > 0
        ? (nativeCount * 0.99 + ocrConfidences.reduce((s, c) => s + c, 0)) / pages.length
        : avgOcrConfidence,
    modality: classification.modality,
    pages,
  };
}
