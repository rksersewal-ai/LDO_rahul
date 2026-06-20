import { createWorker, type Worker as TesseractWorker } from "tesseract.js";
import type { OcrResult } from "./tesseract-engine";

/**
 * A pooled OCR session: a single tesseract.js worker reused across every page
 * and tile of one job. Creating a worker costs ~2–3s (WASM + traineddata load),
 * so reusing it across a multi-page scan is a large speedup vs. the previous
 * "new worker per call" approach.
 *
 * The worker is recycled after `recycleAfter` recognitions to bound WASM heap
 * growth on very large documents, and always terminated on close().
 */
const RECOGNIZE_TIMEOUT_MS = Number(process.env.OCR_RECOGNIZE_TIMEOUT_MS ?? "120000");
const DEFAULT_RECYCLE_AFTER = Number(process.env.OCR_WORKER_RECYCLE_AFTER ?? "50");

export interface OcrSession {
  recognize(image: Buffer): Promise<OcrResult>;
  close(): Promise<void>;
}

function toResult(data: {
  text?: string;
  blocks?: Array<{
    paragraphs: Array<{ lines: Array<{ words: Array<{ text: string; confidence: number }> }> }>;
  }> | null;
}): OcrResult {
  const wordConfidences: Array<{ word: string; confidence: number }> = [];
  if (data.blocks) {
    for (const block of data.blocks) {
      for (const paragraph of block.paragraphs) {
        for (const line of paragraph.lines) {
          for (const word of line.words) {
            wordConfidences.push({ word: word.text, confidence: word.confidence / 100 });
          }
        }
      }
    }
  }
  const confidence =
    wordConfidences.length > 0
      ? wordConfidences.reduce((sum, w) => sum + w.confidence, 0) / wordConfidences.length
      : 0;
  return { text: data.text ?? "", confidence, wordConfidences };
}

/**
 * Create an OCR session backed by a reusable tesseract worker.
 * `recognize` never throws — on error/timeout it returns a degraded empty
 * result and recycles the worker so subsequent pages can still proceed.
 */
export async function createOcrSession(
  lang = "eng",
  recycleAfter = DEFAULT_RECYCLE_AFTER,
): Promise<OcrSession> {
  let worker: TesseractWorker | null = await createWorker(lang);
  let sinceRecycle = 0;

  async function ensureWorker(): Promise<TesseractWorker> {
    if (!worker) worker = await createWorker(lang);
    return worker;
  }

  async function recycle(): Promise<void> {
    if (worker) {
      try {
        await worker.terminate();
      } catch {
        // ignore
      }
      worker = null;
    }
    sinceRecycle = 0;
  }

  return {
    async recognize(image: Buffer): Promise<OcrResult> {
      try {
        const w = await ensureWorker();
        const result = await Promise.race([
          w.recognize(image).then(({ data }) => toResult(data)),
          new Promise<OcrResult>((_, reject) =>
            setTimeout(() => reject(new Error("Tesseract OCR timed out")), RECOGNIZE_TIMEOUT_MS),
          ),
        ]);

        sinceRecycle++;
        if (sinceRecycle >= recycleAfter) {
          await recycle();
        }
        return result;
      } catch {
        // Recycle on any failure so a bad page can't poison the rest of the job.
        await recycle();
        return { text: "", confidence: 0, wordConfidences: [] };
      }
    },

    async close(): Promise<void> {
      await recycle();
    },
  };
}
