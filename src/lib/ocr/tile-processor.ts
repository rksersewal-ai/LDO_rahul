/**
 * Tile Processor for Large Image OCR
 *
 * Splits large engineering drawings into overlapping tiles for
 * parallel OCR processing. No actual image manipulation is done
 * in mock mode - this module calculates tile coordinates only.
 *
 * Tiling is applied when image dimensions exceed min_dimension_for_tiling.
 */

import { OCR_PIPELINE_CONFIG, type TileCoordinate } from "./pipeline-config";

/**
 * Calculate overlapping tile coordinates for an image.
 *
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @param tileSize - Size of each tile (default from config)
 * @param overlapPercent - Overlap between tiles as percentage (default from config)
 * @returns Array of tile coordinates with positions and dimensions
 */
export function calculateTiles(
  width: number,
  height: number,
  tileSize: number = OCR_PIPELINE_CONFIG.tile_size,
  overlapPercent: number = OCR_PIPELINE_CONFIG.overlap_percent,
): TileCoordinate[] {
  const tiles: TileCoordinate[] = [];

  // If image is smaller than min dimension, return single tile
  if (
    width <= OCR_PIPELINE_CONFIG.min_dimension_for_tiling &&
    height <= OCR_PIPELINE_CONFIG.min_dimension_for_tiling
  ) {
    return [{ x: 0, y: 0, width, height, index: 0 }];
  }

  const overlapPx = Math.floor(tileSize * (overlapPercent / 100));
  const stepSize = tileSize - overlapPx;

  let index = 0;

  for (let y = 0; y < height; y += stepSize) {
    for (let x = 0; x < width; x += stepSize) {
      const tileWidth = Math.min(tileSize, width - x);
      const tileHeight = Math.min(tileSize, height - y);

      tiles.push({
        x,
        y,
        width: tileWidth,
        height: tileHeight,
        index,
      });

      index++;

      // Stop if we've covered the full width
      if (x + tileSize >= width) break;
    }
    // Stop if we've covered the full height
    if (y + tileSize >= height) break;
  }

  return tiles;
}

/**
 * Check if an image requires tiling based on its dimensions.
 */
export function requiresTiling(width: number, height: number): boolean {
  return (
    width > OCR_PIPELINE_CONFIG.min_dimension_for_tiling ||
    height > OCR_PIPELINE_CONFIG.min_dimension_for_tiling
  );
}

/**
 * Validate image dimensions against pipeline constraints.
 */
export function validateImageDimensions(
  width: number,
  height: number,
): { valid: boolean; reason?: string } {
  const totalPixels = width * height;
  if (totalPixels > OCR_PIPELINE_CONFIG.max_pixels) {
    return {
      valid: false,
      reason: `Image exceeds maximum pixel count: ${totalPixels} > ${OCR_PIPELINE_CONFIG.max_pixels}`,
    };
  }
  return { valid: true };
}

/**
 * Merge OCR text results from overlapping tiles.
 * Uses simple line-based deduplication for overlapping regions.
 *
 * @param tileResults - Array of OCR text from each tile, ordered by index
 * @returns Merged text with overlapping content deduplicated
 */
export function mergeTileResults(tileResults: string[]): string {
  if (tileResults.length === 0) return "";
  if (tileResults.length === 1) return tileResults[0];

  const allLines: string[] = [];
  const seenLines = new Set<string>();

  for (const tileText of tileResults) {
    const lines = tileText.split("\n");
    for (const line of lines) {
      const normalized = line.trim().toLowerCase();
      // Skip empty lines always
      if (!normalized) {
        allLines.push("");
        continue;
      }
      // Dedup based on normalized content
      if (!seenLines.has(normalized)) {
        seenLines.add(normalized);
        allLines.push(line);
      }
    }
  }

  return allLines.join("\n");
}

/**
 * Estimate total processing time for a document based on pages and tiling.
 *
 * @param pages - Number of pages
 * @param avgWidth - Average page width in pixels
 * @param avgHeight - Average page height in pixels
 * @returns Estimated processing time in seconds
 */
export function estimateProcessingTime(pages: number, avgWidth: number, avgHeight: number): number {
  const tilesPerPage = calculateTiles(avgWidth, avgHeight).length;
  const totalTiles = tilesPerPage * pages;
  // Assume ~2 seconds per tile with concurrency
  const secondsPerTile = 2;
  const effectiveTime = (totalTiles * secondsPerTile) / OCR_PIPELINE_CONFIG.worker_concurrency;
  return Math.ceil(effectiveTime);
}
