"use client";

import { useState, useEffect, useRef } from "react";

interface Signal {
  type: string;
  confidence?: number;
  wallet?: string;
  tokenSymbol?: string;
  amountUsd?: number;
  chain?: string;
  timestamp: string;
  summary: string;
  detail?: string;
  color?: string;
  walletCount?: number;
  totalUsd?: number;
}

interface EngineStatus {
  helius: string;
  alchemy: string;
  eventsProcessed: number;
  signalsGenerated: number;
}

function timeAgo(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  const s = Math.floor(d / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

function signalColor(type: string): string {
  const colors: Record<string, string> = {
    SMART_MONEY_BUY: "#00FF88",
    SMART_MONEY_SELL: "#FF4466",
    WHALE_TRANSFER: "#FFAA00",
    LP_REMOVAL: "#FF6B6B",
    BRIDGE_INFLOW: "#34D399",
    BRIDGE_OUTFLOW: "#A78BFA",
    NEW_TOKEN_LAUNCH: "#00E5FF",
    COORDINATED_ACTIVITY: "#FF2255",
    PING: "#2a4a2a",
  };
  return colors[type] || "#88BB88";
}

function signalIcon(type: string): string {
  const icons: Record<string, string> = {
    SMART_MONEY_BUY: "★",
    SMART_MONEY_SELL: "▼",
    WHALE_TRANSFER: "🐋",
    LP_REMOVAL: "⚠",
    BRIDGE_INFLOW: "←",
    BRIDGE_OUTFLOW: "→",
    NEW_TOKEN_LAUNCH: "🚀",
    COORDINATED_ACTIVITY: "◈",
  };
  return icons[type] || "◆";
}

interface Props {
  maxHeight?: string;
  showHeader?: boolean;
  filterType?: string;
}

export default function SignalFeed({
  maxHeight = "600px",
  showHeader = true,
  filterType,
}: Props) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [status, setStatus] = useState<EngineStatus | null>(null);
  const [connected, setConnected] = useState(false);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [tick, setTick] = useState(true);
  const [filter, setFilter] = useState<string>(filterType || "ALL");
  const feedRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const t = setInterval(() => setTick((p) => !p), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    // Connect to SSE stream
    const connect = () => {
      if (esRef.current) esRef.current.close();

      const es = new EventSource("/api/stream");
      esRef.current = es;

      es.onopen = () => setConnected(true);
      es.onerror = () => {
        setConnected(false);
        setTimeout(connect, 5000); // Reconnect after 5s
      };

      es.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "STATUS" || msg.type === "PING") {
            if (msg.status) setStatus(msg.status);
            setConnected(true);
          }

          if (msg.type === "HISTORY" && msg.signals?.length > 0) {
            setSignals(msg.signals);
          }

          if (msg.type === "NEW_SIGNALS" && msg.signals?.length > 0) {
            const ids = new Set<string>(
              msg.signals.map((s: Signal) =>
                `${s.type}-${s.timestamp}`
              )
            );
            setNewIds(ids);
            setTimeout(() => setNewIds(new Set()), 4000);

            setSignals((prev) => {
              const combined = [...msg.signals, ...prev];
              return combined.slice(0, 100); // Keep last 100
            });

            // Scroll to top for new signals
            feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
          }
        } catch { /* ignore parse errors */ }
      };
    };

    connect();
    return () => esRef.current?.close();
  }, []);

  // Apply filter
  const displayed = filter === "ALL"
    ? signals
    : signals.filter((s) => s.type === filter);

  const FILTER_TYPES = [
    "ALL",
    "SMART_MONEY_BUY",
    "WHALE_TRANSFER",
    "COORDINATED_ACTIVITY",
    "LP_REMOVAL",
    "NEW_TOKEN_LAUNCH",
    "BRIDGE_INFLOW",
  ];

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      border: "1px solid rgba(0,255,136,0.1)",
      background: "#020502",
      fontFamily: "'Courier New', monospace",
    }}>

      {/* Header */}
      {showHeader && (
        <div style={{
          padding: "12px 20px",
          borderBottom: "1px solid rgba(0,255,136,0.1)",
          background: "#030a03",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Live indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: connected ? "#00FF88" : "#FF4466",
                boxShadow: connected ? "0 0 8px #00FF88" : "none",
                animation: connected ? "pulse 2s infinite" : "none",
              }} />
              <span style={{
                fontSize: "12px",
                color: connected ? "#00FF88" : "#FF4466",
                letterSpacing: "0.1em",
              }}>
                {connected ? "STREAM_CONNECTED" : "STREAM_OFFLINE"}
              </span>
            </div>

            {/* Engine stats */}
            {status && (
              <div style={{ display: "flex", gap: "16px" }}>
                <span style={{ fontSize: "11px", color: "#4a7a4a" }}>
                  HELIUS: <span style={{ color: status.helius === "connected" ? "#00FF88" : "#FF4466" }}>
                    {status.helius.toUpperCase()}
                  </span>
                </span>
                <span style={{ fontSize: "11px", color: "#4a7a4a" }}>
                  ALCHEMY: <span style={{ color: status.alchemy === "connected" ? "#00FF88" : "#FF4466" }}>
                    {status.alchemy.toUpperCase()}
                  </span>
                </span>
                <span style={{ fontSize: "11px", color: "#2a4a2a" }}>
                  {status.eventsProcessed.toLocaleString()} events processed
                </span>
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", color: "#2a4a2a" }}>
              {displayed.length} signals{tick ? "█" : " "}
            </span>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div style={{
        padding: "8px 20px",
        borderBottom: "1px solid rgba(0,255,136,0.08)",
        background: "#030703",
        display: "flex", gap: "6px", flexWrap: "wrap",
        flexShrink: 0,
      }}>
        {FILTER_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            style={{
              background: filter === type ? `${signalColor(type)}22` : "transparent",
              border: `1px solid ${filter === type ? signalColor(type) : "rgba(0,255,136,0.12)"}`,
              color: filter === type ? signalColor(type) : "#4a7a4a",
              fontFamily: "monospace",
              fontSize: "10px",
              padding: "3px 12px",
              cursor: "pointer",
              letterSpacing: "0.06em",
              transition: "all 0.15s",
            }}
          >
            {type === "ALL" ? "ALL" : type.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Column headers */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "60px 200px 1fr 80px 80px",
        padding: "8px 20px",
        borderBottom: "1px solid rgba(0,255,136,0.1)",
        background: "#030a03",
        flexShrink: 0,
      }}>
        {["AGE", "SIGNAL_TYPE", "DETAIL", "CHAIN", "VALUE"].map((h) => (
          <span key={h} style={{
            fontSize: "11px", color: "#5a8a5a",
            letterSpacing: "0.12em", fontWeight: "600",
          }}>
            {h}
          </span>
        ))}
      </div>

      {/* Signal rows */}
      <div
        ref={feedRef}
        style={{ overflow: "auto", maxHeight, flex: 1 }}
      >
        {displayed.length === 0 ? (
          <div style={{
            padding: "60px",
            textAlign: "center",
            color: "#2a4a2a",
            fontSize: "13px",
            letterSpacing: "0.1em",
          }}>
            {connected
              ? `[ WAITING_FOR_SIGNALS${tick ? "█" : " "} ]`
              : "[ CONNECTING_TO_STREAM... ]"
            }
          </div>
        ) : (
          displayed.map((signal, i) => {
            const id = `${signal.type}-${signal.timestamp}`;
            const isNew = newIds.has(id);
            const color = signal.color || signalColor(signal.type);

            return (
              <div
                key={`${id}-${i}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 200px 1fr 80px 80px",
                  padding: "11px 20px",
                  borderBottom: "1px solid #0a150a",
                  alignItems: "center",
                  background: isNew ? `${color}08` : "transparent",
                  borderLeft: isNew ? `3px solid ${color}` : "3px solid transparent",
                  transition: "background 0.5s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#0a150a")}
                onMouseLeave={(e) => (e.currentTarget.style.background = isNew ? `${color}08` : "transparent")}
              >
                {/* Age */}
                <span style={{ fontSize: "11px", color: "#4a7a4a" }}>
                  {timeAgo(signal.timestamp)}
                </span>

                {/* Signal type */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {isNew && (
                    <span style={{ color, fontSize: "8px" }}>●</span>
                  )}
                  <span style={{
                    fontSize: "11px", fontWeight: "bold",
                    color,
                    letterSpacing: "0.04em",
                  }}>
                    {signalIcon(signal.type)} {signal.type.replace(/_/g, " ")}
                  </span>
                  {signal.confidence && (
                    <span style={{
                      fontSize: "9px", color: "#4a7a4a",
                      border: "1px solid rgba(0,255,136,0.15)",
                      padding: "1px 5px",
                    }}>
                      {signal.confidence}%
                    </span>
                  )}
                </div>

                {/* Detail */}
                <span style={{
                  fontSize: "12px", color: "#88BB88",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {signal.summary}
                </span>

                {/* Chain */}
                <span style={{
                  fontSize: "11px", color: "#00E5FF",
                  textTransform: "uppercase",
                }}>
                  {(signal.chain || "").slice(0, 8)}
                </span>

                {/* Value */}
                <span style={{ fontSize: "12px", color: "#00FF88" }}>
                  {signal.amountUsd
                    ? signal.amountUsd >= 1_000_000
                      ? `$${(signal.amountUsd / 1_000_000).toFixed(1)}M`
                      : signal.amountUsd >= 1_000
                      ? `$${(signal.amountUsd / 1_000).toFixed(0)}K`
                      : `$${signal.amountUsd.toFixed(0)}`
                    : "—"
                  }
                </span>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 8px #00FF88} 50%{opacity:0.4;box-shadow:none} }
      `}</style>
    </div>
  );
}