// src/app/api/ai-insights/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { walletData } = await req.json();
    if (!walletData) return NextResponse.json({ error: "walletData required" }, { status: 400 });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY not set in .env.local" }, { status: 500 });
    }

    const {
      address,
      totalUSD,
      chains,
      tokenCount,
      topTokens,
      activityBreakdown,
      nftCount,
      txCount,
      failRate,
    } = walletData;

    const prompt = `You are a blockchain forensics AI. Analyze this wallet and return ONLY a valid JSON object. No markdown, no explanation outside the JSON.

WALLET DATA:
- Address: ${address}
- Total USD Value: $${totalUSD}
- Active Chains: ${chains.join(", ")}
- Token Count: ${tokenCount}
- Top Tokens: ${topTokens}
- Recent Activity Breakdown: ${JSON.stringify(activityBreakdown)}
- NFTs Owned: ${nftCount}
- Recent Transactions: ${txCount}
- Transaction Fail Rate: ${failRate}%

Return this exact JSON structure with your analysis:
{
  "overall_score": <number 0-100>,
  "scores": {
    "whale_probability": <number 0-100>,
    "defi_sophistication": <number 0-100>,
    "bot_likelihood": <number 0-100>,
    "risk_score": <number 0-100>,
    "diversification": <number 0-100>
  },
  "wallet_type": "<one of: WHALE | DEFI_DEGEN | NFT_COLLECTOR | DORMANT | BOT | RETAIL | INSTITUTION | DEVELOPER>",
  "verdict": "<one punchy sentence verdict about this wallet>",
  "sections": {
    "WALLET_PROFILE": "<2 sentences>",
    "CHAIN_BEHAVIOR": "<2 sentences>",
    "ASSET_STRATEGY": "<2 sentences>",
    "ACTIVITY_PATTERN": "<2 sentences>",
    "RISK_ASSESSMENT": "<2 sentences>",
    "KEY_FINDING": "<1 most interesting specific insight about this wallet>"
  },
  "flags": [<array of string flags like "HIGH_VALUE", "MULTI_CHAIN", "LOW_ACTIVITY", "SUSPECTED_BOT", "NFT_HEAVY", "DEFI_ACTIVE", "DORMANT", "WHALE">]
}

Base scores on the actual data. Be specific and analytical. Return ONLY the JSON object.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3, // lower = more consistent JSON
        max_tokens: 1200,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content || "";

    // Extract JSON from response (strip any markdown if present)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI did not return valid JSON");

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ analysis: parsed });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}