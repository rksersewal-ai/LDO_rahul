/**
 * Global SSE registry for real-time notifications.
 * Uses globalThis pattern to persist across Next.js hot reloads.
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
