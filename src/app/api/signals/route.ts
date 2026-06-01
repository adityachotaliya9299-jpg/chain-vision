import { NextRequest, NextResponse } from "next/server";
import { getRecentSignals } from "@/lib/redis";
import { getStreamStatus } from "@/lib/stream-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const filterType = searchParams.get("type"); // optional filter

  try {
    const raw = await getRecentSignals(50); // Fetch more, then filter

    // Apply type filter if provided
    const signals = filterType
      ? raw.filter((s) => {
          const sig = s as Record<string, unknown>;
          return sig.type === filterType;
        })
      : raw;

    return NextResponse.json({
      signals: signals.slice(0, limit),
      total: signals.length,
      engine: getStreamStatus(),
      timestamp: new Date().toISOString(),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}