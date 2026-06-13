import { describe, expect, it } from "vitest";
import { MAGIC_BYTES, validateMagicBytes } from "../validation";

describe("validateMagicBytes", () => {
  it("should return invalid for buffers smaller than 4 bytes", () => {
    const buffer = Buffer.from([0x00, 0x00, 0x00]);
    const result = validateMagicBytes(buffer);
    expect(result).toEqual({ valid: false, detectedType: null });
  });

  it("should return valid and application/pdf for PDF magic bytes", () => {
    const buffer = Buffer.concat([MAGIC_BYTES.PDF, Buffer.from("some extra data")]);
    const result = validateMagicBytes(buffer);
    expect(result).toEqual({ valid: true, detectedType: "application/pdf" });
  });

  it("should return valid and image/jpeg for JPEG magic bytes", () => {
    const buffer = Buffer.concat([MAGIC_BYTES.JPEG, Buffer.from("extra data here")]);
    const result = validateMagicBytes(buffer);
    expect(result).toEqual({ valid: true, detectedType: "image/jpeg" });
  });

  it("should return valid and image/png for PNG magic bytes", () => {
    const buffer = Buffer.concat([MAGIC_BYTES.PNG, Buffer.from("dummy payload")]);
    const result = validateMagicBytes(buffer);
    expect(result).toEqual({ valid: true, detectedType: "image/png" });
  });

  it("should return valid and image/tiff for TIFF Little Endian magic bytes", () => {
    const buffer = Buffer.concat([MAGIC_BYTES.TIFF_LE, Buffer.from("tail data")]);
    const result = validateMagicBytes(buffer);
    expect(result).toEqual({ valid: true, detectedType: "image/tiff" });
  });

  it("should return valid and image/tiff for TIFF Big Endian magic bytes", () => {
    const buffer = Buffer.concat([MAGIC_BYTES.TIFF_BE, Buffer.from("tail data")]);
    const result = validateMagicBytes(buffer);
    expect(result).toEqual({ valid: true, detectedType: "image/tiff" });
  });

  it("should return invalid for unknown magic bytes", () => {
    const buffer = Buffer.from([0x12, 0x34, 0x56, 0x78, 0x90]);
    const result = validateMagicBytes(buffer);
    expect(result).toEqual({ valid: false, detectedType: null });
  });

  it("should return invalid for empty buffer", () => {
    const buffer = Buffer.alloc(0);
    const result = validateMagicBytes(buffer);
    expect(result).toEqual({ valid: false, detectedType: null });
  });
});
