import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DocInput } from "@/lib/dedup/scorer";

// Mock the database module
vi.mock("@/lib/db", () => ({
  db: {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoNothing: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
  },
}));

describe("dedup-worker", () => {
  describe("scoreDocumentPairBasic", () => {
    let scoreDocumentPairBasic: typeof import("../dedup-worker").scoreDocumentPairBasic;

    beforeEach(async () => {
      const mod = await import("../dedup-worker");
      scoreDocumentPairBasic = mod.scoreDocumentPairBasic;
    });

    it("should return score of 1.0 when hash, docNumber, and metadata all match", () => {
      const docA: DocInput = {
        id: "a",
        fileHash: "abc123",
        documentNumber: "DOC-001",
        title: "Test Document",
        ocrText: "Some OCR text content for document A",
        plNumberIds: ["pl1"],
        workshop: "WS-1",
        section: "SEC-1",
        category: "CAT-1",
        thumbnailPath: null,
      };
      const docB: DocInput = {
        id: "b",
        fileHash: "abc123",
        documentNumber: "DOC-001",
        title: "Different Title",
        ocrText: "Different OCR text for document B",
        plNumberIds: ["pl2"],
        workshop: "WS-1",
        section: "SEC-1",
        category: "CAT-1",
        thumbnailPath: null,
      };

      const result = scoreDocumentPairBasic(docA, docB);
      expect(result.score).toBe(1.0);
      expect(result.signals.exactHash).toBe(1.0);
      expect(result.signals.docNumber).toBe(1.0);
      expect(result.signals.metadata).toBe(1.0);
    });

    it("should return score of 0 when nothing matches", () => {
      const docA: DocInput = {
        id: "a",
        fileHash: "hash-a",
        documentNumber: "DOC-001",
        title: "Title A",
        ocrText: null,
        plNumberIds: [],
        workshop: "WS-1",
        section: "SEC-1",
        category: "CAT-1",
        thumbnailPath: null,
      };
      const docB: DocInput = {
        id: "b",
        fileHash: "hash-b",
        documentNumber: "DOC-002",
        title: "Title B",
        ocrText: null,
        plNumberIds: [],
        workshop: "WS-2",
        section: "SEC-2",
        category: "CAT-2",
        thumbnailPath: null,
      };

      const result = scoreDocumentPairBasic(docA, docB);
      expect(result.score).toBe(0);
      expect(result.signals.exactHash).toBe(0);
      expect(result.signals.docNumber).toBe(0);
      expect(result.signals.metadata).toBe(0);
    });

    it("should not use OCR text or PL overlap signals", () => {
      const docA: DocInput = {
        id: "a",
        fileHash: "different-a",
        documentNumber: "DOC-A",
        title: "Identical Title Shared",
        ocrText: "Identical OCR text that is exactly the same",
        plNumberIds: ["pl1", "pl2", "pl3"],
        workshop: null,
        section: null,
        category: null,
        thumbnailPath: null,
      };
      const docB: DocInput = {
        id: "b",
        fileHash: "different-b",
        documentNumber: "DOC-B",
        title: "Identical Title Shared",
        ocrText: "Identical OCR text that is exactly the same",
        plNumberIds: ["pl1", "pl2", "pl3"],
        workshop: null,
        section: null,
        category: null,
        thumbnailPath: null,
      };

      const result = scoreDocumentPairBasic(docA, docB);
      // Basic scan only uses hash, docNumber, metadata
      // Hash doesn't match, docNumber doesn't match, no metadata
      expect(result.score).toBe(0);
      // The high OCR similarity and PL overlap are ignored
    });

    it("should handle partial metadata match (2/3 = 0.5)", () => {
      const docA: DocInput = {
        id: "a",
        fileHash: null,
        documentNumber: "",
        title: "Test",
        ocrText: null,
        plNumberIds: [],
        workshop: "WS-1",
        section: "SEC-1",
        category: "CAT-A",
        thumbnailPath: null,
      };
      const docB: DocInput = {
        id: "b",
        fileHash: null,
        documentNumber: "",
        title: "Test",
        ocrText: null,
        plNumberIds: [],
        workshop: "WS-1",
        section: "SEC-1",
        category: "CAT-B",
        thumbnailPath: null,
      };

      const result = scoreDocumentPairBasic(docA, docB);
      // Only metadata is available (hash is null, docNumber is empty)
      expect(result.signals.metadata).toBe(0.5);
      expect(result.score).toBe(0.5);
    });
  });

  describe("processDedupJob", () => {
    it("should be exported as a function", async () => {
      const mod = await import("../dedup-worker");
      expect(typeof mod.processDedupJob).toBe("function");
    });
  });

  describe("createDedupWorker", () => {
    it("should be exported as a function", async () => {
      const mod = await import("../dedup-worker");
      expect(typeof mod.createDedupWorker).toBe("function");
    });
  });

  describe("basic vs advanced scan behavior", () => {
    it("basic scan scoreDocumentPairBasic ignores title/OCR/PL signals", async () => {
      const { scoreDocumentPairBasic } = await import("../dedup-worker");

      const docA: DocInput = {
        id: "a",
        fileHash: "same-hash",
        documentNumber: "DOC-X",
        title: "Title A is very unique and has no similarity",
        ocrText: "completely different ocr text A",
        plNumberIds: ["pl-x"],
        workshop: "WS-1",
        section: "SEC-1",
        category: "CAT-1",
        thumbnailPath: null,
      };
      const docB: DocInput = {
        id: "b",
        fileHash: "same-hash",
        documentNumber: "DOC-X",
        title: "Title B has totally different content",
        ocrText: "completely different ocr text B",
        plNumberIds: ["pl-y"],
        workshop: "WS-1",
        section: "SEC-1",
        category: "CAT-1",
        thumbnailPath: null,
      };

      // Basic should only look at hash + docNumber + metadata
      const basicResult = scoreDocumentPairBasic(docA, docB);
      expect(basicResult.score).toBe(1.0); // All 3 basic signals match perfectly

      // Full scorer would give different weight distribution
      const { scoreDocumentPair } = await import("@/lib/dedup/scorer");
      const advancedResult = scoreDocumentPair(docA, docB);
      // Advanced score includes title similarity, OCR text, PL overlap
      // which may lower the overall score
      expect(advancedResult.score).toBeLessThanOrEqual(1.0);
      expect(advancedResult.signals.ocrTextTrigram).not.toBeNull();
      expect(advancedResult.signals.titleTrigram).not.toBeNull();
    });
  });
});
