"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const DEMO_WALLETS = [
  { label: "vitalik.eth", address: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" },
  { label: "binance_hot", address: "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8" },
  { label: "uniswap_dao", address: "0x1a9C8182C09F50C8318d769245beA52c32BE35BC" },
];

const FEATURES = [
  { key: "TOKEN_BALANCES", desc: "Native + ERC-20 assets across 60+ chains with live USD pricing", color: "#00FF88" },
  { key: "NFT_PORTFOLIO", desc: "ERC-721 & ERC-1155 collectibles with metadata and collection info", color: "#00E5FF" },
  { key: "LIVE_ACTIVITY", desc: "Real-time swaps, transfers and approvals decoded and classified", color: "#FFAA00" },
  { key: "DEFI_POSITIONS", desc: "Lending, liquidity pools and staking across major protocols", color: "#FF6B6B" },
  { key: "AI_INSIGHTS", desc: "Gemini-powered on-chain behavior analysis and wallet profiling", color: "#A78BFA" },
  { key: "TXN_HISTORY", desc: "Full decoded transaction log with gas cost analytics per chain", color: "#34D399" },
];

const STATS = [
  { label: "CHAINS_SUPPORTED", value: "60+" },
  { label: "AVG_LATENCY", value: "<100ms" },
  { label: "DATA_SOURCE", value: "DUNE_SIM" },
  { label: "INDEXER_REQUIRED", value: "FALSE" },
];

const FULL_TEXT = "MULTICHAIN_WALLET_INTELLIGENCE_TERMINAL";

export default function Home() {
  const [address, setAddress] = useState("");
  const [focused, setFocused] = useState(false);
  const [tick, setTick] = useState(true);
  const [typedText, setTypedText] = useState("");
  const [currentTime, setCurrentTime] = useState("");  // FIX: empty on server
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Only run on client — fixes hydration mismatch
  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date().toUTCString().slice(0, 25));
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date().toUTCString().slice(0, 25));
    }, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    const cursorInterval = setInterval(() => setTick((p) => !p), 500);
    return () => clearInterval(cursorInterval);
  }, []);

  useEffect(() => {
    let i = 0;
    const typeInterval = setInterval(() => {
      if (i <= FULL_TEXT.length) {
        setTypedText(FULL_TEXT.slice(0, i));
        i++;
      } else {
        clearInterval(typeInterval);
      }
    }, 55);
    return () => clearInterval(typeInterval);
  }, []);

  const handleSearch = () => {
    const trimmed = address.trim();
    if (!trimmed) return;
    router.push(`/wallet/${trimmed}`);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#020502",
      color: "#00FF88",
      fontFamily: "'Courier New', Courier, monospace",
      display: "flex",
      flexDirection: "column",
      overflowX: "hidden",
    }}>
      {/* Scanline overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "repeating-linear-gradient(0deg, rgba(0,255,136,0.015) 0px, rgba(0,255,136,0.015) 1px, transparent 1px, transparent 3px)",
      }} />

      {/* Top bar */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 24px",
        borderBottom: "1px solid #1a2a1a",
        background: "#030703",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "14px", fontWeight: "bold", letterSpacing: "0.05em" }}>
            CHAIN<span style={{ color: "#00E5FF" }}>VISION</span>
          </span>
          <span style={{ color: "#1a3a1a" }}>│</span>
          <span style={{ fontSize: "10px", color: "#336633", letterSpacing: "0.1em" }}>
            {typedText}<span style={{ opacity: tick ? 1 : 0 }}>█</span>
          </span>
        </div>
        {/* FIX: Only show time after mount to avoid hydration mismatch */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "10px", color: "#336633" }}>
            SIM_API: <span style={{ color: "#00FF88" }}>READY</span>
          </span>
          {mounted && (
            <span suppressHydrationWarning style={{ fontSize: "10px", color: "#336633" }}>
              {currentTime}
            </span>
          )}
        </div>
      </div>

      {/* Hero */}
      <div style={{
        position: "relative", zIndex: 10,
        flex: 1,
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "60px 24px 48px",
      }}>
        <div style={{
          marginBottom: "40px",
          padding: "6px 20px",
          border: "1px solid #1a3a1a",
          background: "#030a03",
          fontSize: "11px", color: "#336633",
          letterSpacing: "0.1em",
        }}>
          ▶ POWERED BY DUNE SIM API — 60+ EVM CHAINS — REAL-TIME DATA
        </div>

        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <div style={{ fontSize: "13px", color: "#336633", letterSpacing: "0.2em", marginBottom: "12px" }}>
            [ INITIALIZE_WALLET_SCAN ]
          </div>
          <h1 style={{ fontSize: "clamp(40px, 7vw, 80px)", fontWeight: 900, letterSpacing: "-2px", lineHeight: 1.0, margin: 0 }}>
            <span style={{ display: "block", color: "#00FF88" }}>SEE_EVERY</span>
            <span style={{ display: "block", color: "#00E5FF" }}>CHAIN.</span>
            <span style={{ display: "block", color: "#00FF88" }}>EVERY_MOVE.</span>
          </h1>
        </div>

        <p style={{
          textAlign: "center", fontSize: "13px", color: "#336633",
          maxWidth: "480px", lineHeight: 1.8, marginBottom: "44px", letterSpacing: "0.03em",
        }}>
          // Drop any wallet address below to run a full on-chain intelligence report.<br />
          // Tokens, NFTs, DeFi, activity history and AI analysis. Instantly.
        </p>

        {/* Search */}
        <div style={{ width: "100%", maxWidth: "680px", marginBottom: "12px" }}>
          <div style={{ fontSize: "10px", color: "#336633", letterSpacing: "0.12em", marginBottom: "6px" }}>
            ROOT@CHAINVISION:~$ SCAN_WALLET
          </div>
          <div style={{
            display: "flex", alignItems: "center",
            border: focused ? "1px solid #00FF88" : "1px solid #1a3a1a",
            background: "#040a04",
            transition: "border-color 0.2s",
            boxShadow: focused ? "0 0 20px rgba(0,255,136,0.08)" : "none",
          }}>
            <span style={{ padding: "14px 12px 14px 16px", color: "#336633", fontSize: "13px", flexShrink: 0 }}>▶</span>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="0x... or ENS name"
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                color: "#00FF88", fontSize: "14px", fontFamily: "'Courier New', monospace",
                padding: "14px 8px", caretColor: "#00FF88",
              }}
            />
            <button
              onClick={handleSearch}
              disabled={!address.trim()}
              style={{
                padding: "14px 28px",
                background: address.trim() ? "#00FF88" : "transparent",
                border: "none", borderLeft: "1px solid #1a3a1a",
                color: address.trim() ? "#020502" : "#1a3a1a",
                fontFamily: "monospace", fontSize: "12px", fontWeight: "bold",
                letterSpacing: "0.1em", cursor: address.trim() ? "pointer" : "not-allowed",
                transition: "all 0.15s", flexShrink: 0,
              }}
            >
              EXECUTE →
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "10px", color: "#1a3a1a", letterSpacing: "0.1em" }}>DEMO_WALLETS:</span>
            {DEMO_WALLETS.map((w) => (
              <button
                key={w.address}
                onClick={() => setAddress(w.address)}
                style={{
                  fontSize: "10px", color: "#336633", background: "transparent",
                  border: "1px solid #1a3a1a", padding: "3px 12px",
                  fontFamily: "monospace", cursor: "pointer", letterSpacing: "0.06em", transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#00FF88"; e.currentTarget.style.borderColor = "#00FF88"; e.currentTarget.style.background = "#00FF8811"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#336633"; e.currentTarget.style.borderColor = "#1a3a1a"; e.currentTarget.style.background = "transparent"; }}
              >
                [{w.label}]
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{
          width: "100%", maxWidth: "680px",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          border: "1px solid #1a2a1a", background: "#030a03",
          marginBottom: "60px", marginTop: "32px",
        }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{ padding: "16px 20px", borderRight: i < 3 ? "1px solid #1a2a1a" : "none", textAlign: "center" }}>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: "#00FF88", marginBottom: "4px" }}>{s.value}</div>
              <div style={{ fontSize: "9px", color: "#336633", letterSpacing: "0.1em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div style={{ width: "100%", maxWidth: "900px" }}>
          <div style={{ fontSize: "10px", color: "#1a3a1a", letterSpacing: "0.15em", marginBottom: "16px" }}>
            ── AVAILABLE_MODULES ──────────────────────────────────────────────────────────
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: "#1a2a1a", border: "1px solid #1a2a1a" }}>
            {FEATURES.map((f) => (
              <div
                key={f.key}
                onMouseEnter={() => setHoveredFeature(f.key)}
                onMouseLeave={() => setHoveredFeature(null)}
                style={{ background: hoveredFeature === f.key ? "#0a150a" : "#030a03", padding: "20px", transition: "background 0.15s", cursor: "default" }}
              >
                <div style={{ fontSize: "11px", fontWeight: "bold", color: hoveredFeature === f.key ? f.color : "#00FF88", letterSpacing: "0.1em", marginBottom: "8px", transition: "color 0.15s" }}>
                  ▸ {f.key}
                </div>
                <div style={{ fontSize: "11px", color: "#336633", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: "60px", fontSize: "10px", color: "#1a3a1a", letterSpacing: "0.1em", textAlign: "center" }}>
          ── END_OF_OUTPUT ── CHAINVISION_v1.0 ── DATA_BY_DUNE_SIM ──
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::placeholder { color: #1a3a1a; font-family: 'Courier New', monospace; }
        ::selection { background: rgba(0,255,136,0.2); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #020502; }
        ::-webkit-scrollbar-thumb { background: #1a3a1a; }
      `}</style>
    </div>
  );
}