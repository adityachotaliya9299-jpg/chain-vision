// src/app/api/solana/route.ts
import { NextRequest, NextResponse } from "next/server";

const SIM_BASE = "https://api.sim.dune.com/beta/svm";

function simHeaders() {
  return {
    "X-Sim-Api-Key": process.env.SIM_API_KEY || "",
    "Content-Type": "application/json",
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  const type = searchParams.get("type") || "balances";

  if (!address) return NextResponse.json({ error: "Address required" }, { status: 400 });

  try {
    let url = "";
    if (type === "balances") url = `${SIM_BASE}/balances/${address}?limit=50`;
    if (type === "transactions") url = `${SIM_BASE}/transactions/${address}?limit=20`;

    const res = await fetch(url, { headers: simHeaders() });
    if (!res.ok) throw new Error(`SIM SVM error: ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}