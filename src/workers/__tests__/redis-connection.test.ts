import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logWarn } from "@/lib/logging/structured-logger";
import { getRedisConnectionOptions } from "../redis-connection";

vi.mock("@/lib/logging/structured-logger", () => ({
  logWarn: vi.fn(),
}));

describe("getRedisConnectionOptions", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should use default url when REDIS_URL is undefined", () => {
    delete process.env.REDIS_URL;
    const options = getRedisConnectionOptions();
    expect(options).toEqual({
      host: "localhost",
      port: 6379,
      username: undefined,
      password: undefined,
      db: undefined,
      tls: undefined,
      maxRetriesPerRequest: null,
    });
  });

  it("should parse basic host and port", () => {
    process.env.REDIS_URL = "redis://192.168.1.10:6380";
    const options = getRedisConnectionOptions();
    expect(options).toEqual(
      expect.objectContaining({
        host: "192.168.1.10",
        port: 6380,
      }),
    );
  });

  it("should parse credentials and decode them", () => {
    process.env.REDIS_URL = "redis://default:mySecure%20Password@10.0.0.1:6379";
    const options = getRedisConnectionOptions();
    expect(options).toEqual(
      expect.objectContaining({
        username: "default",
        password: "mySecure Password",
      }),
    );
  });

  it("should parse database index", () => {
    process.env.REDIS_URL = "redis://localhost:6379/1";
    const options = getRedisConnectionOptions();
    expect(options).toEqual(
      expect.objectContaining({
        db: 1,
      }),
    );
  });

  it("should enable TLS for rediss protocol", () => {
    process.env.REDIS_URL = "rediss://localhost:6379";
    const options = getRedisConnectionOptions();
    expect(options).toEqual(
      expect.objectContaining({
        tls: {},
      }),
    );
  });

  it("should handle invalid URLs gracefully and log a warning", () => {
    process.env.REDIS_URL = "not-a-valid-url";
    const options = getRedisConnectionOptions();
    expect(options).toEqual({
      host: "127.0.0.1",
      port: 6379,
      maxRetriesPerRequest: null,
    });
    expect(logWarn).toHaveBeenCalledWith(
      "[redis-connection] Invalid REDIS_URL; falling back to localhost defaults",
      {},
    );
  });
});
