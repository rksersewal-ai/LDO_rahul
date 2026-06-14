import pdf from "pdf-parse";

/**
 * Stage 1 (digital-first gate) + Stage 2 (classification) of the hybrid OCR
 * pipeline.
 *
 * Goal: route editable/native PDFs straight through deterministic text
 * extraction (zero OCR), and only fall back to image OCR for the specific pages
 * that genuinely need it. For mixed ("hybrid") PDFs we extract native pages and
 * mark only the image pages for OCR, so a document is never processed twice.
 */

/** A native page that has fewer than this many characters is treated as scanned. */
export const PER_PAGE_MIN_CHARS = Number(process.env.OCR_PER_PAGE_MIN_CHARS ?? "50");
/** A whole PDF with fewer than this many native chars is treated as scanned. */
export const NATIVE_MIN_CHARS = Number(process.env.OCR_NATIVE_MIN_CHARS ?? "100");

export type DocumentModality =
  | "native-pdf" // every page has good embedded text
  | "scanned-pdf" // no usable embedded text (image-only)
  | "hybrid-pdf" // some native pages, some image pages
  | "image" // a standalone image file
  | "unknown";

export interface PageGate {
  pageNumber: number; // 1-based
  nativeText: string;
  charCount: number;
  needsOcr: boolean;
}

export interface TextQuality {
  trimmedLength: number;
  charsPerPage: number;
  printableRatio: number;
  alphaWordRatio: number;
  entropy: number;
  isNative: boolean;
  /** 0..1 confidence that the extracted native text is usable as-is. */
  score: number;
}

export interface ClassificationResult {
  modality: DocumentModality;
  pageCount: number;
  /** Concatenated native text (may be partial for hybrid PDFs). */
  nativeText: string;
  pages: PageGate[];
  quality: TextQuality;
}

/** Shannon entropy (bits/char) of a string. Natural prose sits around 3.5–4.5. */
function shannonEntropy(text: string): number {
  if (!text.length) return 0;
  const freq = new Map<string, number>();
  for (const ch of text) freq.set(ch, (freq.get(ch) ?? 0) + 1);
  let entropy = 0;
  for (const count of freq.values()) {
    const p = count / text.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Composite text-quality assessment. Extracted text can be present but garbled
 * (bad encodings, ligature soup, mostly symbols), so length alone is not enough.
 */
export function assessTextQuality(text: string, pageCount: number): TextQuality {
  const trimmed = text.trim();
  const trimmedLength = trimmed.length;
  const charsPerPage = trimmedLength / Math.max(pageCount, 1);

  let printable = 0;
  for (const ch of trimmed) {
    const code = ch.codePointAt(0) ?? 0;
    // Printable ASCII, plus common whitespace and Latin-1 letters.
    if ((code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13 || code >= 160) {
      printable++;
    }
  }
  const printableRatio = trimmedLength > 0 ? printable / trimmedLength : 0;

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  const alphaWords = tokens.filter((t) => /[A-Za-z]{2,}/.test(t)).length;
  const alphaWordRatio = tokens.length > 0 ? alphaWords / tokens.length : 0;

  const entropy = shannonEntropy(trimmed.slice(0, 4000));

  const isNative =
    trimmedLength >= NATIVE_MIN_CHARS &&
    charsPerPage >= PER_PAGE_MIN_CHARS &&
    printableRatio > 0.85 &&
    alphaWordRatio > 0.5 &&
    entropy > 2.5;

  // A bounded confidence score for the native extraction.
  const lengthScore = Math.min(1, charsPerPage / 400);
  const score = Math.max(
    0,
    Math.min(
      1,
      0.4 * lengthScore +
        0.3 * printableRatio +
        0.2 * alphaWordRatio +
        0.1 * Math.min(1, entropy / 4.5),
    ),
  );

  return { trimmedLength, charsPerPage, printableRatio, alphaWordRatio, entropy, isNative, score };
}

/** Default text renderer mirroring pdf-parse's built-in, used to capture per-page text. */
async function renderPageText(pageData: {
  getTextContent: (opts: {
    normalizeWhitespace: boolean;
    disableCombineTextItems: boolean;
  }) => Promise<{ items: Array<{ str: string; transform: number[] }> }>;
}): Promise<string> {
  const content = await pageData.getTextContent({
    normalizeWhitespace: false,
    disableCombineTextItems: false,
  });
  let lastY: number | undefined;
  let text = "";
  for (const item of content.items) {
    if (lastY === item.transform[5] || lastY === undefined) {
      text += item.str;
    } else {
      text += `\n${item.str}`;
    }
    lastY = item.transform[5];
  }
  return text;
}

/**
 * Classify a PDF and produce a per-page routing plan. Uses pdf-parse's
 * `pagerender` hook to capture each page's text in order so we can detect
 * image-only pages individually (hybrid routing).
 */
export async function classifyPdf(buffer: Buffer): Promise<ClassificationResult> {
  const perPageText: string[] = [];

  try {
    const data = await pdf(buffer, {
      pagerender: async (pageData: Parameters<typeof renderPageText>[0]) => {
        const text = await renderPageText(pageData);
        perPageText.push(text);
        return text;
      },
    });

    const pageCount = data.numpages || perPageText.length || 1;
    const fullText = data.text ?? perPageText.join("\n");
    const quality = assessTextQuality(fullText, pageCount);

    // Per-page gate. If pagerender produced fewer entries than numpages (some
    // PDFs don't invoke it for image-only pages), pad with empty pages.
    const pages: PageGate[] = [];
    for (let i = 0; i < pageCount; i++) {
      const nativeText = perPageText[i] ?? "";
      const charCount = nativeText.trim().length;
      pages.push({
        pageNumber: i + 1,
        nativeText,
        charCount,
        needsOcr: charCount < PER_PAGE_MIN_CHARS,
      });
    }

    const ocrPages = pages.filter((p) => p.needsOcr).length;
    let modality: DocumentModality;
    if (ocrPages === 0) modality = "native-pdf";
    else if (ocrPages === pages.length) modality = "scanned-pdf";
    else modality = "hybrid-pdf";

    return { modality, pageCount, nativeText: fullText, pages, quality };
  } catch {
    // pdf-parse failed (corrupt/encrypted/image-only). Treat as scanned; the
    // orchestrator will discover the real page count via the rasterizer.
    return {
      modality: "scanned-pdf",
      pageCount: 0,
      nativeText: "",
      pages: [],
      quality: assessTextQuality("", 1),
    };
  }
}

/** Classify any supported document by MIME type. */
export async function classifyDocument(
  buffer: Buffer,
  mimeType: string,
): Promise<ClassificationResult> {
  if (mimeType === "application/pdf") {
    return classifyPdf(buffer);
  }
  if (mimeType.startsWith("image/")) {
    return {
      modality: "image",
      pageCount: 1,
      nativeText: "",
      pages: [{ pageNumber: 1, nativeText: "", charCount: 0, needsOcr: true }],
      quality: assessTextQuality("", 1),
    };
  }
  return {
    modality: "unknown",
    pageCount: 1,
    nativeText: "",
    pages: [],
    quality: assessTextQuality("", 1),
  };
}
