// src/app/api/subscribe/route.ts
// Creates a SIM webhook subscription for a given wallet address

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { address, appUrl } = await req.json();
    if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });

    const simKey = process.env.SIM_API_KEY;
    if (!simKey) return NextResponse.json({ error: "SIM_API_KEY not set" }, { status: 500 });

    // Use provided appUrl or fallback
    const webhookUrl = `${appUrl || process.env.NEXT_PUBLIC_APP_URL || "https://chain-vision.vercel.app"}/api/webhook-receiver`;

    // Create 3 webhook subscriptions: transactions + activities + balances
    const results = [];

    const webhookTypes = [
      {
        name: `ChainVision_TXN_${address.slice(0, 8)}`,
        type: "transactions",
        extra: {},
      },
      {
        name: `ChainVision_ACT_${address.slice(0, 8)}`,
        type: "activities",
        extra: {},
      },
      {
        name: `ChainVision_BAL_${address.slice(0, 8)}`,
        type: "balances",
        extra: { asset_type: "erc20" },
      },
    ];

    for (const wh of webhookTypes) {
      try {
        const res = await fetch("https://api.sim.dune.com/beta/evm/subscriptions/webhooks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Sim-Api-Key": simKey,
          },
          body: JSON.stringify({
            name: wh.name,
            url: webhookUrl,
            type: wh.type,
            addresses: [address],
            chain_ids: [1, 8453, 137, 42161, 10], // ETH, Base, Polygon, Arbitrum, Optimism
            ...wh.extra,
          }),
        });

        const data = await res.json();
        results.push({ type: wh.type, success: res.ok, data });
      } catch (e) {
        results.push({ type: wh.type, success: false, error: String(e) });
      }
    }

    const allOk = results.every((r) => r.success);
    return NextResponse.json({
      ok: allOk,
      message: allOk
        ? `Monitoring ${address.slice(0, 8)}... on ETH, Base, Polygon, Arbitrum, Optimism`
        : "Partial subscription — some webhooks may have failed",
      webhookUrl,
      results,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}