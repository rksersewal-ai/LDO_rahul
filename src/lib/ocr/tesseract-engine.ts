import { createWorker, type Worker as TesseractWorker } from "tesseract.js";

export interface OcrResult {
  text: string;
  confidence: number;
  wordConfidences: Array<{ word: string; confidence: number }>;
}

const TIMEOUT_MS = 120_000; // 120 seconds

/**
 * Recognize text from an image buffer using tesseract.js.
 * Returns extracted text, average confidence, and per-word confidences.
 * Never throws - on any error or timeout, returns a degraded result.
 */
export async function recognizeImage(imageBuffer: Buffer, _mimeType: string): Promise<OcrResult> {
  let worker: TesseractWorker | null = null;

  try {
    const result = await Promise.race([
      (async () => {
        worker = await createWorker("eng");
        const { data } = await worker.recognize(imageBuffer);

        // Extract word-level confidences from nested block structure
        const wordConfidences: Array<{ word: string; confidence: number }> = [];
        if (data.blocks) {
          for (const block of data.blocks) {
            for (const paragraph of block.paragraphs) {
              for (const line of paragraph.lines) {
                for (const word of line.words) {
                  wordConfidences.push({
                    word: word.text,
                    confidence: word.confidence / 100,
                  });
                }
              }
            }
          }
        }

        const avgConfidence =
          wordConfidences.length > 0
            ? wordConfidences.reduce((sum, w) => sum + w.confidence, 0) / wordConfidences.length
            : 0;

        return {
          text: data.text ?? "",
          confidence: avgConfidence,
          wordConfidences,
        };
      })(),
      new Promise<OcrResult>((_, reject) =>
        setTimeout(() => reject(new Error("Tesseract OCR timed out")), TIMEOUT_MS),
      ),
    ]);

    return result;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown OCR error";
    console.error("[tesseract-engine] OCR failed:", message);
    return { text: "", confidence: 0, wordConfidences: [] };
  } finally {
    if (worker) {
      try {
        await (worker as TesseractWorker).terminate();
      } catch {
        // Ignore termination errors
      }
    }
  }
}
