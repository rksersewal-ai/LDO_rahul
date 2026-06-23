import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock tesseract.js - vi.mock is hoisted, so use vi.fn() inline
vi.mock("tesseract.js", () => ({
  createWorker: vi.fn(),
}));

import { createWorker } from "tesseract.js";
import { recognizeImage } from "../tesseract-engine";

const mockCreateWorker = vi.mocked(createWorker);

describe("tesseract-engine", () => {
  const mockRecognize = vi.fn();
  const mockTerminate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateWorker.mockResolvedValue({
      recognize: mockRecognize,
      terminate: mockTerminate,
    } as unknown as Awaited<ReturnType<typeof createWorker>>);
    mockTerminate.mockResolvedValue(undefined);
  });

  it("should return extracted text and confidence from tesseract", async () => {
    mockRecognize.mockResolvedValue({
      data: {
        text: "Hello World",
        blocks: [
          {
            paragraphs: [
              {
                lines: [
                  {
                    words: [
                      { text: "Hello", confidence: 92 },
                      { text: "World", confidence: 88 },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const result = await recognizeImage(Buffer.from("fake-image"), "image/png");

    expect(result.text).toBe("Hello World");
    expect(result.confidence).toBeCloseTo(0.9); // (0.92 + 0.88) / 2
    expect(result.wordConfidences).toEqual([
      { word: "Hello", confidence: 0.92 },
      { word: "World", confidence: 0.88 },
    ]);
    expect(mockCreateWorker).toHaveBeenCalledWith("eng");
    expect(mockTerminate).toHaveBeenCalled();
  });

  it("should return empty result when tesseract throws an error", async () => {
    mockCreateWorker.mockRejectedValue(new Error("Worker init failed"));

    const result = await recognizeImage(Buffer.from("bad-data"), "image/jpeg");

    expect(result.text).toBe("");
    expect(result.confidence).toBe(0);
    expect(result.wordConfidences).toEqual([]);
  });

  it("should return empty result when recognize fails", async () => {
    mockRecognize.mockRejectedValue(new Error("Recognition failed"));

    const result = await recognizeImage(Buffer.from("corrupt"), "image/tiff");

    expect(result.text).toBe("");
    expect(result.confidence).toBe(0);
    expect(result.wordConfidences).toEqual([]);
    expect(mockTerminate).toHaveBeenCalled();
  });

  it("should handle empty blocks array", async () => {
    mockRecognize.mockResolvedValue({
      data: {
        text: "",
        blocks: [],
      },
    });

    const result = await recognizeImage(Buffer.from("blank"), "image/png");

    expect(result.text).toBe("");
    expect(result.confidence).toBe(0);
    expect(result.wordConfidences).toEqual([]);
  });

  it("should handle null blocks in response", async () => {
    mockRecognize.mockResolvedValue({
      data: {
        text: "Some text",
        blocks: null,
      },
    });

    const result = await recognizeImage(Buffer.from("data"), "image/png");

    expect(result.text).toBe("Some text");
    expect(result.confidence).toBe(0);
    expect(result.wordConfidences).toEqual([]);
  });

  it("should terminate worker even after error", async () => {
    mockRecognize.mockRejectedValue(new Error("fail"));

    await recognizeImage(Buffer.from("data"), "image/png");

    expect(mockTerminate).toHaveBeenCalled();
  });

  it("should handle termination errors gracefully", async () => {
    mockRecognize.mockResolvedValue({
      data: {
        text: "OK",
        blocks: [
          {
            paragraphs: [
              {
                lines: [
                  {
                    words: [{ text: "OK", confidence: 95 }],
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    mockTerminate.mockRejectedValue(new Error("terminate failed"));

    const result = await recognizeImage(Buffer.from("data"), "image/png");

    // Should still return valid result despite termination error
    expect(result.text).toBe("OK");
    expect(result.confidence).toBeCloseTo(0.95);
  });
});
