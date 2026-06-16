// @ts-expect-error - sharp types not resolved with bundler moduleResolution
import sharp from "sharp";
import { OCR_PIPELINE_CONFIG } from "./pipeline-config";

/**
 * Stage 3 rasterization. Renders PDF pages to images on-demand at a classified
 * DPI, applying preprocessing tuned to the document type.
 *
 * We use sharp/libvips (already a dependency) rather than pdf2pic so the stack
 * stays pure Node with no extra system binaries (GraphicsMagick/Ghostscript).
 * libvips' `density` option is the DPI for vector rasterization.
 */

export type RenderProfileName = "standard" | "fineprint" | "drawing" | "lowquality";

export interface RenderProfile {
  /** Render DPI. Square DPI (NxN) is used implicitly by libvips density. */
  dpi: number;
  grayscale: boolean;
  /** Apply deskew-ish normalisation + sharpening for OCR legibility. */
  preprocess: boolean;
}

/**
 * DPI / preprocessing matrix (adapted from the architecture spec). Color is
 * preserved for drawings; text profiles use grayscale + normalisation.
 */
export const RENDER_PROFILES: Record<RenderProfileName, RenderProfile> = {
  standard: { dpi: 300, grayscale: true, preprocess: true },
  fineprint: { dpi: 400, grayscale: true, preprocess: true },
  drawing: { dpi: 300, grayscale: false, preprocess: false },
  lowquality: { dpi: 300, grayscale: true, preprocess: true },
};

/** Number of pages in a PDF, via the rasterizer (fallback when pdf-parse fails). */
export async function getPdfPageCount(buffer: Buffer): Promise<number> {
  try {
    const meta = await sharp(buffer, { pages: -1 }).metadata();
    return (meta.pages as number | undefined) ?? 1;
  } catch {
    return 1;
  }
}

/**
 * Render a single 0-based PDF page to a PNG buffer at the profile's DPI, with
 * OCR-oriented preprocessing. To bound memory on very large drawings, the DPI
 * is reduced if the rendered page would exceed the pixel ceiling.
 */
export async function renderPdfPage(
  buffer: Buffer,
  pageIndex: number,
  profile: RenderProfile,
): Promise<Buffer> {
  let dpi = profile.dpi;

  // Probe the page at the requested DPI; if it blows the pixel budget, scale
  // the DPI down proportionally so the rendered raster stays bounded.
  try {
    const probe = await sharp(buffer, { page: pageIndex, density: dpi }).metadata();
    const pixels = (probe.width ?? 0) * (probe.height ?? 0);
    if (pixels > OCR_PIPELINE_CONFIG.max_pixels && pixels > 0) {
      const scale = Math.sqrt(OCR_PIPELINE_CONFIG.max_pixels / pixels);
      dpi = Math.max(120, Math.floor(dpi * scale));
    }
  } catch {
    // Ignore probe failures; the render below will surface real errors.
  }

  let pipeline = sharp(buffer, { page: pageIndex, density: dpi });
  if (profile.grayscale) pipeline = pipeline.grayscale();
  if (profile.preprocess) {
    // Normalise contrast then mild sharpen — improves Tesseract accuracy on
    // low-contrast and fine-print scans without destroying line work.
    pipeline = pipeline.normalize().sharpen();
  }
  return pipeline.png().toBuffer();
}

/** Read width/height of an image buffer (for tiling decisions). */
export async function imageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
  try {
    const meta = await sharp(buffer).metadata();
    return { width: meta.width ?? 0, height: meta.height ?? 0 };
  } catch {
    return { width: 0, height: 0 };
  }
}

/** Extract a rectangular tile from an image buffer (for large-drawing tiling). */
export async function extractTile(
  buffer: Buffer,
  rect: { x: number; y: number; width: number; height: number },
): Promise<Buffer> {
  return sharp(buffer)
    .extract({ left: rect.x, top: rect.y, width: rect.width, height: rect.height })
    .png()
    .toBuffer();
}
