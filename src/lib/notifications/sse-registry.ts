/**
 * Global SSE registry for real-time notifications.
 * Uses globalThis pattern to persist across Next.js hot reloads.
 *
 * IMPORTANT — SINGLE-PROCESS LIMITATION:
 * This registry stores controller references in the memory of the Node.js
 * process that handled the SSE connection. It therefore only works correctly
 * when the Next.js server runs as a **single process** (the default for the
 * LAN deployment described in the README).
 *
 * If the deployment is scaled to multiple processes or replicas (e.g. via PM2
 * cluster mode or multiple containers), a client whose SSE connection lands on
 * process A will NOT receive pushes originated from process B, because process
 * B's `pushToUser` call looks in its own empty registry.
 *
 * TODO: For multi-process deployments, replace this in-memory registry with a
 * Redis pub/sub fan-out (e.g. ioredis subscribe/publish). Each process
 * subscribes to a per-user channel and forwards messages to its local
 * controllers. `ioredis` is already a project dependency.
 */

const globalForSSE = globalThis as unknown as {
  sseRegistry: Map<string, Set<ReadableStreamDefaultController>>;
};

globalForSSE.sseRegistry = globalForSSE.sseRegistry ?? new Map();

export const sseRegistry = globalForSSE.sseRegistry;

/**
 * Push a JSON payload to all connected SSE clients for a given userId.
 * Dead controllers are removed on error.
 */
export function pushToUser(userId: string, data: object): void {
  const controllers = sseRegistry.get(userId);
  if (!controllers) return;

  const message = `data: ${JSON.stringify(data)}\n\n`;
  const encoder = new TextEncoder();
  const encoded = encoder.encode(message);

  for (const controller of controllers) {
    try {
      controller.enqueue(encoded);
    } catch {
      // Controller is dead, remove it
      controllers.delete(controller);
      if (controllers.size === 0) {
        sseRegistry.delete(userId);
      }
    }
  }
}
