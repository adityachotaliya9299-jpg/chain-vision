

import { NextRequest } from "next/server";
import { getRecentSignals } from "@/lib/redis";
import { startStreamEngine, getStreamStatus } from "@/lib/stream-engine";

export const dynamic = "force-dynamic";

// Start the stream engine when this route is first called
// In production: start this in a separate process on Railway/Fly.io
let engineStarted = false;

export async function GET(req: NextRequest) {
  // Start engine on first request
  if (!engineStarted) {
    engineStarted = true;
    startStreamEngine();
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Client disconnected
        }
      };

      // 1. Send current engine status immediately
      send({
        type: "STATUS",
        status: getStreamStatus(),
        timestamp: new Date().toISOString(),
      });

      // 2. Send last 20 signals from Redis
      const recent = await getRecentSignals(20);
      send({
        type: "HISTORY",
        signals: recent,
        count: recent.length,
      });

      // 3. Poll Redis every 2 seconds for new signals
      let lastCount = recent.length;
      let lastSignalId = recent[0]
        ? JSON.stringify(recent[0]).slice(0, 50)
        : "";

      const interval = setInterval(async () => {
        try {
          const current = await getRecentSignals(20);

          // Check if there are new signals
          const newId = current[0]
            ? JSON.stringify(current[0]).slice(0, 50)
            : "";

          if (newId !== lastSignalId && current.length > 0) {
            // Find truly new signals
            const newCount = current.length - lastCount;
            const newSignals = newCount > 0
              ? current.slice(0, Math.max(1, newCount))
              : [current[0]];

            send({
              type: "NEW_SIGNALS",
              signals: newSignals,
              total: current.length,
            });

            lastSignalId = newId;
            lastCount = current.length;
          }

          // Send status ping every 10 seconds
          send({
            type: "PING",
            status: getStreamStatus(),
            timestamp: new Date().toISOString(),
          });
        } catch {
          // Redis error — send error signal
          send({ type: "ERROR", message: "Signal fetch failed" });
        }
      }, 2000);

      // Cleanup on disconnect
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}