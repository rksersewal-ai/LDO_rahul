#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

const profiles = {
  smoke: { durationMs: 10_000, concurrency: 2 },
  normal: { durationMs: 30_000, concurrency: 10 },
  stress: { durationMs: 45_000, concurrency: 30 },
  spike: { durationMs: 20_000, concurrency: 75 },
  soak: { durationMs: 120_000, concurrency: 10 },
};

const profileName = process.env.LOAD_TEST_PROFILE || process.argv[2] || "smoke";
const profile = profiles[profileName];
if (!profile) {
  console.error(
    `Unknown load profile "${profileName}". Valid profiles: ${Object.keys(profiles).join(", ")}`,
  );
  process.exit(1);
}

const baseUrl = (
  process.env.LOAD_TEST_BASE_URL ||
  process.env.APP_BASE_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");
const endpoints = (process.env.LOAD_TEST_ENDPOINTS || "/login,/documents,/pl,/search")
  .split(",")
  .map((path) => path.trim())
  .filter(Boolean);
const errorRateThreshold = Number(process.env.LOAD_TEST_MAX_ERROR_RATE ?? "0.02");
const p95ThresholdMs = Number(process.env.LOAD_TEST_P95_MS ?? "1500");

const startedAt = Date.now();
const endAt = startedAt + profile.durationMs;
const latencies = [];
const statusCounts = new Map();
let completed = 0;
let failed = 0;
let timedOut = 0;
const cpuStart = process.cpuUsage();
const eventLoopStart = performance.eventLoopUtilization();

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return Math.round(sorted[index]);
}

async function hit(endpoint, workerId) {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Number(process.env.LOAD_TEST_TIMEOUT_MS ?? "5000"),
  );
  const start = performance.now();
  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent": `ldo-load-test/${profileName} worker-${workerId}`,
      },
    });
    const latency = performance.now() - start;
    latencies.push(latency);
    statusCounts.set(response.status, (statusCounts.get(response.status) ?? 0) + 1);
    if (response.status >= 500) failed += 1;
  } catch (error) {
    failed += 1;
    if (error instanceof Error && error.name === "AbortError") timedOut += 1;
  } finally {
    clearTimeout(timeout);
    completed += 1;
  }
}

async function worker(workerId) {
  let cursor = workerId;
  while (Date.now() < endAt) {
    await hit(endpoints[cursor % endpoints.length], workerId);
    cursor += profile.concurrency;
  }
}

console.log(`Running ${profileName} load profile against ${baseUrl}`);
console.log(
  `Endpoints: ${endpoints.join(", ")} | concurrency=${profile.concurrency} | duration=${profile.durationMs}ms`,
);
await Promise.all(Array.from({ length: profile.concurrency }, (_, index) => worker(index)));

const durationSeconds = (Date.now() - startedAt) / 1000;
const cpu = process.cpuUsage(cpuStart);
const eventLoop = performance.eventLoopUtilization(eventLoopStart);
const memory = process.memoryUsage();
const errorRate = completed === 0 ? 1 : failed / completed;
const report = {
  profile: profileName,
  baseUrl,
  endpoints,
  durationSeconds: Number(durationSeconds.toFixed(2)),
  requests: completed,
  throughputRps: Number((completed / durationSeconds).toFixed(2)),
  failures: failed,
  timeouts: timedOut,
  errorRate: Number(errorRate.toFixed(4)),
  latencyMs: {
    min: Math.round(Math.min(...latencies, 0)),
    p50: percentile(latencies, 50),
    p95: percentile(latencies, 95),
    p99: percentile(latencies, 99),
    max: Math.round(Math.max(...latencies, 0)),
  },
  statusCounts: Object.fromEntries([...statusCounts.entries()].sort((a, b) => a[0] - b[0])),
  process: {
    rssMb: Number((memory.rss / 1024 / 1024).toFixed(2)),
    heapUsedMb: Number((memory.heapUsed / 1024 / 1024).toFixed(2)),
    cpuUserMs: Math.round(cpu.user / 1000),
    cpuSystemMs: Math.round(cpu.system / 1000),
    eventLoopUtilization: Number(eventLoop.utilization.toFixed(4)),
  },
  thresholds: {
    maxErrorRate: errorRateThreshold,
    maxP95Ms: p95ThresholdMs,
  },
};

await mkdir("load-test-results", { recursive: true });
const reportPath = `load-test-results/${profileName}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
console.log(`Report written to ${reportPath}`);

if (errorRate > errorRateThreshold || report.latencyMs.p95 > p95ThresholdMs) {
  console.error(
    `Load test thresholds failed: errorRate=${errorRate.toFixed(4)} p95=${report.latencyMs.p95}ms`,
  );
  process.exit(1);
}
