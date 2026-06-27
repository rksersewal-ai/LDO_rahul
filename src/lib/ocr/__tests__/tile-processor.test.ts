import { describe, expect, it } from "vitest";
import { mergeTileResults } from "../tile-processor";

describe("mergeTileResults", () => {
  it("should return an empty string for an empty input array", () => {
    const result = mergeTileResults([]);
    expect(result).toBe("");
  });

  it("should return the original string for a single-item array", () => {
    const input = "Line 1\nLine 2";
    const result = mergeTileResults([input]);
    expect(result).toBe(input);
  });

  it("should properly deduplicate overlapping lines across multiple tiles", () => {
    const tile1 = "Drawing No: 12345\nProject: LDO";
    const tile2 = "Project: LDO\nRevision: A";
    const tile3 = "Revision: A\nDate: 2024-01-01";

    const result = mergeTileResults([tile1, tile2, tile3]);

    expect(result).toBe("Drawing No: 12345\nProject: LDO\nRevision: A\nDate: 2024-01-01");
  });

  it("should handle case-insensitivity and whitespace when identifying duplicates", () => {
    const tile1 = "DRAWING NO: 12345\n  Project: LDO  ";
    const tile2 = "drawing no: 12345\nProject: LDO\nRevision: A";

    const result = mergeTileResults([tile1, tile2]);

    // The first occurrence of a deduplicated line should be preserved
    expect(result).toBe("DRAWING NO: 12345\n  Project: LDO  \nRevision: A");
  });

  it("should preserve empty lines appropriately", () => {
    const tile1 = "Line 1\n\nLine 2";
    const tile2 = "\nLine 2\n\nLine 3";

    const result = mergeTileResults([tile1, tile2]);

    expect(result).toBe("Line 1\n\nLine 2\n\n\nLine 3");
  });
});
