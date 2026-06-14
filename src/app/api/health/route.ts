import { sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ServiceCheck {
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  latencyMs: number;
  message?: string;
}

export async function GET(_request: NextRequest) {
  const services: ServiceCheck[] = [];
  let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";

  // Check Database
  const dbCheck = await checkDatabase();
  services.push(dbCheck);
  if (dbCheck.status === "unhealthy") {
    overallStatus = "unhealthy";
  } else if (dbCheck.status === "degraded" && overallStatus === "healthy") {
    overallStatus = "degraded";
  }

  // Check Redis (optional)
  if (process.env.REDIS_URL) {
    const redisCheck = await checkRedis();
    services.push(redisCheck);
    if (redisCheck.status === "unhealthy" && overallStatus !== "unhealthy") {
      overallStatus = "degraded";
    }
  }

  // Check NAS Storage (optional)
  if (process.env.STORAGE_NAS_PATH) {
    const nasCheck = await checkNasStorage();
    services.push(nasCheck);
    if (nasCheck.status === "unhealthy" && overallStatus !== "unhealthy") {
      overallStatus = "degraded";
    }
  }

  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services,
  };

  const httpStatus = overallStatus === "unhealthy" ? 503 : 200;
  return NextResponse.json(response, { status: httpStatus });
}

async function checkDatabase(): Promise<ServiceCheck> {
  const start = performance.now();
  try {
    // Use the app's shared database pool to avoid creating a new connection per request
    await db.execute(sql`SELECT 1`);
    const latencyMs = Math.round(performance.now() - start);
    return { name: "database", status: "healthy", latencyMs };
  } catch {
    const latencyMs = Math.round(performance.now() - start);
    return {
      name: "database",
      status: "unhealthy",
      latencyMs,
      // Do not expose raw driver error messages — they may contain connection-string details
      message: "Database connection failed",
    };
  }
}

// Lazy singleton Redis client for health checks (avoids creating a connection per request)
let redisClient: InstanceType<typeof import("ioredis").default> | null = null;

async function getRedisClient() {
  if (!redisClient) {
    const Redis = (await import("ioredis")).default;
    redisClient = new Redis(process.env.REDIS_URL!, {
      connectTimeout: 5000,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    redisClient.on("error", () => {
      // On connection error, discard the client so the next call creates a fresh one
      redisClient = null;
    });
    await redisClient.connect();
  }
  return redisClient;
}

async function checkRedis(): Promise<ServiceCheck> {
  const start = performance.now();
  try {
    const redis = await getRedisClient();
    await redis.ping();
    const latencyMs = Math.round(performance.now() - start);
    return { name: "redis", status: "healthy", latencyMs };
  } catch {
    // Discard broken client so next health check retries from scratch
    redisClient = null;
    const latencyMs = Math.round(performance.now() - start);
    return {
      name: "redis",
      status: "unhealthy",
      latencyMs,
      message: "Redis connection failed",
    };
  }
}

async function checkNasStorage(): Promise<ServiceCheck> {
  const start = performance.now();
  try {
    const fs = await import("node:fs/promises");
    // Use F_OK (existence) | W_OK (write) to verify the path is writable, not just present.
    const { constants } = await import("node:fs");
    await fs.access(process.env.STORAGE_NAS_PATH!, constants.F_OK | constants.W_OK);
    const latencyMs = Math.round(performance.now() - start);
    return { name: "nas_storage", status: "healthy", latencyMs };
  } catch {
    const latencyMs = Math.round(performance.now() - start);
    return {
      name: "nas_storage",
      status: "unhealthy",
      latencyMs,
      message: "Storage path not accessible or not writable",
    };
  }
}
