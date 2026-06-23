import { auth } from "@/lib/auth";
import { sseRegistry } from "@/lib/notifications/sse-registry";

export const runtime = "nodejs";

// Close stale connections after 4 hours to prevent controller accumulation.
// Clients reconnect automatically via EventSource retry semantics.
const MAX_CONNECTION_AGE_MS = 4 * 60 * 60 * 1000;

export async function GET(_request: Request) {
  const session = await auth();
  const userId: string | undefined = session?.user?.id;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  // userId is definitely string from here on — reassign to a narrowed const
  // so the cleanup closure captures the narrowed type.
  const safeUserId: string = userId;

  const encoder = new TextEncoder();
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  let maxAgeTimeout: ReturnType<typeof setTimeout> | null = null;
  let thisController: ReadableStreamDefaultController | null = null;

  function cleanup(controller: ReadableStreamDefaultController) {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (maxAgeTimeout) clearTimeout(maxAgeTimeout);
    const controllers = sseRegistry.get(safeUserId);
    if (controllers) {
      controllers.delete(controller);
      if (controllers.size === 0) {
        sseRegistry.delete(safeUserId);
      }
    }
  }

  const stream = new ReadableStream({
    start(controller) {
      thisController = controller;

      // Register controller in the SSE registry
      if (!sseRegistry.has(safeUserId)) {
        sseRegistry.set(safeUserId, new Set());
      }
      sseRegistry.get(safeUserId)!.add(controller);

      // Send initial connection comment
      controller.enqueue(encoder.encode(": connected\n\n"));

      // Set up heartbeat every 30 seconds
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          // Controller is dead, clean up
          cleanup(controller);
        }
      }, 30000);

      // Force-close the connection after MAX_CONNECTION_AGE_MS to prevent
      // stale controllers from accumulating in the in-process registry.
      maxAgeTimeout = setTimeout(() => {
        try {
          controller.close();
        } catch {
          // Already closed
        }
        cleanup(controller);
      }, MAX_CONNECTION_AGE_MS);
    },
    cancel() {
      // Clean up only this stream's controller on client disconnect
      if (thisController) cleanup(thisController);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
