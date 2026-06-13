import { describe, it, expect } from "vitest";
import {
  extractRdsoSpecNumbers,
  extractLocoNumbers,
  extractRailwayIdentifiers,
  extractPlNumbers,
  extractDrawingNumber,
  extractStructuredData,
} from "../structured-extraction";

describe("structured-extraction", () => {
  describe("extractRdsoSpecNumbers", () => {
    it("should extract standard RDSO spec numbers", () => {
      const text =
        "Reference: RDSO/2020/EL/SPEC/0001 and also RDSO/2019/MECH/STD/0045";
      const result = extractRdsoSpecNumbers(text);
      expect(result).toContain("RDSO/2020/EL/SPEC/0001");
      expect(result).toContain("RDSO/2019/MECH/STD/0045");
      expect(result).toHaveLength(2);
    });

    it("should extract RDSO spec with revision suffix", () => {
      const text = "As per RDSO/2021/EL/SPEC/0123/Rev2 specification";
      const result = extractRdsoSpecNumbers(text);
      expect(result).toContain("RDSO/2021/EL/SPEC/0123/Rev2");
      expect(result).toHaveLength(1);
    });

    it("should extract RDSO specs with various department codes", () => {
      const text = `
        RDSO/2022/TCD/DRG/01234
        RDSO/2018/ELEC/CAMTECH/0099
        RDSO/2023/MP/SPN/00567
      `;
      const result = extractRdsoSpecNumbers(text);
      expect(result).toContain("RDSO/2022/TCD/DRG/01234");
      expect(result).toContain("RDSO/2018/ELEC/CAMTECH/0099");
      expect(result).toContain("RDSO/2023/MP/SPN/00567");
      expect(result).toHaveLength(3);
    });

    it("should return empty array when no RDSO specs found", () => {
      const text = "This document has no RDSO references at all.";
      const result = extractRdsoSpecNumbers(text);
      expect(result).toEqual([]);
    });

    it("should deduplicate repeated RDSO specs", () => {
      const text =
        "See RDSO/2020/EL/SPEC/0001 and again RDSO/2020/EL/SPEC/0001";
      const result = extractRdsoSpecNumbers(text);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe("RDSO/2020/EL/SPEC/0001");
    });
  });

  describe("extractLocoNumbers", () => {
    it("should extract WAP-7 loco numbers", () => {
      const text = "Locomotive WAP-7 30001 assigned to Howrah depot";
      const result = extractLocoNumbers(text);
      expect(result).toContain("WAP-7 30001");
      expect(result).toHaveLength(1);
    });

    it("should extract WAG-9HC loco numbers", () => {
      const text = "Maintenance for WAG-9HC 31501 completed on schedule";
      const result = extractLocoNumbers(text);
      expect(result).toContain("WAG-9HC 31501");
      expect(result).toHaveLength(1);
    });

    it("should extract WDP-4D loco numbers", () => {
      const text = "WDP-4D 40201 is due for periodic overhaul";
      const result = extractLocoNumbers(text);
      expect(result).toContain("WDP-4D 40201");
      expect(result).toHaveLength(1);
    });

    it("should extract multiple loco numbers from text", () => {
      const text = `
        Loco fleet report:
        WAP-7 30001 - Active
        WAG-9HC 31501 - Under maintenance
        WDP-4D 40201 - Available
        WAP-4 22501 - Active
      `;
      const result = extractLocoNumbers(text);
      expect(result).toHaveLength(4);
      expect(result).toContain("WAP-7 30001");
      expect(result).toContain("WAG-9HC 31501");
      expect(result).toContain("WDP-4D 40201");
      expect(result).toContain("WAP-4 22501");
    });

    it("should return empty array when no loco numbers found", () => {
      const text = "No locomotives referenced in this document.";
      const result = extractLocoNumbers(text);
      expect(result).toEqual([]);
    });

    it("should deduplicate repeated loco numbers", () => {
      const text = "WAP-7 30001 inspection. WAP-7 30001 cleared.";
      const result = extractLocoNumbers(text);
      expect(result).toHaveLength(1);
    });
  });

  describe("extractRailwayIdentifiers", () => {
    it("should return combined railway identifiers", () => {
      const text = `
        Drawing: CLW/ED/TM/4907/GA
        Spec: RDSO/2020/EL/SPEC/0001
        Loco: WAP-7 30001
      `;
      const result = extractRailwayIdentifiers(text);
      expect(result.drawingNumbers).toContain("CLW/ED/TM/4907/GA");
      expect(result.rdsoSpecs).toContain("RDSO/2020/EL/SPEC/0001");
      expect(result.locoNumbers).toContain("WAP-7 30001");
    });

    it("should return empty arrays when no identifiers found", () => {
      const text = "This is a blank document with no identifiers.";
      const result = extractRailwayIdentifiers(text);
      expect(result.drawingNumbers).toEqual([]);
      expect(result.rdsoSpecs).toEqual([]);
      expect(result.locoNumbers).toEqual([]);
    });

    it("should handle text with only some identifier types", () => {
      const text = "Reference RDSO/2022/TCD/DRG/01234 for traction motor specs.";
      const result = extractRailwayIdentifiers(text);
      expect(result.rdsoSpecs).toHaveLength(1);
      expect(result.locoNumbers).toEqual([]);
      expect(result.drawingNumbers).toEqual([]);
    });
  });

  describe("extractPlNumbers (existing functionality)", () => {
    it("should extract 8-digit PL numbers", () => {
      const text = "PL Number: 12345678 for this component, also 87654321";
      const result = extractPlNumbers(text);
      expect(result).toContain("12345678");
      expect(result).toContain("87654321");
      expect(result).toHaveLength(2);
    });

    it("should return empty array when no PL numbers exist", () => {
      const text = "No numbers here at all";
      const result = extractPlNumbers(text);
      expect(result).toEqual([]);
    });
  });

  describe("extractDrawingNumber (existing functionality)", () => {
    it("should extract standard drawing numbers", () => {
      const text = "Drawing No: CLW/ED/TM/4907/GA revision 3";
      const result = extractDrawingNumber(text);
      expect(result).toBe("CLW/ED/TM/4907/GA");
    });

    it("should return null when no drawing number found", () => {
      const text = "This text has no drawing numbers";
      const result = extractDrawingNumber(text);
      expect(result).toBeNull();
    });
  });

  describe("extractStructuredData", () => {
    it("should include rdsoSpecs and locoNumbers in output", () => {
      const text = `
        TITLE: Traction Motor Assembly
        Drawing: CLW/ED/TM/4907/GA
        Rev. 3
        PL: 12345678
        Spec: RDSO/2020/EL/SPEC/0001
        Loco: WAP-7 30001
        Sheet 1 of 4
        SCALE 1:5
        Date: 15/06/2023
        APPROVED BY: Rajesh Kumar
      `;
      const result = extractStructuredData(text);
      expect(result.rdsoSpecs).toContain("RDSO/2020/EL/SPEC/0001");
      expect(result.locoNumbers).toContain("WAP-7 30001");
      expect(result.plNumbers).toContain("12345678");
      expect(result.drawingNumber).toBe("CLW/ED/TM/4907/GA");
      expect(result.confidence).toBeGreaterThan(0);
    });

    it("should return empty arrays for rdsoSpecs and locoNumbers when not present", () => {
      const text = "Simple text with no railway identifiers";
      const result = extractStructuredData(text);
      expect(result.rdsoSpecs).toEqual([]);
      expect(result.locoNumbers).toEqual([]);
    });
  });
});
