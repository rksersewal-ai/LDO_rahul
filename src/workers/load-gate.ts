import os from "node:os";
import { logWarn } from "@/lib/logging/structured-logger";

/**
 * Adaptive backpressure for CPU-bound workers (OCR).
 *
 * BullMQ concurrency caps how many jobs run *in parallel*, but it does not
 * react to the host being overloaded by other work (other queues, request
 * traffic, neighbouring containers). This gate inspects the live 1-minute load
 * average relative to the CPU count and, when the host is saturated, delays the
 * start of the next job in short increments. This smooths spikes ("queue or
 * delay based on live load tracking") instead of piling more CPU-heavy jobs
 * onto an already-struggling machine.
 *
 * Tunables (env):
 * - WORKER_LOAD_GATE_ENABLED: "false" to disable entirely (default enabled)
 * - WORKER_LOAD_GATE_THRESHOLD: load-per-core ceiling before throttling (default 0.9)
 * - WORKER_LOAD_GATE_STEP_MS: delay per check while overloaded (default 1000)
 * - WORKER_LOAD_GATE_MAX_WAIT_MS: max total delay before proceeding anyway (default 30000)
 */
export interface LoadGateOptions {
  /** Load-average-per-core ceiling. Above this we start delaying. */
  threshold?: number;
  /** How long to wait between load re-checks, in ms. */
  stepMs?: number;
  /** Hard cap on total delay so a job is never starved forever. */
  maxWaitMs?: number;
  /** Label used in the throttle warning log. */
  label?: string;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Current 1-minute load average normalised to a per-core value. */
export function getLoadPerCore(): number {
  const cores = os.cpus().length || 1;
  // loadavg() is unavailable on some platforms (returns [0,0,0] on Windows);
  // in that case this simply returns 0 and the gate is a no-op.
  const oneMinute = os.loadavg()[0] ?? 0;
  return oneMinute / cores;
}

/**
 * Resolve once the host has enough CPU headroom to start another heavy job,
 * or once maxWaitMs has elapsed. Returns the total time waited (ms).
 */
export async function awaitLoadHeadroom(options: LoadGateOptions = {}): Promise<number> {
  if (process.env.WORKER_LOAD_GATE_ENABLED === "false") return 0;

  const threshold = options.threshold ?? Number(process.env.WORKER_LOAD_GATE_THRESHOLD ?? "0.9");
  const stepMs = options.stepMs ?? Number(process.env.WORKER_LOAD_GATE_STEP_MS ?? "1000");
  const maxWaitMs = options.maxWaitMs ?? Number(process.env.WORKER_LOAD_GATE_MAX_WAIT_MS ?? "30000");
  const label = options.label ?? "worker";

  let waited = 0;
  let warned = false;

  while (getLoadPerCore() > threshold && waited < maxWaitMs) {
    if (!warned) {
      logWarn(`[${label}] Host under load (${getLoadPerCore().toFixed(2)}/core); throttling job start`);
      warned = true;
    }
    const delay = Math.min(stepMs, maxWaitMs - waited);
    await sleep(delay);
    waited += delay;
  }

  return waited;
}
