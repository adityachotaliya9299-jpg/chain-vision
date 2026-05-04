// src/app/api/defi/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  if (!address) return NextResponse.json({ error: "Address required" }, { status: 400 });

  try {
    const res = await fetch(
      `https://api.sim.dune.com/v1/evm/defi/positions/${address}`,
      {
        headers: {
          "X-Sim-Api-Key": process.env.SIM_API_KEY || "",
          "Content-Type": "application/json",
        },
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) throw new Error(`SIM DeFi error: ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}