import { describe, expect, it } from "vitest";
import { generateRandomPassword } from "../password-reset-dialog";

describe("generateRandomPassword", () => {
  const allowedChars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";

  it("generates a password of default length 12", () => {
    const password = generateRandomPassword();
    expect(password).toHaveLength(12);
  });

  it("generates a password of specified custom length", () => {
    const length = 24;
    const password = generateRandomPassword(length);
    expect(password).toHaveLength(length);
  });

  it("only contains characters from the allowed character set", () => {
    const password = generateRandomPassword(100);
    for (const char of password) {
      expect(allowedChars.includes(char)).toBe(true);
    }
  });

  it("generates different passwords on subsequent calls", () => {
    const pass1 = generateRandomPassword();
    const pass2 = generateRandomPassword();
    expect(pass1).not.toBe(pass2);
  });
});
