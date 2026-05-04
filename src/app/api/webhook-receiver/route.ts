// src/app/api/webhook-receiver/route.ts
// SIM sends POST here when wallet has activity

import { NextRequest, NextResponse } from "next/server";

// In-memory store: address → last 20 events
// In production use Redis/DB, but for demo this works fine
const eventStore = new Map<string, WebhookEvent[]>();

export interface WebhookEvent {
  id: string;
  timestamp: string;
  type: "balances" | "activities" | "transactions";
  chain: string;
  summary: string;
  detail: string;
  direction?: "in" | "out";
  value_usd?: number;
  token?: string;
  raw: unknown;
}

export function getEvents(address: string): WebhookEvent[] {
  const key = address.toLowerCase();
  return eventStore.get(key) || [];
}

export function addEvent(address: string, event: WebhookEvent) {
  const key = address.toLowerCase();
  const existing = eventStore.get(key) || [];
  // Keep last 50 events
  const updated = [event, ...existing].slice(0, 50);
  eventStore.set(key, updated);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const webhookType = req.headers.get("dune-webhook-type") || "unknown";
    const chainId = req.headers.get("dune-webhook-chain-id") || "unknown";
    const timestamp = req.headers.get("dune-webhook-dispatch-timestamp") || new Date().toISOString();

    const events: WebhookEvent[] = [];

    // ── Balance changes ──
    if (webhookType === "balances" && body.balance_changes) {
      for (const change of body.balance_changes) {
        const direction = change.direction === "in" ? "in" : "out";
        const symbol = change.asset?.symbol || "TOKEN";
        const usd = Math.abs(change.value_delta_usd || 0);
        const address = change.subscribed_address;

        const event: WebhookEvent = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp,
          type: "balances",
          chain: chainId,
          direction,
          value_usd: usd,
          token: symbol,
          summary: direction === "in"
            ? `+ ${symbol} received`
            : `- ${symbol} sent`,
          detail: direction === "in"
            ? `Received ${symbol} worth $${usd.toFixed(2)}`
            : `Sent ${symbol} worth $${usd.toFixed(2)}`,
          raw: change,
        };

        if (address) addEvent(address, event);
        events.push(event);
      }
    }

    // ── Activity events ──
    if (webhookType === "activities" && body.activities) {
      for (const act of body.activities) {
        const address = act.to || act.tx_from || "";
        const actType = act.type || "call";

        const typeLabels: Record<string, string> = {
          send: "→ SEND",
          receive: "← RECEIVE",
          swap: "⇄ SWAP",
          approve: "✓ APPROVE",
          mint: "✦ MINT",
          burn: "✕ BURN",
          call: "◆ CONTRACT_CALL",
        };

        const event: WebhookEvent = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: act.block_time || timestamp,
          type: "activities",
          chain: String(act.chain_id || chainId),
          summary: typeLabels[actType] || `◆ ${actType.toUpperCase()}`,
          detail: `tx: ${(act.tx_hash || "").slice(0, 20)}...`,
          raw: act,
        };

        if (address) addEvent(address, event);
        events.push(event);
      }
    }

    // ── Transaction events ──
    if (webhookType === "transactions" && body.transactions) {
      for (const tx of body.transactions) {
        const address = tx.address || tx.from || tx.to || "";
        const isSender = tx.transaction_type === "Sender";

        const event: WebhookEvent = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: tx.block_time || timestamp,
          type: "transactions",
          chain: String(tx.chain_id || chainId),
          direction: isSender ? "out" : "in",
          summary: isSender ? "→ TX_SENT" : "← TX_RECEIVED",
          detail: `hash: ${(tx.hash || "").slice(0, 20)}... | status: ${tx.success ? "OK" : "FAIL"}`,
          raw: tx,
        };

        if (address) addEvent(address, event);
        events.push(event);
      }
    }

    return NextResponse.json({ received: events.length, ok: true });
  } catch (e) {
    console.error("Webhook error:", e);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}