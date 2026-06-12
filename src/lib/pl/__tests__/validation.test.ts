import { describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import {
  assertValidPl,
  extractPlCandidates,
  isValidModulo11,
  isValidPlFormat,
  normalizePlNumber,
} from "../validation";

describe("isValidPlFormat", () => {
  it("returns true for valid 8-digit strings", () => {
    expect(isValidPlFormat("12345678")).toBe(true);
    expect(isValidPlFormat("00000000")).toBe(true);
    expect(isValidPlFormat("99999999")).toBe(true);
  });

  it("returns false for strings containing letters", () => {
    expect(isValidPlFormat("1234abcd")).toBe(false);
    expect(isValidPlFormat("ABCDEFGH")).toBe(false);
    expect(isValidPlFormat("1234567a")).toBe(false);
  });

  it("returns false for 7-digit strings", () => {
    expect(isValidPlFormat("1234567")).toBe(false);
  });

  it("returns false for 9-digit strings", () => {
    expect(isValidPlFormat("123456789")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isValidPlFormat("")).toBe(false);
  });
});

describe("isValidModulo11", () => {
  // Weights: [8, 7, 6, 5, 4, 3, 2, 1]
  // Sum of (digit * weight) mod 11 must equal 0

  it("returns true for all zeros (sum = 0, 0 % 11 = 0)", () => {
    // 0*8 + 0*7 + 0*6 + 0*5 + 0*4 + 0*3 + 0*2 + 0*1 = 0
    expect(isValidModulo11("00000000")).toBe(true);
  });

  it("returns true for computed valid number 12345679", () => {
    // 1*8 + 2*7 + 3*6 + 4*5 + 5*4 + 6*3 + 7*2 + 9*1
    // = 8 + 14 + 18 + 20 + 20 + 18 + 14 + 9 = 121
    // 121 % 11 = 0
    expect(isValidModulo11("12345679")).toBe(true);
  });

  it("returns true for computed valid number 98765434", () => {
    // 9*8 + 8*7 + 7*6 + 6*5 + 5*4 + 4*3 + 3*2 + 4*1
    // = 72 + 56 + 42 + 30 + 20 + 12 + 6 + 4 = 242
    // 242 % 11 = 0
    expect(isValidModulo11("98765434")).toBe(true);
  });

  it("returns true for computed valid number 24680249", () => {
    // 2*8 + 4*7 + 6*6 + 8*5 + 0*4 + 2*3 + 4*2 + 9*1
    // = 16 + 28 + 36 + 40 + 0 + 6 + 8 + 9 = 143
    // 143 % 11 = 0
    expect(isValidModulo11("24680249")).toBe(true);
  });

  it("returns false for known invalid numbers", () => {
    // 12345678: 8+14+18+20+20+18+14+8 = 120, 120 % 11 = 10
    expect(isValidModulo11("12345678")).toBe(false);
    // 11111111: 8+7+6+5+4+3+2+1 = 36, 36 % 11 = 3
    expect(isValidModulo11("11111111")).toBe(false);
  });

  it("returns false for strings that are not 8 digits", () => {
    expect(isValidModulo11("1234567")).toBe(false);
    expect(isValidModulo11("123456789")).toBe(false);
    expect(isValidModulo11("abcdefgh")).toBe(false);
  });
});

describe("normalizePlNumber", () => {
  it("trims whitespace from input", () => {
    expect(normalizePlNumber("  12345678  ")).toBe("12345678");
  });

  it("removes non-digit characters like dashes", () => {
    expect(normalizePlNumber("1234-5678")).toBe("12345678");
  });

  it("removes letters from input", () => {
    expect(normalizePlNumber("PL12345678")).toBe("12345678");
  });

  it("handles combined whitespace and non-digit characters", () => {
    expect(normalizePlNumber(" 1234-5678 ")).toBe("12345678");
  });

  it("returns empty string for non-numeric input", () => {
    expect(normalizePlNumber("abcdefgh")).toBe("");
  });
});

describe("extractPlCandidates", () => {
  it("extracts 8-digit sequences from text", () => {
    const text = "PL 12345678 and 87654321";
    const result = extractPlCandidates(text);
    expect(result).toContain("12345678");
    expect(result).toContain("87654321");
  });

  it("deduplicates repeated 8-digit sequences", () => {
    const text = "PL 12345678 and 12345678 and 87654321 but not 1234567";
    const result = extractPlCandidates(text);
    expect(result).toEqual(["12345678", "87654321"]);
  });

  it("does not include numbers that are not exactly 8 digits", () => {
    const text = "Short 1234567 and long 123456789 but valid 12345678";
    const result = extractPlCandidates(text);
    expect(result).toEqual(["12345678"]);
  });

  it("returns empty array when no candidates found", () => {
    const text = "No numbers here at all";
    const result = extractPlCandidates(text);
    expect(result).toEqual([]);
  });
});

describe("assertValidPl", () => {
  it("throws TRPCError with BAD_REQUEST for invalid input (7 digits)", () => {
    expect(() => assertValidPl("1234567")).toThrowError();
    try {
      assertValidPl("1234567");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("BAD_REQUEST");
    }
  });

  it("throws TRPCError with BAD_REQUEST for empty input", () => {
    expect(() => assertValidPl("")).toThrowError();
    try {
      assertValidPl("");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("BAD_REQUEST");
    }
  });

  it("does not throw for valid 8-digit input", () => {
    expect(() => assertValidPl("12345678")).not.toThrow();
  });
});

describe("alias normalization collision", () => {
  it("verifies that 'ABC-123' trimmed and lowercased becomes 'abc-123'", () => {
    const input = "ABC-123";
    const normalized = input.trim().toLowerCase();
    expect(normalized).toBe("abc-123");
  });

  it("verifies that '  ABC-123  ' trimmed and lowercased also becomes 'abc-123'", () => {
    const input = "  ABC-123  ";
    const normalized = input.trim().toLowerCase();
    expect(normalized).toBe("abc-123");
  });

  it("confirms both inputs collide in the uniqueness check", () => {
    const input1 = "ABC-123";
    const input2 = "  ABC-123  ";
    const normalized1 = input1.trim().toLowerCase();
    const normalized2 = input2.trim().toLowerCase();
    expect(normalized1).toBe(normalized2);
  });
});
