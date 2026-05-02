// src/app/api/wallet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getBalances, getActivity, getNFTs, getTransactions } from "@/lib/sim";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");
  const type = searchParams.get("type") || "balances";

  if (!address) {
    return NextResponse.json({ error: "Address required" }, { status: 400 });
  }

  try {
    let data;
    switch (type) {
      case "balances":
        data = await getBalances(address);
        break;
      case "activity":
        data = await getActivity(address);
        break;
      case "nfts":
        data = await getNFTs(address);
        break;
      case "transactions":
        data = await getTransactions(address);
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}