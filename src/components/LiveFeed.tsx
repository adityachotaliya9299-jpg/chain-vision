"use client";

import { useState, useEffect, useRef } from "react";

interface WebhookEvent {
  id: string;
  timestamp: string;
  type: string;
  chain: string;
  summary: string;
  detail: string;
  direction?: "in" | "out";
  value_usd?: number;
  token?: string;
}

interface Props {
  address: string;
}

function eventColor(e: WebhookEvent): string {
  if (e.summary.includes("RECEIVE") || e.summary.includes("+")) return "#00FF88";
  if (e.summary.includes("SEND") || e.summary.includes("-")) return "#FF4466";
  if (e.summary.includes("SWAP")) return "#00E5FF";
  if (e.summary.includes("MINT")) return "#A78BFA";
  if (e.summary.includes("APPROVE")) return "#FFAA00";
  return "#88BB88";
}

function timeAgo(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  const s = Math.floor(d / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

// Simulate demo events when no real webhook data exists
function generateDemoEvents(address: string): WebhookEvent[] {
  const short = address.slice(0, 8);
  const now = Date.now();
  return [
    {
      id: "demo-1",
      timestamp: new Date(now - 120000).toISOString(),
      type: "balances",
      chain: "1",
      summary: "+ USDC received",
      detail: "Received USDC worth $1,250.00 from 0xf70d...ef22",
      direction: "in",
      value_usd: 1250,
      token: "USDC",
    },
    {
      id: "demo-2",
      timestamp: new Date(now - 240000).toISOString(),
      type: "activities",
      chain: "8453",
      summary: "⇄ SWAP",
      detail: `${short}... swapped ETH → PEPE on Base`,
      direction: "out",
    },
    {
      id: "demo-3",
      timestamp: new Date(now - 360000).toISOString(),
      type: "transactions",
      chain: "137",
      summary: "← TX_RECEIVED",
      detail: "Incoming tx on Polygon | status: OK",
      direction: "in",
    },
    {
      id: "demo-4",
      timestamp: new Date(now - 480000).toISOString(),
      type: "activities",
      chain: "42161",
      summary: "✦ MINT",
      detail: `${short}... minted NFT on Arbitrum`,
    },
    {
      id: "demo-5",
      timestamp: new Date(now - 600000).toISOString(),
      type: "balances",
      chain: "1",
      summary: "- WETH sent",
      detail: "Sent WETH worth $2,100.00 to Uniswap V3",
      direction: "out",
      value_usd: 2100,
      token: "WETH",
    },
  ];
}

export default function LiveFeed({ address }: Props) {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subError, setSubError] = useState<string | null>(null);
  const [subMessage, setSubMessage] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [tick, setTick] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());
  const eventSourceRef = useRef<EventSource | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setTick((p) => !p), 500);
    return () => clearInterval(t);
  }, []);

  // Connect to SSE stream
  const connectSSE = () => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    const es = new EventSource(`/api/live-feed?address=${encodeURIComponent(address)}`);
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "init") {
          if (msg.events?.length > 0) {
            setEvents(msg.events);
            setIsDemo(false);
          } else {
            // No real events yet — show demo
            setEvents(generateDemoEvents(address));
            setIsDemo(true);
          }
        } else if (msg.type === "update" && msg.events?.length > 0) {
          setIsDemo(false);
          const ids = new Set<string>(msg.events.map((ev: WebhookEvent) => ev.id));
          setNewEventIds(ids);
          setTimeout(() => setNewEventIds(new Set()), 3000);
          setEvents((prev) => [...msg.events, ...prev].slice(0, 50));
          // Scroll to top
          feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        }
      } catch {}
    };

    es.onerror = () => setConnected(false);
    return es;
  };

  // Subscribe to SIM webhooks
  const handleSubscribe = async () => {
    setSubscribing(true);
    setSubError(null);
    try {
      const appUrl = window.location.origin;
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, appUrl }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Subscription failed");
      setSubscribed(true);
      setSubMessage(data.message);
      // Connect SSE after subscribing
      connectSSE();
    } catch (e: unknown) {
      setSubError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubscribing(false);
    }
  };

  // Auto-connect SSE on mount (to show any existing events)
  useEffect(() => {
    const es = connectSSE();
    return () => es.close();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  const CHAIN_NAMES: Record<string, string> = {
    "1": "ETHEREUM",
    "8453": "BASE",
    "137": "POLYGON",
    "42161": "ARBITRUM",
    "10": "OPTIMISM",
    "56": "BSC",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Header bar */}
      <div style={{
        padding: "14px 20px",
        borderBottom: "1px solid #1a2a1a",
        background: "#030a03",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "8px", height: "8px", borderRadius: "50%",
              background: connected ? "#00FF88" : "#FF4466",
              boxShadow: connected ? "0 0 8px #00FF88" : "none",
              animation: connected ? "pulse 2s infinite" : "none",
            }} />
            <span style={{ fontSize: "11px", color: connected ? "#00FF88" : "#FF4466", letterSpacing: "0.1em" }}>
              {connected ? "STREAM_CONNECTED" : "STREAM_OFFLINE"}
            </span>
          </div>
          {subscribed && (
            <span style={{ fontSize: "10px", color: "#336633", letterSpacing: "0.08em" }}>
              │ WEBHOOK_ACTIVE: ETH · BASE · POLYGON · ARBITRUM · OPTIMISM
            </span>
          )}
          {isDemo && (
            <span style={{
              fontSize: "9px", color: "#FFAA00",
              border: "1px solid #FFAA0044",
              padding: "2px 8px",
              letterSpacing: "0.1em",
            }}>
              DEMO_MODE — subscribe to see real events
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "10px", color: "#1a3a1a" }}>
            {events.length} EVENTS{tick ? "█" : " "}
          </span>
          {!subscribed && (
            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              style={{
                background: subscribing ? "transparent" : "#00FF88",
                color: subscribing ? "#336633" : "#020502",
                border: subscribing ? "1px solid #336633" : "none",
                padding: "7px 18px",
                fontFamily: "monospace",
                fontSize: "11px",
                fontWeight: "bold",
                letterSpacing: "0.1em",
                cursor: subscribing ? "not-allowed" : "pointer",
              }}
            >
              {subscribing ? `SUBSCRIBING${tick ? "█" : " "}` : "▶ START_LIVE_MONITOR"}
            </button>
          )}
          {subscribed && (
            <span style={{
              fontSize: "10px", color: "#00FF88",
              border: "1px solid #00FF8844",
              padding: "4px 12px",
            }}>
              ✓ MONITORING_ACTIVE
            </span>
          )}
        </div>
      </div>

      {/* Sub error / message */}
      {subError && (
        <div style={{ padding: "10px 20px", background: "#1a0505", borderBottom: "1px solid #550000", color: "#FF4466", fontSize: "11px" }}>
          ERROR: {subError}
        </div>
      )}
      {subMessage && (
        <div style={{ padding: "10px 20px", background: "#030a03", borderBottom: "1px solid #1a3a1a", color: "#00FF88", fontSize: "11px" }}>
          ✓ {subMessage}
        </div>
      )}

      {/* Column headers */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "80px 160px 1fr 100px 80px",
        padding: "6px 20px",
        borderBottom: "1px solid #1a2a1a",
        background: "#030703",
        flexShrink: 0,
      }}>
        {["AGE", "EVENT", "DETAIL", "CHAIN", "VALUE"].map((h) => (
          <span key={h} style={{ fontSize: "9px", color: "#336633", letterSpacing: "0.12em" }}>{h}</span>
        ))}
      </div>

      {/* Event feed */}
      <div ref={feedRef} style={{ flex: 1, overflow: "auto" }}>
        {events.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#1a3a1a", fontFamily: "monospace", fontSize: "13px" }}>
            [ WAITING_FOR_EVENTS{tick ? "█" : " "} ]
          </div>
        ) : (
          events.map((ev) => {
            const isNew = newEventIds.has(ev.id);
            const color = eventColor(ev);
            return (
              <div
                key={ev.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 160px 1fr 100px 80px",
                  padding: "10px 20px",
                  borderBottom: "1px solid #0a150a",
                  alignItems: "center",
                  background: isNew ? "#0a1f0a" : "transparent",
                  transition: "background 0.5s ease",
                  borderLeft: isNew ? `3px solid ${color}` : "3px solid transparent",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#0a150a")}
                onMouseLeave={(e) => (e.currentTarget.style.background = isNew ? "#0a1f0a" : "transparent")}
              >
                <span style={{ color: "#336633", fontSize: "10px" }}>{timeAgo(ev.timestamp)}</span>
                <span style={{ color, fontSize: "11px", fontWeight: "bold", letterSpacing: "0.06em" }}>
                  {isNew && <span style={{ marginRight: "4px" }}>●</span>}
                  {ev.summary}
                </span>
                <span style={{ color: "#88BB88", fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {ev.detail}
                </span>
                <span style={{ color: "#00E5FF", fontSize: "10px", textTransform: "uppercase" }}>
                  {CHAIN_NAMES[ev.chain] || `CHAIN_${ev.chain}`}
                </span>
                <span style={{ color: "#00FF88", fontSize: "11px" }}>
                  {ev.value_usd ? `$${ev.value_usd.toLocaleString()}` : "—"}
                </span>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  );
}