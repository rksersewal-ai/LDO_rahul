import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("env validation", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("validateEnv", () => {
    it("returns default development environment", async () => {
      vi.stubEnv("NODE_ENV", "development");
      const { validateEnv } = await import("../env");
      const env = validateEnv();
      expect(env.NODE_ENV).toBe("development");
    });

    it("caches the validated environment", async () => {
      vi.stubEnv("NODE_ENV", "development");
      const { validateEnv } = await import("../env");
      const env1 = validateEnv();

      // Change an env var to prove it uses cache
      vi.stubEnv("NODE_ENV", "test");
      const env2 = validateEnv();

      expect(env1).toBe(env2);
      expect(env2.NODE_ENV).toBe("development"); // cached value
    });

    it("throws error for invalid format (e.g. invalid URL)", async () => {
      vi.stubEnv("NODE_ENV", "development");
      vi.stubEnv("DATABASE_URL", "not-a-url");
      const { validateEnv } = await import("../env");
      expect(() => validateEnv()).toThrow(/DATABASE_URL: Invalid url/i);
    });

    describe("production runtime requirements", () => {
      beforeEach(() => {
        vi.stubEnv("NODE_ENV", "production");
        vi.stubEnv("NEXT_PHASE", ""); // Not build phase
      });

      it("throws error for missing DATABASE_URL or POSTGRES_URL", async () => {
        const { validateEnv } = await import("../env");
        expect(() => validateEnv()).toThrow(
          /DATABASE_URL or POSTGRES_URL is required in production runtime/,
        );
      });

      it("throws error for missing AUTH_SECRET or NEXTAUTH_SECRET", async () => {
        vi.stubEnv("DATABASE_URL", "postgresql://user:pass@localhost/db");
        const { validateEnv } = await import("../env");
        expect(() => validateEnv()).toThrow(
          /AUTH_SECRET or NEXTAUTH_SECRET is required in production runtime/,
        );
      });

      it("throws error if AUTH_SECRET uses placeholder", async () => {
        vi.stubEnv("DATABASE_URL", "postgresql://user:pass@localhost/db");
        vi.stubEnv("AUTH_SECRET", "this-is-a-change-this-placeholder-value-that-is-long-enough");
        const { validateEnv } = await import("../env");
        expect(() => validateEnv()).toThrow(
          /AUTH_SECRET must not use the example or development placeholder value/,
        );
      });

      it("validates successfully with required production variables", async () => {
        vi.stubEnv("DATABASE_URL", "postgresql://user:pass@localhost/db");
        vi.stubEnv("AUTH_SECRET", "super-secret-auth-key-that-is-at-least-32-chars-long");
        const { validateEnv } = await import("../env");
        const env = validateEnv();
        expect(env.NODE_ENV).toBe("production");
        expect(env.DATABASE_URL).toBe("postgresql://user:pass@localhost/db");
      });
    });
  });
});
