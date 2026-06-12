import { auth } from "@/lib/auth";
import { sseRegistry } from "@/lib/notifications/sse-registry";

export async function GET(_request: Request) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Register controller in the SSE registry
      if (!sseRegistry.has(userId)) {
        sseRegistry.set(userId, new Set());
      }
      sseRegistry.get(userId)!.add(controller);

      // Send initial connection comment
      controller.enqueue(encoder.encode(": connected\n\n"));

      // Set up heartbeat every 30 seconds
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          // Controller is dead, clean up
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          const controllers = sseRegistry.get(userId);
          if (controllers) {
            controllers.delete(controller);
            if (controllers.size === 0) {
              sseRegistry.delete(userId);
            }
          }
        }
      }, 30000);
    },
    cancel() {
      // Clean up on client disconnect
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      const controllers = sseRegistry.get(userId);
      if (controllers) {
        for (const controller of controllers) {
          controllers.delete(controller);
        }
        if (controllers.size === 0) {
          sseRegistry.delete(userId);
        }
      }
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
