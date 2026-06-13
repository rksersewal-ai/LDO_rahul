import { type NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

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
  if (process.env.NAS_STORAGE_PATH) {
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
    const connectionString =
      process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/ldo2_edms";
    const pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 5000,
      max: 1,
    });
    await pool.query("SELECT 1");
    const latencyMs = Math.round(performance.now() - start);
    await pool.end();
    return { name: "database", status: "healthy", latencyMs };
  } catch (error) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      name: "database",
      status: "unhealthy",
      latencyMs,
      message: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

async function checkRedis(): Promise<ServiceCheck> {
  const start = performance.now();
  try {
    const Redis = (await import("ioredis")).default;
    const redis = new Redis(process.env.REDIS_URL!, {
      connectTimeout: 5000,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
    await redis.connect();
    await redis.ping();
    const latencyMs = Math.round(performance.now() - start);
    await redis.quit();
    return { name: "redis", status: "healthy", latencyMs };
  } catch (error) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      name: "redis",
      status: "unhealthy",
      latencyMs,
      message: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

async function checkNasStorage(): Promise<ServiceCheck> {
  const start = performance.now();
  try {
    const fs = await import("node:fs/promises");
    await fs.access(process.env.NAS_STORAGE_PATH!);
    const latencyMs = Math.round(performance.now() - start);
    return { name: "nas_storage", status: "healthy", latencyMs };
  } catch (error) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      name: "nas_storage",
      status: "unhealthy",
      latencyMs,
      message: error instanceof Error ? error.message : "Path not accessible",
    };
  }
}
