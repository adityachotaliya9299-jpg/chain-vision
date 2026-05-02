"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEMO_WALLETS = [
  { label: "Vitalik.eth", address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" },
  { label: "Binance", address: "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8" },
  { label: "Uniswap", address: "0x1a9C8182C09F50C8318d769245beA52c32BE35BC" },
];

const FEATURES = [
  {
    emoji: "💰",
    title: "Token Balances",
    desc: "Native + ERC-20 assets across 60+ chains with live USD pricing",
    color: "#00E5FF",
  },
  {
    emoji: "🖼️",
    title: "NFT Portfolio",
    desc: "ERC-721 & ERC-1155 collectibles with metadata and rarity",
    color: "#A78BFA",
  },
  {
    emoji: "⚡",
    title: "Live Activity",
    desc: "Real-time swaps, transfers & approvals decoded and classified",
    color: "#34D399",
  },
  {
    emoji: "🏦",
    title: "DeFi Positions",
    desc: "Lending, liquidity pools & staking across all major protocols",
    color: "#FB923C",
  },
  {
    emoji: "🤖",
    title: "AI Insights",
    desc: "Claude-powered on-chain behavior analysis and wallet summary",
    color: "#F472B6",
  },
  {
    emoji: "📋",
    title: "Transactions",
    desc: "Full decoded transaction history with gas cost analytics",
    color: "#FBBF24",
  },
];

const STATS = [
  { value: "60+", label: "EVM Chains" },
  { value: "<100ms", label: "Latency" },
  { value: "Real-time", label: "Live Data" },
  { value: "Free", label: "No Signup" },
];

export default function Home() {
  const [address, setAddress] = useState("");
  const [focused, setFocused] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const router = useRouter();

  const handleSearch = () => {
    const trimmed = address.trim();
    if (!trimmed) return;
    router.push(`/wallet/${trimmed}`);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#060810",
      color: "white",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      overflowX: "hidden",
    }}>

      {/* Ambient blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "-200px", left: "-100px",
          width: "600px", height: "600px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,229,255,0.12) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", top: "40%", right: "-150px",
          width: "500px", height: "500px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(123,47,255,0.1) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: "-100px", left: "35%",
          width: "400px", height: "300px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)",
        }} />
        {/* Grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }} />
      </div>

      {/* Nav */}
      <nav style={{
        position: "relative", zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 40px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "38px", height: "38px", borderRadius: "12px",
            background: "linear-gradient(135deg, rgba(0,229,255,0.15), rgba(123,47,255,0.15))",
            border: "1px solid rgba(0,229,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px",
          }}>⬡</div>
          <span style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "-0.5px" }}>
            Chain<span style={{ color: "#00E5FF" }}>Vision</span>
          </span>
        </div>

        {/* Pill */}
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "8px 16px", borderRadius: "999px",
          background: "rgba(0,229,255,0.06)",
          border: "1px solid rgba(0,229,255,0.2)",
        }}>
          <div style={{
            width: "7px", height: "7px", borderRadius: "50%", background: "#00E5FF",
            boxShadow: "0 0 8px #00E5FF",
            animation: "pulse 2s ease-in-out infinite",
          }} />
          <span style={{ fontSize: "12px", color: "rgba(0,229,255,0.8)", fontFamily: "monospace" }}>
            Powered by Dune SIM API
          </span>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "80px 24px 60px",
      }}>

        {/* Badge */}
        <div style={{
          marginBottom: "32px",
          padding: "8px 20px", borderRadius: "999px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          fontSize: "13px", color: "rgba(255,255,255,0.5)",
          letterSpacing: "0.03em",
        }}>
          🚀 &nbsp;Real-time multichain wallet intelligence — no indexer setup required
        </div>

        {/* Headline */}
        <h1 style={{
          textAlign: "center",
          fontSize: "clamp(52px, 8vw, 92px)",
          fontWeight: 900,
          lineHeight: 1.0,
          letterSpacing: "-3px",
          marginBottom: "24px",
        }}>
          <span style={{ display: "block", color: "white" }}>See Every</span>
          <span style={{
            display: "block",
            background: "linear-gradient(135deg, #00E5FF 0%, #7B2FFF 50%, #A78BFA 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Chain. Every Move.
          </span>
        </h1>

        <p style={{
          textAlign: "center",
          fontSize: "18px",
          color: "rgba(255,255,255,0.4)",
          maxWidth: "500px",
          lineHeight: 1.7,
          marginBottom: "52px",
        }}>
          Drop any wallet address and get a complete picture — token balances, NFTs, DeFi positions, live activity, and AI-generated insights.
        </p>

        {/* Search box */}
        <div style={{ width: "100%", maxWidth: "700px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "8px",
            borderRadius: "18px",
            background: focused ? "rgba(0,229,255,0.05)" : "rgba(255,255,255,0.03)",
            border: focused ? "1px solid rgba(0,229,255,0.5)" : "1px solid rgba(255,255,255,0.08)",
            boxShadow: focused ? "0 0 50px rgba(0,229,255,0.08), 0 0 0 1px rgba(0,229,255,0.1)" : "none",
            transition: "all 0.25s ease",
          }}>
            {/* Icon */}
            <div style={{ padding: "0 8px 0 12px", flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="9" cy="9" r="6" stroke={focused ? "#00E5FF" : "rgba(255,255,255,0.25)"} strokeWidth="1.5" style={{ transition: "stroke 0.2s" }}/>
                <path d="M13.5 13.5L17 17" stroke={focused ? "#00E5FF" : "rgba(255,255,255,0.25)"} strokeWidth="1.5" strokeLinecap="round" style={{ transition: "stroke 0.2s" }}/>
              </svg>
            </div>

            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="0x... wallet address or ENS name"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "white",
                fontSize: "15px",
                fontFamily: "'Courier New', monospace",
                padding: "14px 4px",
                caretColor: "#00E5FF",
              }}
            />

            <button
              onClick={handleSearch}
              disabled={!address.trim()}
              style={{
                flexShrink: 0,
                padding: "14px 30px",
                borderRadius: "12px",
                border: "none",
                fontWeight: 700,
                fontSize: "14px",
                cursor: address.trim() ? "pointer" : "not-allowed",
                background: address.trim()
                  ? "linear-gradient(135deg, #00E5FF, #00BBDD)"
                  : "rgba(255,255,255,0.06)",
                color: address.trim() ? "#060810" : "rgba(255,255,255,0.2)",
                transition: "all 0.2s ease",
                letterSpacing: "0.02em",
              }}
            >
              Analyze →
            </button>
          </div>

          {/* Demo wallet pills */}
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            marginTop: "14px", flexWrap: "wrap", justifyContent: "center",
          }}>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)" }}>Try demo:</span>
            {DEMO_WALLETS.map((w) => (
              <button
                key={w.address}
                onClick={() => setAddress(w.address)}
                style={{
                  fontSize: "12px",
                  color: "rgba(0,229,255,0.7)",
                  background: "rgba(0,229,255,0.05)",
                  border: "1px solid rgba(0,229,255,0.15)",
                  borderRadius: "999px",
                  padding: "5px 14px",
                  cursor: "pointer",
                  fontFamily: "monospace",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.color = "#00E5FF";
                  el.style.borderColor = "rgba(0,229,255,0.5)";
                  el.style.background = "rgba(0,229,255,0.1)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.color = "rgba(0,229,255,0.7)";
                  el.style.borderColor = "rgba(0,229,255,0.15)";
                  el.style.background = "rgba(0,229,255,0.05)";
                }}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: "flex",
          marginTop: "64px",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
        }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{
              padding: "22px 36px",
              textAlign: "center",
              borderRight: i < STATS.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
            }}>
              <div style={{ fontSize: "24px", fontWeight: 800, color: "white", letterSpacing: "-0.5px" }}>
                {s.value}
              </div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Section title */}
        <div style={{ marginTop: "80px", marginBottom: "8px", textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "12px" }}>
            What you get
          </div>
          <h2 style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-1px", color: "white" }}>
            Everything about a wallet.
          </h2>
        </div>

        {/* Feature grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
          maxWidth: "880px",
          width: "100%",
          marginTop: "32px",
        }}>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              onMouseEnter={() => setHoveredFeature(f.title)}
              onMouseLeave={() => setHoveredFeature(null)}
              style={{
                background: hoveredFeature === f.title ? `${f.color}08` : "rgba(255,255,255,0.02)",
                border: hoveredFeature === f.title ? `1px solid ${f.color}35` : "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px",
                padding: "28px 24px",
                transition: "all 0.2s ease",
                transform: hoveredFeature === f.title ? "translateY(-3px)" : "translateY(0)",
                cursor: "default",
              }}
            >
              <div style={{
                fontSize: "28px",
                marginBottom: "16px",
                width: "52px", height: "52px",
                borderRadius: "14px",
                background: `${f.color}12`,
                border: `1px solid ${f.color}25`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {f.emoji}
              </div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "white", marginBottom: "8px" }}>
                {f.title}
              </div>
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", lineHeight: 1.65 }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div style={{
          marginTop: "80px",
          display: "flex", alignItems: "center", gap: "16px",
          opacity: 0.25,
        }}>
          <div style={{ height: "1px", width: "48px", background: "white" }} />
          <span style={{ fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Data by Dune SIM · 60+ EVM Chains
          </span>
          <div style={{ height: "1px", width: "48px", background: "white" }} />
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}