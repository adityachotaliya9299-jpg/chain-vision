// src/app/api/live-feed/route.ts
// Server-Sent Events stream — browser connects here to get real-time events

import { NextRequest } from "next/server";
import { getEvents } from "../webhook-receiver/route";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address") || "";

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial events immediately
      const existing = getEvents(address);
      const initData = `data: ${JSON.stringify({ type: "init", events: existing })}\n\n`;
      controller.enqueue(encoder.encode(initData));

      // Poll for new events every 2 seconds
      let lastCount = existing.length;
      const interval = setInterval(() => {
        const current = getEvents(address);
        if (current.length > lastCount) {
          const newEvents = current.slice(0, current.length - lastCount);
          const data = `data: ${JSON.stringify({ type: "update", events: newEvents })}\n\n`;
          controller.enqueue(encoder.encode(data));
          lastCount = current.length;
        }
        // Keep-alive ping every 2s
        controller.enqueue(encoder.encode(": ping\n\n"));
      }, 2000);

      // Clean up when client disconnects
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}