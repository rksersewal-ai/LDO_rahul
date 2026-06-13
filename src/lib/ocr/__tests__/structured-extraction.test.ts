import { describe, expect, it } from "vitest";
import { extractDrawingNumber } from "../structured-extraction";

describe("extractDrawingNumber", () => {
  it("should return null for empty or irrelevant text", () => {
    expect(extractDrawingNumber("")).toBeNull();
    expect(extractDrawingNumber("Some random text with no drawing numbers")).toBeNull();
  });

  it("should extract valid drawing numbers without optional suffix", () => {
    // 2-4 uppercase letters, slash-separated segments with digits
    // [A-Z]{2,4}\/[A-Z]+\/[A-Z]+\/\d{4}
    expect(extractDrawingNumber("CLW/ED/TM/4907")).toBe("CLW/ED/TM/4907");
    expect(extractDrawingNumber("AB/CDE/FG/1234")).toBe("AB/CDE/FG/1234");
    expect(extractDrawingNumber("ABCD/A/B/9999")).toBe("ABCD/A/B/9999");
  });

  it("should extract valid drawing numbers with optional suffix", () => {
    // [A-Z]{2,4}\/[A-Z]+\/[A-Z]+\/\d{4}(?:\/[A-Z]+)?
    expect(extractDrawingNumber("CLW/ED/TM/4907/GA")).toBe("CLW/ED/TM/4907/GA");
    expect(extractDrawingNumber("ABCD/A/B/9999/XYZ")).toBe("ABCD/A/B/9999/XYZ");
  });

  it("should return null for patterns missing required segments", () => {
    // Requires at least 3 slashes before digits (e.g. AB/C/D/1234)
    expect(extractDrawingNumber("CLW/ED/4907")).toBeNull();
    expect(extractDrawingNumber("CLW/4907")).toBeNull();
    expect(extractDrawingNumber("4907")).toBeNull();
  });

  it("should return null for patterns with fewer than 4 digits", () => {
    // Requires exactly 4 digits
    expect(extractDrawingNumber("CLW/ED/TM/490")).toBeNull();
  });

  it("should extract 4 digits even if followed by more digits due to lack of boundary", () => {
    // Current regex behavior: it just grabs the first 4 digits
    expect(extractDrawingNumber("CLW/ED/TM/49075")).toBe("CLW/ED/TM/4907");
  });

  it("should return null for patterns with lowercase letters", () => {
    // Requires all caps before digits
    expect(extractDrawingNumber("clw/ed/tm/4907/ga")).toBeNull();
    expect(extractDrawingNumber("Clw/Ed/Tm/4907/Ga")).toBeNull();
    // It will return null because regex is uppercase only
  });

  it("should extract a drawing number embedded within a larger string", () => {
    const text = "Please refer to drawing CLW/ED/TM/4907/GA for more details regarding the motor.";
    expect(extractDrawingNumber(text)).toBe("CLW/ED/TM/4907/GA");
  });

  it("should return the first match when multiple drawing numbers are present", () => {
    const text = "Drawings: CLW/ED/TM/4907/GA and ABCD/A/B/9999/XYZ are included.";
    expect(extractDrawingNumber(text)).toBe("CLW/ED/TM/4907/GA");
  });
});
