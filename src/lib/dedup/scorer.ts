/**
 * Deduplication scoring algorithm.
 * Uses trigram-based Jaccard similarity and weighted signal scoring
 * to detect potential duplicate documents.
 */

export const DEDUP_THRESHOLD = 0.70;

export interface DocInput {
  id: string;
  fileHash: string | null;
  documentNumber: string;
  title: string;
  ocrText: string | null;
  plNumberIds: string[];
  workshop: string | null;
  section: string | null;
  category: string | null;
  thumbnailPath: string | null;
}

export interface DedupSignals {
  exactHash: number | null;
  docNumber: number | null;
  titleTrigram: number | null;
  ocrTextTrigram: number | null;
  plOverlap: number | null;
  metadata: number | null;
  phash: number | null;
}

export interface ScoreResult {
  score: number;
  signals: DedupSignals;
}

/**
 * Generate all 3-character substrings (trigrams) from a string.
 */
function getTrigrams(s: string): Set<string> {
  const trigrams = new Set<string>();
  const normalized = s.toLowerCase();
  for (let i = 0; i <= normalized.length - 3; i++) {
    trigrams.add(normalized.substring(i, i + 3));
  }
  return trigrams;
}

/**
 * Compute Jaccard coefficient of two trigram sets.
 * Returns 0 for empty strings (fewer than 3 characters produce no trigrams).
 */
export function trigramJaccard(a: string, b: string): number {
  const trigramsA = getTrigrams(a);
  const trigramsB = getTrigrams(b);

  if (trigramsA.size === 0 && trigramsB.size === 0) {
    return 0;
  }
  if (trigramsA.size === 0 || trigramsB.size === 0) {
    return 0;
  }

  let intersectionSize = 0;
  for (const trigram of trigramsA) {
    if (trigramsB.has(trigram)) {
      intersectionSize++;
    }
  }

  const unionSize = trigramsA.size + trigramsB.size - intersectionSize;
  if (unionSize === 0) {
    return 0;
  }

  return intersectionSize / unionSize;
}

/**
 * Compute Jaccard coefficient of two string sets.
 */
function setJaccard(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);

  if (setA.size === 0 && setB.size === 0) {
    return 0;
  }

  let intersectionSize = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionSize++;
    }
  }

  const unionSize = setA.size + setB.size - intersectionSize;
  if (unionSize === 0) {
    return 0;
  }

  return intersectionSize / unionSize;
}

const WEIGHTS: Record<string, number> = {
  exact_hash: 0.25,
  doc_number: 0.25,
  title_trigram: 0.15,
  ocr_text_trigram: 0.20,
  pl_overlap: 0.20,
  metadata: 0.05,
  phash: 0.05,
};

/**
 * Score a pair of documents for potential duplication.
 * Computes individual signals and a weighted composite score.
 * When a signal is unavailable, its weight is redistributed proportionally.
 */
export function scoreDocumentPair(docA: DocInput, docB: DocInput): ScoreResult {
  // Compute individual signals
  const exactHash: number | null =
    docA.fileHash && docB.fileHash ? (docA.fileHash === docB.fileHash ? 1.0 : 0.0) : null;

  const docNumber: number | null =
    docA.documentNumber && docB.documentNumber
      ? docA.documentNumber === docB.documentNumber
        ? 1.0
        : 0.0
      : null;

  const titleTrigram: number | null =
    docA.title && docB.title ? trigramJaccard(docA.title, docB.title) : null;

  const ocrTextTrigram: number | null =
    docA.ocrText && docB.ocrText && docA.ocrText.trim().length > 0 && docB.ocrText.trim().length > 0
      ? trigramJaccard(docA.ocrText, docB.ocrText)
      : null;

  const plOverlap: number | null =
    docA.plNumberIds.length === 0 && docB.plNumberIds.length === 0
      ? null
      : setJaccard(docA.plNumberIds, docB.plNumberIds);

  // Metadata: 1.0 if all 3 match, 0.5 if 2/3 match, 0.0 otherwise
  let metadata: number | null = null;
  if (docA.workshop || docA.section || docA.category || docB.workshop || docB.section || docB.category) {
    let matchCount = 0;
    if (docA.workshop && docB.workshop && docA.workshop === docB.workshop) matchCount++;
    if (docA.section && docB.section && docA.section === docB.section) matchCount++;
    if (docA.category && docB.category && docA.category === docB.category) matchCount++;
    metadata = matchCount >= 3 ? 1.0 : matchCount === 2 ? 0.5 : 0.0;
  }

  // phash: not implemented yet
  const phash: number | null = null;

  const signals: DedupSignals = {
    exactHash,
    docNumber,
    titleTrigram,
    ocrTextTrigram,
    plOverlap,
    metadata,
    phash,
  };

  // Map signal keys to weight keys
  const signalMap: Array<{ signalKey: keyof DedupSignals; weightKey: string }> = [
    { signalKey: "exactHash", weightKey: "exact_hash" },
    { signalKey: "docNumber", weightKey: "doc_number" },
    { signalKey: "titleTrigram", weightKey: "title_trigram" },
    { signalKey: "ocrTextTrigram", weightKey: "ocr_text_trigram" },
    { signalKey: "plOverlap", weightKey: "pl_overlap" },
    { signalKey: "metadata", weightKey: "metadata" },
    { signalKey: "phash", weightKey: "phash" },
  ];

  // Compute available weight sum for redistribution
  let availableWeightSum = 0;
  for (const { signalKey, weightKey } of signalMap) {
    if (signals[signalKey] !== null) {
      availableWeightSum += WEIGHTS[weightKey];
    }
  }

  // Compute weighted score with redistribution
  let score = 0;
  if (availableWeightSum > 0) {
    for (const { signalKey, weightKey } of signalMap) {
      const signalValue = signals[signalKey];
      if (signalValue !== null) {
        const redistributedWeight = WEIGHTS[weightKey] / availableWeightSum;
        score += signalValue * redistributedWeight;
      }
    }
  }

  return { score, signals };
}
