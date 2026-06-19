/**
 * Structured Data Extraction from OCR Text
 *
 * Regex-based extraction of engineering document fields:
 * - PL numbers (8-digit patterns)
 * - Drawing numbers (e.g. CLW/ED/TM/4907/GA)
 * - Revision codes (R1, Rev. 2, etc.)
 * - Dates, title block fields, scale, sheet info
 */

import type { OcrStructuredOutput } from "./pipeline-config";

// --- Regex Patterns ---

/** PL numbers: 8 consecutive digits */
const PL_NUMBER_PATTERN = /\b\d{8}\b/g;

/** Drawing numbers: 2-4 uppercase letters, slash-separated segments with digits */
const DRAWING_NUMBER_PATTERN = /[A-Z]{2,4}\/[A-Z]+\/[A-Z]+\/\d{4}(?:\/[A-Z]+)?/g;

/** Revision codes: R followed by digits, or Rev/Rev. followed by digits */
const REVISION_PATTERN = /\b(?:R\d+|Rev\.?\s*\d+)\b/gi;

/** Date patterns: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, or month names */
const DATE_PATTERN =
  /\b(?:\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})\b/gi;

/** Scale patterns: 1:X or SCALE 1:X */
const SCALE_PATTERN = /\b(?:SCALE\s*)?(\d+\s*:\s*\d+)\b/gi;

/** Sheet info: Sheet X of Y or SH X/Y */
const SHEET_PATTERN = /\b(?:SHEET|SH\.?)\s*(\d+)\s*(?:OF|\/)\s*(\d+)\b/gi;

/** Approved by: common patterns in Indian Railways docs */
const APPROVED_BY_PATTERN =
  /(?:APPROVED\s*(?:BY)?|APPD\.?\s*(?:BY)?)\s*[:-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/gi;

/** RDSO specification numbers: patterns like RDSO/2020/EL/SPEC/0001 or variations */
const RDSO_SPEC_PATTERN =
  /\bRDSO\/\d{4}\/[A-Z]{2,4}\/(?:SPEC|STD|DRG|TCD|CAMTECH|SPN)\/\d{3,5}(?:\/[A-Za-z0-9]+)?\b/g;

/** Loco/rolling stock unit numbers: WAP-7 30001, WAG-9HC 31501, WDP-4D 40201, etc. */
const LOCO_NUMBER_PATTERN = /\b(W[A-Z]{2,3}-\d[A-Z]{0,2})\s+(\d{5})\b/g;

// --- Extraction Functions ---

/**
 * Extract PL numbers (8-digit identifiers) from OCR text.
 */
export function extractPlNumbers(text: string): string[] {
  const matches = text.match(PL_NUMBER_PATTERN);
  if (!matches) return [];
  // Deduplicate
  return [...new Set(matches)];
}

/**
 * Extract drawing number from OCR text.
 * Returns the first match or null.
 */
export function extractDrawingNumber(text: string): string | null {
  const matches = text.match(DRAWING_NUMBER_PATTERN);
  return matches?.[0] ?? null;
}

/**
 * Extract revision code from OCR text.
 * Returns the first match or null.
 */
export function extractRevisionCode(text: string): string | null {
  const matches = text.match(REVISION_PATTERN);
  return matches?.[0] ?? null;
}

/**
 * Extract date from OCR text.
 * Returns the first match or null.
 */
export function extractDate(text: string): string | null {
  const matches = text.match(DATE_PATTERN);
  return matches?.[0] ?? null;
}

/**
 * Extract scale from OCR text.
 */
export function extractScale(text: string): string | null {
  const match = SCALE_PATTERN.exec(text);
  SCALE_PATTERN.lastIndex = 0;
  return match?.[1]?.replace(/\s/g, "") ?? null;
}

/**
 * Extract sheet info from OCR text.
 */
export function extractSheetInfo(text: string): string | null {
  const match = SHEET_PATTERN.exec(text);
  SHEET_PATTERN.lastIndex = 0;
  if (!match) return null;
  return `Sheet ${match[1]} of ${match[2]}`;
}

/**
 * Extract approved-by name from OCR text.
 */
export function extractApprovedBy(text: string): string | null {
  const match = APPROVED_BY_PATTERN.exec(text);
  APPROVED_BY_PATTERN.lastIndex = 0;
  return match?.[1]?.trim() ?? null;
}

/**
 * Attempt to extract a document title from OCR text.
 * Looks for TITLE: prefix or all-caps lines that could be titles.
 */
export function extractTitle(text: string): string | null {
  // Try explicit TITLE: field
  const titleMatch = /(?:TITLE|DESCRIPTION)\s*[:-]\s*(.+)/i.exec(text);
  if (titleMatch?.[1]) {
    return titleMatch[1].trim();
  }
  return null;
}

/**
 * Extract RDSO specification numbers from OCR text.
 * Matches patterns like RDSO/2020/EL/SPEC/0001 or RDSO/2019/MECH/STD/0045/Rev2.
 */
export function extractRdsoSpecNumbers(text: string): string[] {
  const matches = text.match(RDSO_SPEC_PATTERN);
  if (!matches) return [];
  return [...new Set(matches)];
}

/**
 * Extract locomotive/rolling stock unit numbers from OCR text.
 * Matches patterns like WAP-7 30001, WAG-9HC 31501, WDP-4D 40201.
 */
export function extractLocoNumbers(text: string): string[] {
  const results: string[] = [];
  let match: RegExpExecArray | null;
  // Reset lastIndex before use
  LOCO_NUMBER_PATTERN.lastIndex = 0;
  while ((match = LOCO_NUMBER_PATTERN.exec(text)) !== null) {
    results.push(`${match[1]} ${match[2]}`);
  }
  return [...new Set(results)];
}

/**
 * Extract all railway-specific identifiers from OCR text.
 * Returns combined RDSO specs, loco numbers, and drawing numbers.
 */
export function extractRailwayIdentifiers(text: string): {
  rdsoSpecs: string[];
  locoNumbers: string[];
  drawingNumbers: string[];
} {
  const drawingNumber = extractDrawingNumber(text);
  // Also get all drawing number matches (not just first)
  const drawingMatches = text.match(DRAWING_NUMBER_PATTERN);
  const drawingNumbers = drawingMatches ? [...new Set(drawingMatches)] : [];

  return {
    rdsoSpecs: extractRdsoSpecNumbers(text),
    locoNumbers: extractLocoNumbers(text),
    drawingNumbers,
  };
}

/**
 * Extract all structured fields from OCR text.
 * Returns a typed OcrStructuredOutput with confidence and warnings.
 */
export function extractStructuredData(ocrText: string): OcrStructuredOutput {
  const warnings: string[] = [];

  const drawingNumber = extractDrawingNumber(ocrText);
  const title = extractTitle(ocrText);
  const revision = extractRevisionCode(ocrText);
  const plNumbers = extractPlNumbers(ocrText);
  const rdsoSpecs = extractRdsoSpecNumbers(ocrText);
  const locoNumbers = extractLocoNumbers(ocrText);
  const sheetInfo = extractSheetInfo(ocrText);
  const scale = extractScale(ocrText);
  const date = extractDate(ocrText);
  const approvedBy = extractApprovedBy(ocrText);

  // Calculate confidence based on how many fields were extracted
  let fieldsFound = 0;
  const totalFields = 10;

  if (drawingNumber) fieldsFound++;
  if (title) fieldsFound++;
  if (revision) fieldsFound++;
  if (plNumbers.length > 0) fieldsFound++;
  if (rdsoSpecs.length > 0) fieldsFound++;
  if (locoNumbers.length > 0) fieldsFound++;
  if (sheetInfo) fieldsFound++;
  if (scale) fieldsFound++;
  if (date) fieldsFound++;
  if (approvedBy) fieldsFound++;

  const confidence = Math.round((fieldsFound / totalFields) * 100);

  // Generate warnings
  if (!drawingNumber) warnings.push("Drawing number not detected");
  if (!revision) warnings.push("Revision code not found");
  if (plNumbers.length === 0) warnings.push("No PL numbers identified");
  if (confidence < 50) warnings.push("Low extraction confidence - manual review recommended");

  return {
    drawingNumber,
    title,
    revision,
    plNumbers,
    rdsoSpecs,
    locoNumbers,
    sheetInfo,
    scale,
    date,
    approvedBy,
    confidence,
    warnings,
  };
}
