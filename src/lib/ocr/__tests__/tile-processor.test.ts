import { describe, expect, it } from "vitest";
import { mergeTileResults } from "../tile-processor";

describe("mergeTileResults", () => {
  it("returns an empty string for an empty input array", () => {
    expect(mergeTileResults([])).toBe("");
  });

  it("returns the single result for an array with one item", () => {
    expect(mergeTileResults(["Line 1\nLine 2"])).toBe("Line 1\nLine 2");
  });

  it("merges lines and deduplicates overlapping lines correctly", () => {
    const input = [
      "Header",
      "Header\nItem 1",
      "Item 1\nItem 2"
    ];
    const expected = "Header\nItem 1\nItem 2";
    expect(mergeTileResults(input)).toBe(expected);
  });

  it("ignores case and whitespace when deduplicating, but preserves original case in output", () => {
    const input = [
      "  Line 1  ",
      "line 1\nLine 2",
      "LINE 2 \n  line 3"
    ];
    const expected = "  Line 1  \nLine 2\n  line 3";
    expect(mergeTileResults(input)).toBe(expected);
  });

  it("always includes empty lines instead of deduplicating them out", () => {
    const input = [
      "Line 1\n\nLine 2",
      "Line 2\n\n\nLine 3",
      "  \nLine 4"
    ];
    // "Line 1" -> "Line 1"
    // "" -> ""
    // "Line 2" -> "Line 2"
    // "Line 2" -> deduped
    // "" -> ""
    // "" -> ""
    // "Line 3" -> "Line 3"
    // "  " -> ""
    // "Line 4" -> "Line 4"
    const expected = "Line 1\n\nLine 2\n\n\nLine 3\n\nLine 4";
    expect(mergeTileResults(input)).toBe(expected);
  });
});
