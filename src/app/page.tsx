
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
  { key: "DEFI_POSITIONS", desc: "Lending, liquidity pools and staking across all major protocols", color: "#FF6B6B" },
  { key: "AI_INSIGHTS ✦", desc: "Scored wallet intelligence — whale probability, bot detection, risk", color: "#A78BFA" },
  { key: "LIVE_FEED ◉", desc: "SIM webhook real-time stream of wallet events as they happen", color: "#34D399" },
];

const STATS = [
  { label: "CHAINS_SUPPORTED", value: "60+" },
  { label: "AVG_LATENCY", value: "<100ms" },
  { label: "DATA_SOURCE", value: "DUNE_SIM" },
  { label: "INDEXER_REQUIRED", value: "FALSE" },
];

const LINE1 = "SEE_EVERY";
const LINE2 = "CHAIN.";
const LINE3 = "EVERY_MOVE.";
const NAV_TEXT = "MULTICHAIN_WALLET_INTELLIGENCE_TERMINAL";

export default function Home() {
  const [address, setAddress] = useState("");
  const [focused, setFocused] = useState(false);
  const [tick, setTick] = useState(true);
  const [navText, setNavText] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [mounted, setMounted] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  // Title typing state
  const [titlePhase, setTitlePhase] = useState<1 | 2 | 3 | 4>(1);
  const [typed1, setTyped1] = useState("");
  const [typed2, setTyped2] = useState("");
  const [typed3, setTyped3] = useState("");
  const [showCursor1, setShowCursor1] = useState(true);
  const [showCursor2, setShowCursor2] = useState(false);
  const [showCursor3, setShowCursor3] = useState(false);
  
  // New state so the bottom UI doesn't vanish when the title restarts
  const [isLoaded, setIsLoaded] = useState(false); 

  const router = useRouter();

  // Mount + clock
  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date().toUTCString().slice(0, 25));
    const t = setInterval(() => setCurrentTime(new Date().toUTCString().slice(0, 25)), 1000);
    return () => clearInterval(t);
  }, []);

  // Blinking cursor
  useEffect(() => {
    const t = setInterval(() => setTick((p) => !p), 530);
    return () => clearInterval(t);
  }, []);

  // Navbar typewriter
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      if (i <= NAV_TEXT.length) { setNavText(NAV_TEXT.slice(0, i)); i++; }
      else clearInterval(t);
    }, 40);
    return () => clearInterval(t);
  }, []);

  // Title typing — Infinite Async Loop
  useEffect(() => {
    let isMounted = true;
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    const runTypingLoop = async () => {
      while (isMounted) {
        // 1. Reset states for fresh start
        setTyped1(""); setTyped2(""); setTyped3("");
        setShowCursor1(true); setShowCursor2(false); setShowCursor3(false);
        setTitlePhase(1);

        // 2. Type Line 1
        for (let i = 0; i <= LINE1.length; i++) {
          if (!isMounted) return;
          setTyped1(LINE1.slice(0, i));
          await sleep(55);
        }
        setShowCursor1(false); setShowCursor2(true); setTitlePhase(2);

        // 3. Type Line 2
        for (let i = 0; i <= LINE2.length; i++) {
          if (!isMounted) return;
          setTyped2(LINE2.slice(0, i));
          await sleep(55);
        }
        setShowCursor2(false); setShowCursor3(true); setTitlePhase(3);

        // 4. Type Line 3
        for (let i = 0; i <= LINE3.length; i++) {
          if (!isMounted) return;
          setTyped3(LINE3.slice(0, i));
          await sleep(55);
        }
        setShowCursor3(false); setTitlePhase(4);
        setIsLoaded(true); // Triggers the rest of the UI to appear on the first run

        // 5. Pause for 3.5 seconds
        await sleep(3500);

        // 6. Fast Backspace/Erase Effect
        setTitlePhase(3); // Remove glow while erasing
        for (let i = LINE3.length; i >= 0; i--) {
          if (!isMounted) return;
          setTyped3(LINE3.slice(0, i));
          await sleep(15);
        }
        for (let i = LINE2.length; i >= 0; i--) {
          if (!isMounted) return;
          setTyped2(LINE2.slice(0, i));
          await sleep(15);
        }
        for (let i = LINE1.length; i >= 0; i--) {
          if (!isMounted) return;
          setTyped1(LINE1.slice(0, i));
          await sleep(15);
        }

        // Brief pause before starting again
        await sleep(500);
      }
    };

    runTypingLoop();
    return () => { isMounted = false; };
  }, []);

  const handleSearch = () => {
    const trimmed = address.trim();
    if (!trimmed) return;
    router.push(`/wallet/${trimmed}`);
  };

  const showGlow = titlePhase === 4;

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
      {/* Scanlines */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "repeating-linear-gradient(0deg, rgba(0,255,136,0.013) 0px, rgba(0,255,136,0.013) 1px, transparent 1px, transparent 4px)",
      }} />

      {/* Ambient glow */}
      <div style={{
        position: "fixed", top: "-200px", left: "50%", transform: "translateX(-50%)",
        width: "600px", height: "400px", borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(0,255,136,0.04) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "relative", zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 28px",
        borderBottom: "1px solid rgba(0,255,136,0.1)",
        background: "rgba(2,5,2,0.95)",
        backdropFilter: "blur(10px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <span style={{ fontSize: "15px", fontWeight: "bold", letterSpacing: "0.05em", color: "#00FF88" }}>
            CHAIN<span style={{ color: "#00E5FF" }}>VISION</span>
          </span>
          <span style={{ color: "rgba(0, 255, 136, 0.3)" }}>│</span>
          <span style={{ fontSize: "11px", color: "rgba(0, 255, 136, 0.6)", letterSpacing: "0.08em" }}>
            {navText}<span style={{ opacity: tick ? 1 : 0, transition: "opacity 0.1s" }}>█</span>
          </span>
        </div>
        {mounted && (
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "11px", color: "rgba(0, 255, 136, 0.6)" }}>
              SIM_API: <span style={{ color: "#00FF88" }}>READY</span>
            </span>
            <span suppressHydrationWarning style={{ fontSize: "11px", color: "rgba(0, 255, 136, 0.5)" }}>{currentTime}</span>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <div style={{
        position: "relative", zIndex: 10,
        flex: 1,
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "70px 24px 60px",
      }}>

        {/* Badge */}
        <div style={{
          marginBottom: "48px",
          padding: "8px 24px",
          border: "1px solid rgba(0,255,136,0.2)",
          background: "rgba(0,255,136,0.04)",
          fontSize: "12px", color: "rgba(0, 255, 136, 0.85)",
          letterSpacing: "0.12em",
          animation: "fadeUp 0.6s ease forwards",
        }}>
          ▶ POWERED BY DUNE SIM API — 60+ EVM CHAINS + SOLANA — REAL-TIME
        </div>

        {/* Typing title */}
        <div style={{
          textAlign: "center",
          marginBottom: "8px",
          animation: "fadeUp 0.4s ease forwards",
        }}>
          <div style={{ fontSize: "11px", color: "rgba(0, 255, 136, 0.5)", letterSpacing: "0.25em", marginBottom: "20px" }}>
            [ INITIALIZE_WALLET_SCAN ]
          </div>

          {/* Line 1 */}
          <div style={{
            fontSize: "clamp(48px, 8vw, 96px)",
            fontWeight: 900,
            letterSpacing: "-3px",
            lineHeight: 1.0,
            color: "#00FF88",
            textShadow: showGlow ? "0 0 40px rgba(0,255,136,0.3)" : "none",
            transition: "text-shadow 1s ease",
            minHeight: "1.05em",
          }}>
            {typed1}<span style={{ opacity: showCursor1 && tick ? 1 : 0 }}>█</span>
          </div>

          {/* Line 2 */}
          <div style={{
            fontSize: "clamp(48px, 8vw, 96px)",
            fontWeight: 900,
            letterSpacing: "-3px",
            lineHeight: 1.0,
            color: "#00E5FF",
            textShadow: showGlow ? "0 0 40px rgba(0,229,255,0.25)" : "none",
            transition: "text-shadow 1s ease",
            minHeight: "1.05em",
          }}>
            {typed2}<span style={{ opacity: showCursor2 && tick ? 1 : 0 }}>█</span>
          </div>

          {/* Line 3 */}
          <div style={{
            fontSize: "clamp(48px, 8vw, 96px)",
            fontWeight: 900,
            letterSpacing: "-3px",
            lineHeight: 1.0,
            color: "#00FF88",
            textShadow: showGlow ? "0 0 40px rgba(0,255,136,0.3)" : "none",
            transition: "text-shadow 1s ease",
            minHeight: "1.05em",
          }}>
            {typed3}<span style={{ opacity: showCursor3 && tick ? 1 : 0 }}>█</span>
          </div>
        </div>

        {/* Subtext — fades in after initial load */}
        <p style={{
          textAlign: "center",
          fontSize: "14px",
          color: "rgba(0, 255, 136, 0.85)",
          maxWidth: "520px",
          lineHeight: 1.85,
          marginBottom: "52px",
          marginTop: "28px",
          letterSpacing: "0.04em",
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.8s ease, transform 0.8s ease",
        }}>
          // Drop any wallet address to run a full on-chain intelligence report.<br />
          // Tokens · NFTs · DeFi · Activity · AI Score · Live Webhooks.
        </p>

        {/* Search box */}
        <div style={{
          width: "100%", maxWidth: "700px",
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s",
        }}>
          <div style={{ fontSize: "11px", color: "rgba(0, 255, 136, 0.5)", letterSpacing: "0.15em", marginBottom: "8px" }}>
            ROOT@CHAINVISION:~$ SCAN_WALLET
          </div>
          <div style={{
            display: "flex", alignItems: "center",
            border: focused ? "1px solid #00FF88" : "1px solid rgba(0,255,136,0.15)",
            background: focused ? "rgba(0,255,136,0.03)" : "rgba(0,255,136,0.01)",
            transition: "all 0.25s ease",
            boxShadow: focused ? "0 0 30px rgba(0,255,136,0.08), 0 0 0 1px rgba(0,255,136,0.05)" : "none",
          }}>
            <span style={{ padding: "15px 14px 15px 18px", color: focused ? "#00FF88" : "rgba(0, 255, 136, 0.6)", fontSize: "14px", flexShrink: 0, transition: "color 0.2s" }}>▶</span>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="0x... wallet address or ENS name"
              suppressHydrationWarning
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                color: "#00FF88", fontSize: "14px",
                fontFamily: "'Courier New', monospace",
                padding: "15px 8px", caretColor: "#00FF88",
              }}
            />
            <button
              onClick={handleSearch}
              disabled={!address.trim()}
              style={{
                padding: "15px 32px",
                background: address.trim() ? "#00FF88" : "transparent",
                border: "none", borderLeft: "1px solid rgba(0,255,136,0.15)",
                color: address.trim() ? "#020502" : "rgba(0, 255, 136, 0.4)",
                fontFamily: "monospace", fontSize: "12px", fontWeight: "bold",
                letterSpacing: "0.12em", cursor: address.trim() ? "pointer" : "not-allowed",
                transition: "all 0.2s ease", flexShrink: 0,
              }}
            >
              EXECUTE →
            </button>
          </div>

          {/* Demo pills */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", color: "rgba(0, 255, 136, 0.5)", letterSpacing: "0.1em" }}>DEMO:</span>
            {DEMO_WALLETS.map((w) => (
              <button
                key={w.address}
                onClick={() => setAddress(w.address)}
                suppressHydrationWarning
                style={{
                  fontSize: "11px", color: "rgba(0, 255, 136, 0.6)",
                  background: "transparent",
                  border: "1px solid rgba(0,255,136,0.12)",
                  padding: "4px 14px", fontFamily: "monospace",
                  cursor: "pointer", letterSpacing: "0.06em",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#00FF88"; e.currentTarget.style.borderColor = "rgba(0,255,136,0.5)"; e.currentTarget.style.background = "rgba(0,255,136,0.05)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(0, 255, 136, 0.6)"; e.currentTarget.style.borderColor = "rgba(0,255,136,0.12)"; e.currentTarget.style.background = "transparent"; }}
              >
                [{w.label}]
              </button>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          width: "100%", maxWidth: "700px",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          border: "1px solid rgba(0,255,136,0.1)",
          background: "rgba(0,255,136,0.02)",
          marginTop: "44px", marginBottom: "72px",
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 1s ease 0.4s",
        }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{
              padding: "18px 20px", textAlign: "center",
              borderRight: i < 3 ? "1px solid rgba(0,255,136,0.1)" : "none",
            }}>
              <div style={{ fontSize: "22px", fontWeight: "bold", color: "#00FF88", marginBottom: "5px", letterSpacing: "-0.5px" }}>{s.value}</div>
              <div style={{ fontSize: "10px", color: "rgba(0, 255, 136, 0.6)", letterSpacing: "0.1em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div style={{
          width: "100%", maxWidth: "960px",
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 1s ease 0.6s",
        }}>
          <div style={{ fontSize: "10px", color: "rgba(0, 255, 136, 0.5)", letterSpacing: "0.18em", marginBottom: "16px" }}>
            ── AVAILABLE_MODULES ────────────────────────────────────────────────────────────
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1px", background: "rgba(0,255,136,0.08)",
            border: "1px solid rgba(0,255,136,0.08)",
          }}>
            {FEATURES.map((f) => (
              <div
                key={f.key}
                onMouseEnter={() => setHoveredFeature(f.key)}
                onMouseLeave={() => setHoveredFeature(null)}
                style={{
                  background: hoveredFeature === f.key ? "rgba(0,255,136,0.04)" : "#030a03",
                  padding: "22px 22px",
                  transition: "background 0.2s ease",
                  cursor: "default",
                }}
              >
                <div style={{
                  fontSize: "12px", fontWeight: "bold",
                  color: hoveredFeature === f.key ? f.color : "#00FF88",
                  letterSpacing: "0.1em", marginBottom: "10px",
                  transition: "color 0.2s ease",
                }}>
                  ▸ {f.key}
                </div>
                <div style={{ fontSize: "12px", color: "rgba(0, 255, 136, 0.7)", lineHeight: 1.7, letterSpacing: "0.02em" }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          marginTop: "64px", fontSize: "11px", color: "rgba(0, 255, 136, 0.4)",
          letterSpacing: "0.1em", textAlign: "center",
          opacity: isLoaded ? 1 : 0, transition: "opacity 1s ease 0.8s",
        }}>
          ── END_OF_OUTPUT ── CHAINVISION_v2.0 ── DATA_BY_DUNE_SIM ──
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::placeholder { color: rgba(0, 255, 136, 0.4); font-family: 'Courier New', monospace; font-size: 14px; }
        ::selection { background: rgba(0,255,136,0.2); }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #020502; }
        ::-webkit-scrollbar-thumb { background: rgba(0, 255, 136, 0.25); }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,255,136,0.5); }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}