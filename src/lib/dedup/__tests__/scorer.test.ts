import { describe, expect, it } from "vitest";
import { trigramJaccard } from "../scorer";

describe("trigramJaccard", () => {
  it("returns 1.0 for identical strings", () => {
    expect(trigramJaccard("hello world", "hello world")).toBe(1.0);
  });

  it("returns 0 for completely different strings", () => {
    expect(trigramJaccard("abc", "xyz")).toBe(0);
  });

  it("returns value between 0.2 and 1.0 for similar strings", () => {
    const score = trigramJaccard("hello world", "hello earth");
    expect(score).toBeGreaterThan(0.2);
    expect(score).toBeLessThan(1.0);
  });

  it("returns 0 for empty strings", () => {
    expect(trigramJaccard("", "")).toBe(0);
    expect(trigramJaccard("", "abc")).toBe(0);
    expect(trigramJaccard("abc", "")).toBe(0);
  });

  it("returns 0 for strings shorter than 3 chars", () => {
    expect(trigramJaccard("ab", "ab")).toBe(0);
    expect(trigramJaccard("ab", "abc")).toBe(0);
    expect(trigramJaccard("abc", "ab")).toBe(0);
  });

  it("handles strings with spaces and special characters", () => {
    expect(trigramJaccard("   ", "   ")).toBe(1.0);
    expect(trigramJaccard("!@#", "!@#")).toBe(1.0);
    expect(trigramJaccard("a b", "a b")).toBe(1.0);
  });

  it("is case insensitive", () => {
    expect(trigramJaccard("Hello", "hello")).toBe(1.0);
  });
});
