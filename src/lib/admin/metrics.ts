import os from "node:os";
import { gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents, ocrJobs, users, workspaces } from "@/lib/db/schema";
import { logWarn } from "@/lib/logging/structured-logger";
import { healthCheck as nasHealthCheck } from "@/lib/storage/nas-storage";
import { getDedupQueue } from "@/workers/dedup-queue";
import { getOcrQueue } from "@/workers/ocr-queue";

export type ServiceStatus = "healthy" | "degraded" | "down";

export interface ServiceHealth {
  name: string;
  status: ServiceStatus;
  responseTime: number; // ms
  uptime: number; // percentage (best-effort: 100 when up, 0 when down)
  lastChecked: string;
  details: string;
}

export interface SystemMetrics {
  totalUsers: number;
  activeSessions: number;
  documentsToday: number;
  ocrJobsToday: number;
  storageUsedGB: number;
  storageTotalGB: number;
  cpuUsage: number;
  memoryUsage: number;
  uptimeHours: number;
}

const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000; // matches NextAuth session maxAge

/** Resolve a promise with a fallback if it does not settle within `ms`. */
async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// --- Individual service checks (each is best-effort and never throws) ---

async function checkDatabase(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    await withTimeout(
      db.execute(sql`SELECT 1`),
      3000,
      Promise.reject(new Error("timeout")) as never,
    );
    const responseTime = Date.now() - start;
    return {
      name: "PostgreSQL Database",
      status: responseTime > 1000 ? "degraded" : "healthy",
      responseTime,
      uptime: 100,
      lastChecked: new Date().toISOString(),
      details: "Connection pool responsive",
    };
  } catch (error) {
    return {
      name: "PostgreSQL Database",
      status: "down",
      responseTime: Date.now() - start,
      uptime: 0,
      lastChecked: new Date().toISOString(),
      details: error instanceof Error ? error.message : "Unreachable",
    };
  }
}

async function checkRedis(): Promise<ServiceHealth> {
  const start = Date.now();
  if (!process.env.REDIS_URL) {
    return {
      name: "Redis Cache",
      status: "degraded",
      responseTime: 0,
      uptime: 0,
      lastChecked: new Date().toISOString(),
      details: "REDIS_URL not configured (queues/cache disabled)",
    };
  }
  let client: InstanceType<typeof import("ioredis").default> | null = null;
  try {
    const Redis = (await import("ioredis")).default;
    client = new Redis(process.env.REDIS_URL, {
      connectTimeout: 2000,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    await withTimeout(client.connect(), 2500, Promise.reject(new Error("timeout")) as never);
    await withTimeout(client.ping(), 2000, Promise.reject(new Error("timeout")) as never);
    return {
      name: "Redis Cache",
      status: "healthy",
      responseTime: Date.now() - start,
      uptime: 100,
      lastChecked: new Date().toISOString(),
      details: "PING ok",
    };
  } catch (error) {
    return {
      name: "Redis Cache",
      status: "down",
      responseTime: Date.now() - start,
      uptime: 0,
      lastChecked: new Date().toISOString(),
      details: error instanceof Error ? error.message : "Unreachable",
    };
  } finally {
    if (client) {
      try {
        client.disconnect();
      } catch {
        // ignore
      }
    }
  }
}

async function checkOcrWorkers(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const queue = getOcrQueue();
    const counts = await withTimeout(
      queue.getJobCounts("active", "waiting", "failed", "completed"),
      2500,
      Promise.reject(new Error("timeout")) as never,
    );
    const active = counts.active ?? 0;
    const waiting = counts.waiting ?? 0;
    const failed = counts.failed ?? 0;
    // Treat a large backlog or many failures as degraded, not down.
    const status: ServiceStatus = failed > 10 || waiting > 100 ? "degraded" : "healthy";
    return {
      name: "OCR Workers",
      status,
      responseTime: Date.now() - start,
      uptime: 100,
      lastChecked: new Date().toISOString(),
      details: `active ${active}, waiting ${waiting}, failed ${failed}`,
    };
  } catch (error) {
    return {
      name: "OCR Workers",
      status: "down",
      responseTime: Date.now() - start,
      uptime: 0,
      lastChecked: new Date().toISOString(),
      details: error instanceof Error ? error.message : "Queue unreachable",
    };
  }
}

async function checkDedupQueue(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const queue = getDedupQueue();
    const counts = await withTimeout(
      queue.getJobCounts("active", "waiting", "failed"),
      2500,
      Promise.reject(new Error("timeout")) as never,
    );
    return {
      name: "Deduplication Queue",
      status: (counts.failed ?? 0) > 5 ? "degraded" : "healthy",
      responseTime: Date.now() - start,
      uptime: 100,
      lastChecked: new Date().toISOString(),
      details: `active ${counts.active ?? 0}, waiting ${counts.waiting ?? 0}, failed ${counts.failed ?? 0}`,
    };
  } catch (error) {
    return {
      name: "Deduplication Queue",
      status: "down",
      responseTime: Date.now() - start,
      uptime: 0,
      lastChecked: new Date().toISOString(),
      details: error instanceof Error ? error.message : "Queue unreachable",
    };
  }
}

async function checkNasStorage(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const result = await withTimeout(nasHealthCheck(), 4000, { healthy: false, error: "timeout" });
    return {
      name: "File Storage (NAS)",
      status: result.healthy ? "healthy" : "down",
      responseTime: Date.now() - start,
      uptime: result.healthy ? 100 : 0,
      lastChecked: new Date().toISOString(),
      details: result.healthy ? "Read/write/delete probe ok" : (result.error ?? "Probe failed"),
    };
  } catch (error) {
    return {
      name: "File Storage (NAS)",
      status: "down",
      responseTime: Date.now() - start,
      uptime: 0,
      lastChecked: new Date().toISOString(),
      details: error instanceof Error ? error.message : "Probe failed",
    };
  }
}

async function getMetrics(): Promise<SystemMetrics> {
  const todayStart = startOfToday();
  const activeSince = new Date(Date.now() - SESSION_MAX_AGE_MS);

  const [counts] = await db
    .select({
      totalUsers: sql<number>`count(*)::int`,
      activeSessions: sql<number>`count(*) FILTER (WHERE ${users.lastLogin} >= ${activeSince})::int`,
    })
    .from(users);

  const [docToday] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(documents)
    .where(gte(documents.createdAt, todayStart));

  const [ocrToday] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(ocrJobs)
    .where(gte(ocrJobs.createdAt, todayStart));

  const [usedBytes] = await db
    .select({ value: sql<number>`COALESCE(SUM(${documents.fileSize}), 0)::bigint` })
    .from(documents)
    .where(sql`${documents.isDeleted} = 0`);

  const [quota] = await db
    .select({ value: sql<number>`COALESCE(SUM(${workspaces.storageQuotaGb}), 0)::int` })
    .from(workspaces);

  const cpuCount = os.cpus().length || 1;
  const cpuUsage = Math.min(100, Math.round((os.loadavg()[0] / cpuCount) * 100));
  const totalMem = os.totalmem();
  const memoryUsage = totalMem > 0 ? Math.round((1 - os.freemem() / totalMem) * 100) : 0;

  return {
    totalUsers: counts?.totalUsers ?? 0,
    activeSessions: counts?.activeSessions ?? 0,
    documentsToday: docToday?.value ?? 0,
    ocrJobsToday: ocrToday?.value ?? 0,
    storageUsedGB: Math.round((Number(usedBytes?.value ?? 0) / 1e9) * 100) / 100,
    storageTotalGB: Number(quota?.value ?? 0),
    cpuUsage,
    memoryUsage,
    uptimeHours: Math.round(process.uptime() / 3600),
  };
}

/**
 * Collect real system health (service probes + resource metrics).
 * Each probe is independently guarded so a single failing dependency degrades
 * only its own card and never breaks the dashboard.
 */
export async function getSystemHealth(): Promise<{
  services: ServiceHealth[];
  metrics: SystemMetrics;
}> {
  const [database, redis, ocr, dedup, nas, metrics] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkOcrWorkers(),
    checkDedupQueue(),
    checkNasStorage(),
    getMetrics().catch((error) => {
      logWarn("[admin.metrics] Failed to compute system metrics", {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        totalUsers: 0,
        activeSessions: 0,
        documentsToday: 0,
        ocrJobsToday: 0,
        storageUsedGB: 0,
        storageTotalGB: 0,
        cpuUsage: 0,
        memoryUsage: 0,
        uptimeHours: Math.round(process.uptime() / 3600),
      } satisfies SystemMetrics;
    }),
  ]);

  return { services: [database, redis, ocr, dedup, nas], metrics };
}

// --- Storage stats by document category (replaces mock data) ---

const CATEGORY_COLORS = [
  "#d38738",
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#6b7280",
  "#14b8a6",
  "#ec4899",
  "#84cc16",
];

export interface StorageCategory {
  category: string;
  sizeGB: number;
  fileCount: number;
  color: string;
}

export async function getStorageStatsByCategory(): Promise<{
  categories: StorageCategory[];
  totalUsedGB: number;
  totalCapacityGB: number;
}> {
  const rows = await db
    .select({
      category: documents.category,
      bytes: sql<number>`COALESCE(SUM(${documents.fileSize}), 0)::bigint`,
      fileCount: sql<number>`count(*)::int`,
    })
    .from(documents)
    .where(sql`${documents.isDeleted} = 0`)
    .groupBy(documents.category)
    .orderBy(sql`COALESCE(SUM(${documents.fileSize}), 0) DESC`);

  const categories: StorageCategory[] = rows.map((r, i) => ({
    category: String(r.category),
    sizeGB: Math.round((Number(r.bytes) / 1e9) * 100) / 100,
    fileCount: r.fileCount,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  const [quota] = await db
    .select({ value: sql<number>`COALESCE(SUM(${workspaces.storageQuotaGb}), 0)::int` })
    .from(workspaces);

  const totalUsedGB = Math.round(categories.reduce((sum, c) => sum + c.sizeGB, 0) * 100) / 100;

  return {
    categories,
    totalUsedGB,
    totalCapacityGB: Number(quota?.value ?? 0),
  };
}
