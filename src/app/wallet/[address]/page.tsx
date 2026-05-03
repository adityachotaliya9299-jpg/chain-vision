"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import WalletScore from "@/components/WalletScore";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TokenBalance {
  chain: string;
  symbol: string;
  name: string;
  balance: string;
  balance_usd: number | null;
  price_usd: number | null;
  logo_url: string | null;
  address: string;
  decimals: number;
}
interface ActivityItem {
  chain: string;
  block_time: string;
  hash: string;
  activity_type: string;
  from: string;
  to: string | null;
  token_symbol: string | null;
  amount: string | null;
  amount_usd: number | null;
}
interface NFTItem {
  chain: string;
  contract_address: string;
  token_id: string;
  name: string | null;
  collection_name: string | null;
  image_url: string | null;
  balance: string;
}
interface Transaction {
  chain: string;
  hash: string;
  block_time: string;
  from: string;
  to: string | null;
  value: string;
  gas_used: string;
  status: string;
  method: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(v) || !isFinite(v)) return "—";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(2)}K`;
  return `$${v.toFixed(2)}`;
}

// Smart balance parser — handles both raw BigInt strings and already-decimal values
function smartParseBalance(raw: string, decimals: number): number {
  if (!raw || raw === "0") return 0;
  try {
    const n = Number(raw);
    if (!isFinite(n)) return 0;
    // If the number is very large (>1e15), it's likely a raw BigInt — divide by decimals
    if (Math.abs(n) > 1e15) {
      return n / Math.pow(10, decimals ?? 18);
    }
    // Otherwise it's already human-readable
    return n;
  } catch {
    return 0;
  }
}

function fmtBal(raw: string, decimals: number): string {
  const n = smartParseBalance(raw, decimals);
  if (n === 0) return "0";
  if (n < 0.0001) return n.toExponential(2);
  if (n < 1) return n.toFixed(6);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return n.toFixed(4);
}

function short(a: string): string {
  if (!a) return "—";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function ago(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function actColor(t: string): string {
  const map: Record<string, string> = {
    receive: "#00FF88", send: "#FF4466",
    swap: "#00E5FF", approve: "#FFAA00",
  };
  return map[t] || "#888";
}

// ─── Small components ─────────────────────────────────────────────────────────
function SkeletonRow({ cols }: { cols: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, padding: "10px 20px", borderBottom: "1px solid #0a150a", gap: "12px" }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} style={{ height: "10px", background: "#0d1a0d", borderRadius: "2px", animation: "shimmer 1.5s infinite" }} />
      ))}
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div style={{ padding: "60px", textAlign: "center", color: "#1a3a1a", fontFamily: "monospace", fontSize: "13px", letterSpacing: "0.1em" }}>
      [ {msg} ]
    </div>
  );
}

function TH({ cols }: { cols: string[] }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: `repeat(${cols.length}, 1fr)`,
      padding: "8px 20px", borderBottom: "1px solid #1a2a1a",
      background: "#030a03", position: "sticky", top: 0, zIndex: 1,
    }}>
      {cols.map((h) => (
        <span key={h} style={{ fontSize: "9px", color: "#336633", letterSpacing: "0.12em" }}>{h}</span>
      ))}
    </div>
  );
}

// ─── AI Insights ──────────────────────────────────────────────────────────────
// function AIInsights({ address, balances, activity, nfts }: {
//   address: string;
//   balances: TokenBalance[] | null;
//   activity: ActivityItem[] | null;
//   nfts: NFTItem[] | null;
// }) {
//   const [insight, setInsight] = useState<string | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [tick, setTick] = useState(true);

//   useEffect(() => {
//     const t = setInterval(() => setTick((p) => !p), 400);
//     return () => clearInterval(t);
//   }, []);

//   const runAnalysis = async () => {
//     setLoading(true);
//     setError(null);
//     setInsight(null);

//     const totalUSD = (balances || []).reduce((s, b) => s + (b.balance_usd || 0), 0);
//     const chains = [...new Set((balances || []).map((b) => b.chain))];
//     const topTokens = [...(balances || [])]
//       .sort((a, b) => (b.balance_usd || 0) - (a.balance_usd || 0))
//       .slice(0, 5)
//       .map((b) => `${b.symbol} ($${(b.balance_usd || 0).toFixed(0)} on ${b.chain})`);
//     const actTypes = (activity || []).reduce((acc: Record<string, number>, a) => {
//       acc[a.activity_type] = (acc[a.activity_type] || 0) + 1;
//       return acc;
//     }, {});

//     const prompt = `You are a blockchain intelligence analyst. Analyze this wallet and write a concise report.

// WALLET: ${address}
// TOTAL_VALUE_USD: $${totalUSD.toFixed(2)}
// ACTIVE_CHAINS: ${chains.join(", ") || "unknown"}
// TOKEN_COUNT: ${balances?.length || 0}
// TOP_TOKENS: ${topTokens.join(" | ") || "none"}
// RECENT_ACTIVITY: ${JSON.stringify(actTypes)}
// NFTs_OWNED: ${nfts?.length || 0}

// Write a terminal-style intelligence report with EXACTLY these sections in this format:
// [WALLET_PROFILE]
// 2-3 sentences about what type of wallet this is.

// [CHAIN_BEHAVIOR]
// 2-3 sentences about which chains they use and why.

// [ASSET_STRATEGY]
// 2-3 sentences about their portfolio composition.

// [ACTIVITY_PATTERN]
// 2-3 sentences about their trading/usage patterns.

// [RISK_ASSESSMENT]
// 2-3 sentences about risks or notable observations.

// [SUMMARY]
// One sharp sentence verdict on this wallet.

// Be specific, use the data provided, write like a professional analyst.`;

//     try {
//       const res = await fetch("/api/ai-insights", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ prompt }),
//       });

//       if (!res.ok) {
//         const errText = await res.text();
//         throw new Error(`API ${res.status}: ${errText}`);
//       }

//       const data = await res.json();
//       if (data.error) throw new Error(data.error);
//       setInsight(data.insight);
//     } catch (e: unknown) {
//       setError(e instanceof Error ? e.message : "AI analysis failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Parse sections from AI response
//   const sections: Array<{ title: string; text: string }> = [];
//   if (insight) {
//     const matches = [...insight.matchAll(/\[([A-Z_]+)\]\s*([\s\S]*?)(?=\[[A-Z_]+\]|$)/g)];
//     for (const m of matches) {
//       if (m[1] && m[2]) sections.push({ title: m[1].trim(), text: m[2].trim() });
//     }
//   }

//   const sectionColors: Record<string, string> = {
//     WALLET_PROFILE: "#00FF88",
//     CHAIN_BEHAVIOR: "#00E5FF",
//     ASSET_STRATEGY: "#FFAA00",
//     ACTIVITY_PATTERN: "#A78BFA",
//     RISK_ASSESSMENT: "#FF6B6B",
//     SUMMARY: "#34D399",
//   };

//   return (
//     <div style={{ padding: "24px 20px", maxWidth: "900px" }}>

//       {/* Initial state — show launch button */}
//       {!insight && !loading && !error && (
//         <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
//           <div style={{ fontSize: "10px", color: "#336633", letterSpacing: "0.12em" }}>
//             ROOT@CHAINVISION:~$ RUN_AI_ANALYSIS --model gemini-1.5-flash
//           </div>
//           <div style={{ border: "1px solid #1a3a1a", background: "#030a03", padding: "24px" }}>
//             <div style={{ fontSize: "12px", color: "#336633", lineHeight: 1.9, marginBottom: "20px" }}>
//               <span style={{ color: "#1a3a1a" }}>//</span> This module uses Google Gemini AI to analyze on-chain data<br />
//               <span style={{ color: "#1a3a1a" }}>//</span> and generate a comprehensive intelligence report.<br />
//               <span style={{ color: "#1a3a1a" }}>//</span> Data loaded: {" "}
//               <span style={{ color: "#00FF88" }}>{balances?.length ?? 0} tokens</span>{" · "}
//               <span style={{ color: "#00E5FF" }}>{activity?.length ?? 0} activities</span>{" · "}
//               <span style={{ color: "#A78BFA" }}>{nfts?.length ?? 0} NFTs</span>
//             </div>
//             <button
//               onClick={runAnalysis}
//               style={{
//                 background: "#00FF88", color: "#020502",
//                 border: "none", padding: "12px 32px",
//                 fontFamily: "monospace", fontSize: "13px",
//                 fontWeight: "bold", letterSpacing: "0.12em",
//                 cursor: "pointer",
//                 transition: "opacity 0.15s",
//               }}
//               onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
//               onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
//             >
//               ▶ EXECUTE_AI_ANALYSIS
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Loading state */}
//       {loading && (
//         <div>
//           <div style={{ fontSize: "11px", color: "#336633", letterSpacing: "0.12em", marginBottom: "20px" }}>
//             QUERYING_GEMINI_AI{tick ? "█" : " "}
//           </div>
//           {["WALLET_PROFILE", "CHAIN_BEHAVIOR", "ASSET_STRATEGY", "ACTIVITY_PATTERN", "RISK_ASSESSMENT", "SUMMARY"].map((s) => (
//             <div key={s} style={{ borderBottom: "1px solid #0d1a0d", padding: "18px 0" }}>
//               <div style={{ fontSize: "10px", color: "#1a3a1a", letterSpacing: "0.12em", marginBottom: "10px" }}>[{s}]</div>
//               <div style={{ height: "10px", background: "#0d1a0d", borderRadius: "2px", animation: "shimmer 1.5s infinite", maxWidth: "500px", marginBottom: "6px" }} />
//               <div style={{ height: "10px", background: "#0d1a0d", borderRadius: "2px", animation: "shimmer 1.5s infinite", maxWidth: "380px" }} />
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Error state */}
//       {error && !loading && (
//         <div style={{ border: "1px solid #550000", background: "#1a0505", padding: "20px" }}>
//           <div style={{ color: "#FF4466", fontSize: "12px", marginBottom: "12px", letterSpacing: "0.06em" }}>
//             ERROR: {error}
//           </div>
//           <button
//             onClick={runAnalysis}
//             style={{ background: "none", border: "1px solid #FF4466", color: "#FF4466", fontFamily: "monospace", fontSize: "11px", padding: "6px 16px", cursor: "pointer" }}
//           >
//             ↻ RETRY
//           </button>
//         </div>
//       )}

//       {/* Results */}
//       {sections.length > 0 && !loading && (
//         <div>
//           <div style={{ fontSize: "10px", color: "#336633", letterSpacing: "0.12em", marginBottom: "24px" }}>
//             ── AI_ANALYSIS_COMPLETE ── MODEL: GEMINI-1.5-FLASH ────────────────
//           </div>
//           {sections.map((s) => (
//             <div key={s.title} style={{ borderBottom: "1px solid #0d1a0d", padding: "20px 0" }}>
//               <div style={{
//                 fontSize: "10px", fontWeight: "bold",
//                 color: sectionColors[s.title] || "#00FF88",
//                 letterSpacing: "0.15em", marginBottom: "10px",
//               }}>
//                 [{s.title}]
//               </div>
//               <div style={{ fontSize: "13px", color: "#88BB88", lineHeight: 1.8, maxWidth: "700px" }}>
//                 {s.text}
//               </div>
//             </div>
//           ))}
//           <div style={{ marginTop: "24px" }}>
//             <button
//               onClick={runAnalysis}
//               style={{
//                 background: "transparent", border: "1px solid #1a3a1a",
//                 color: "#336633", fontFamily: "monospace", fontSize: "10px",
//                 padding: "8px 20px", cursor: "pointer", letterSpacing: "0.08em",
//               }}
//               onMouseEnter={(e) => { e.currentTarget.style.color = "#00FF88"; e.currentTarget.style.borderColor = "#00FF88"; }}
//               onMouseLeave={(e) => { e.currentTarget.style.color = "#336633"; e.currentTarget.style.borderColor = "#1a3a1a"; }}
//             >
//               ↻ RE_RUN_ANALYSIS
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// ─── Main Wallet Page ─────────────────────────────────────────────────────────
export default function WalletPage() {
  const params = useParams();
  const router = useRouter();
  const address = decodeURIComponent(params.address as string);

  const [tab, setTab] = useState<"balances" | "activity" | "nfts" | "transactions" | "ai">("balances");
  const [balances, setBalances] = useState<TokenBalance[] | null>(null);
  const [activity, setActivity] = useState<ActivityItem[] | null>(null);
  const [nfts, setNfts] = useState<NFTItem[] | null>(null);
  const [txns, setTxns] = useState<Transaction[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalUSD, setTotalUSD] = useState<number | null>(null);
  const [chainCount, setChainCount] = useState(0);
  const [tick, setTick] = useState(true);
  const [currentTime, setCurrentTime] = useState("");
  const [mounted, setMounted] = useState(false);

  // FIX: client-only date to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date().toUTCString().slice(0, 25));
    const t = setInterval(() => setCurrentTime(new Date().toUTCString().slice(0, 25)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTick((p) => !p), 600);
    return () => clearInterval(t);
  }, []);

  const fetchData = useCallback(async (type: "balances" | "activity" | "nfts" | "transactions") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/wallet?address=${encodeURIComponent(address)}&type=${type}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (type === "balances") {
        const b: TokenBalance[] = data.balances || [];
        setBalances(b);
        const total = b.reduce((s, t) => s + (t.balance_usd || 0), 0);
        setTotalUSD(total);
        setChainCount(new Set(b.map((t) => t.chain)).size);
      }
      if (type === "activity") setActivity(data.activity || []);
      if (type === "nfts") setNfts(data.collectibles || []);
      if (type === "transactions") setTxns(data.transactions || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Fetch failed");
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Always load balances on mount
  useEffect(() => { fetchData("balances"); }, [fetchData]);

  // Lazy load other tabs
  useEffect(() => {
    if (tab === "activity" && !activity) fetchData("activity");
    if (tab === "nfts" && !nfts) fetchData("nfts");
    if (tab === "transactions" && !txns) fetchData("transactions");
    if (tab === "ai") {
      if (!activity) fetchData("activity");
      if (!nfts) fetchData("nfts");
    }
  }, [tab, activity, nfts, txns, fetchData]);

  const TABS = [
    { key: "balances" as const, label: "TOKENS", color: "#00FF88" },
    { key: "activity" as const, label: "ACTIVITY", color: "#00FF88" },
    { key: "nfts" as const, label: "NFTs", color: "#00FF88" },
    { key: "transactions" as const, label: "TXN_HISTORY", color: "#00FF88" },
    { key: "ai" as const, label: "AI_INSIGHTS ✦", color: "#A78BFA" },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "#020502", color: "#00FF88",
      fontFamily: "'Courier New', Courier, monospace",
      display: "flex", flexDirection: "column",
    }}>
      {/* Scanline */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "repeating-linear-gradient(0deg, rgba(0,255,136,0.012) 0px, rgba(0,255,136,0.012) 1px, transparent 1px, transparent 3px)",
      }} />

      {/* Topbar */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 20px", borderBottom: "1px solid #1a2a1a", background: "#030703",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <button onClick={() => router.push("/")} style={{
            background: "none", border: "none", color: "#00FF88",
            fontFamily: "monospace", fontSize: "13px", cursor: "pointer", fontWeight: "bold",
          }}>
            ← CHAIN<span style={{ color: "#00E5FF" }}>VISION</span>
          </button>
          <span style={{ color: "#1a3a1a" }}>│</span>
          <span style={{ fontSize: "10px", color: "#336633", letterSpacing: "0.12em" }}>WALLET_ANALYSIS</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "10px", color: "#336633" }}>
            SIM_API: <span style={{ color: "#00FF88" }}>CONNECTED</span>
          </span>
          {mounted && (
            <span suppressHydrationWarning style={{ fontSize: "10px", color: "#336633" }}>
              {currentTime}
            </span>
          )}
          <span style={{ color: "#00FF88", fontSize: "12px" }}>{tick ? "█" : " "}</span>
        </div>
      </div>

      {/* Address + stats */}
      <div style={{ position: "relative", zIndex: 10, padding: "16px 20px", borderBottom: "1px solid #1a2a1a", background: "#030a03" }}>
        <div style={{ fontSize: "9px", color: "#336633", marginBottom: "6px", letterSpacing: "0.12em" }}>TARGET_ADDRESS</div>
        <div style={{ fontSize: "clamp(11px, 1.4vw, 14px)", color: "#00E5FF", letterSpacing: "0.04em", wordBreak: "break-all", marginBottom: "16px" }}>
          {address}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          {[
            { label: "TOTAL_VALUE_USD", value: totalUSD !== null ? fmt(totalUSD) : "SCANNING…", color: "#00FF88" },
            { label: "CHAINS_ACTIVE", value: chainCount > 0 ? `${chainCount}` : "—", color: "#00E5FF" },
            { label: "TOKENS_HELD", value: balances ? `${balances.length}` : "—", color: "#FFAA00" },
            { label: "NFTs_OWNED", value: nfts ? `${nfts.length}` : "—", color: "#A78BFA" },
          ].map((s, i) => (
            <div key={s.label} style={{ flex: "1 1 120px", padding: "10px 20px", borderRight: i < 3 ? "1px solid #1a2a1a" : "none" }}>
              <div style={{ fontSize: "9px", color: "#336633", letterSpacing: "0.1em", marginBottom: "4px" }}>{s.label}</div>
              <div style={{ fontSize: "22px", fontWeight: "bold", color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", borderBottom: "1px solid #1a2a1a", background: "#030703" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 20px",
              background: tab === t.key ? "#0a1a0a" : "transparent",
              border: "none",
              borderRight: "1px solid #1a2a1a",
              borderBottom: tab === t.key ? `2px solid ${t.color}` : "2px solid transparent",
              color: tab === t.key ? t.color : "#336633",
              fontFamily: "monospace", fontSize: "11px",
              letterSpacing: "0.1em", cursor: "pointer",
              transition: "all 0.1s", whiteSpace: "nowrap",
            }}
          >
            {tab === t.key && "▶ "}{t.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => { if (tab !== "ai") fetchData(tab as "balances" | "activity" | "nfts" | "transactions"); }}
          style={{ padding: "10px 20px", background: "transparent", border: "none", borderLeft: "1px solid #1a2a1a", color: "#336633", fontFamily: "monospace", fontSize: "11px", cursor: "pointer" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#00FF88")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#336633")}
        >
          ↻ REFRESH
        </button>
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 10, flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {error && (
          <div style={{ margin: "16px 20px", padding: "12px 16px", background: "#1a0505", border: "1px solid #550000", color: "#FF4466", fontSize: "12px" }}>
            ERROR: {error}
          </div>
        )}

        {/* TOKENS */}
        {tab === "balances" && (
          <div style={{ flex: 1, overflow: "auto" }}>
            <TH cols={["TOKEN", "CHAIN", "BALANCE", "VALUE_USD", "PRICE_USD"]} />
            {loading
              ? Array.from({ length: 12 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
              : (balances || []).length === 0 ? <Empty msg="NO_TOKENS_FOUND" />
              : [...(balances || [])].sort((a, b) => (b.balance_usd || 0) - (a.balance_usd || 0)).map((t, i) => (
                <div key={`${t.chain}-${t.address}-${i}`}
                  style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", padding: "10px 20px", borderBottom: "1px solid #0a150a", cursor: "default", alignItems: "center" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#0a150a")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {t.logo_url && <img src={t.logo_url} alt="" width={14} height={14} style={{ borderRadius: "50%", opacity: 0.8 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                    <span style={{ color: "#00FF88", fontSize: "12px", fontWeight: "bold" }}>{t.symbol}</span>
                    <span style={{ color: "#1a3a1a", fontSize: "10px" }}>{t.name?.slice(0, 14)}</span>
                  </div>
                  <span style={{ color: "#00E5FF", fontSize: "11px", textTransform: "uppercase" }}>{t.chain?.slice(0, 12)}</span>
                  <span style={{ color: "#88BB88", fontSize: "12px", fontFamily: "monospace" }}>
                    {fmtBal(t.balance, t.decimals ?? 18)}
                  </span>
                  <span style={{ fontSize: "13px", color: (t.balance_usd || 0) > 100 ? "#00FF88" : "#88BB88", fontWeight: "bold" }}>
                    {fmt(t.balance_usd)}
                  </span>
                  <span style={{ color: "#555", fontSize: "11px" }}>
                    {t.price_usd != null ? `$${Number(t.price_usd).toFixed(4)}` : "—"}
                  </span>
                </div>
              ))}
          </div>
        )}

        {/* ACTIVITY */}
        {tab === "activity" && (
          <div style={{ flex: 1, overflow: "auto" }}>
            <TH cols={["AGE", "TYPE", "FROM", "TO", "AMOUNT", "VALUE_USD"]} />
            {loading
              ? Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              : (activity || []).length === 0 ? <Empty msg="NO_ACTIVITY_FOUND" />
              : (activity || []).map((a, i) => (
                <div key={`${a.hash}-${i}`}
                  style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", padding: "10px 20px", borderBottom: "1px solid #0a150a", alignItems: "center" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#0a150a")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ color: "#336633", fontSize: "11px" }}>{ago(a.block_time)}</span>
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: actColor(a.activity_type), textTransform: "uppercase" }}>{a.activity_type}</span>
                  <span style={{ color: "#88BB88", fontSize: "11px", fontFamily: "monospace" }}>{short(a.from)}</span>
                  <span style={{ color: "#88BB88", fontSize: "11px", fontFamily: "monospace" }}>{a.to ? short(a.to) : "—"}</span>
                  <span style={{ color: "#AAAAAA", fontSize: "11px" }}>{a.amount ? `${parseFloat(a.amount).toFixed(4)} ${a.token_symbol || ""}` : "—"}</span>
                  <span style={{ color: "#00FF88", fontSize: "11px" }}>{fmt(a.amount_usd)}</span>
                </div>
              ))}
          </div>
        )}

        {/* NFTs */}
        {tab === "nfts" && (
          <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
            {loading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
                {Array.from({ length: 12 }).map((_, i) => <div key={i} style={{ height: "200px", background: "#0a150a", border: "1px solid #1a2a1a", animation: "shimmer 1.5s infinite" }} />)}
              </div>
            ) : (nfts || []).length === 0 ? <Empty msg="NO_NFTs_FOUND" /> : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
                {(nfts || []).map((n, i) => (
                  <div key={`${n.contract_address}-${n.token_id}-${i}`}
                    style={{ border: "1px solid #1a2a1a", background: "#040a04", transition: "border-color 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#00FF88")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1a2a1a")}
                  >
                    <div style={{ width: "100%", aspectRatio: "1", background: "#0a150a", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
                      {n.image_url ? <img src={n.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /> : <span style={{ fontSize: "28px", color: "#1a3a1a" }}>◈</span>}
                      <div style={{ position: "absolute", top: "4px", right: "4px", background: "#00E5FF22", border: "1px solid #00E5FF44", padding: "2px 5px", fontSize: "8px", color: "#00E5FF" }}>
                        #{n.token_id.slice(0, 6)}
                      </div>
                    </div>
                    <div style={{ padding: "10px" }}>
                      <div style={{ fontSize: "11px", color: "#00FF88", fontWeight: "bold", marginBottom: "2px" }}>{n.name?.slice(0, 18) || "Unnamed"}</div>
                      <div style={{ fontSize: "9px", color: "#336633" }}>{n.collection_name?.slice(0, 20) || short(n.contract_address)}</div>
                      <div style={{ fontSize: "9px", color: "#00E5FF", marginTop: "4px", textTransform: "uppercase" }}>{n.chain}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TRANSACTIONS */}
        {tab === "transactions" && (
          <div style={{ flex: 1, overflow: "auto" }}>
            <TH cols={["AGE", "STATUS", "FROM", "TO", "METHOD", "CHAIN"]} />
            {loading
              ? Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              : (txns || []).length === 0 ? <Empty msg="NO_TRANSACTIONS_FOUND" />
              : (txns || []).map((t, i) => (
                <div key={`${t.hash}-${i}`}
                  style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", padding: "10px 20px", borderBottom: "1px solid #0a150a", alignItems: "center" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#0a150a")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ color: "#336633", fontSize: "11px" }}>{ago(t.block_time)}</span>
                  <span style={{ fontSize: "11px", color: t.status === "success" ? "#00FF88" : "#FF4466", fontWeight: "bold" }}>{t.status === "success" ? "✓ OK" : "✗ FAIL"}</span>
                  <span style={{ color: "#88BB88", fontSize: "11px", fontFamily: "monospace" }}>{short(t.from)}</span>
                  <span style={{ color: "#88BB88", fontSize: "11px", fontFamily: "monospace" }}>{t.to ? short(t.to) : "CONTRACT_DEPLOY"}</span>
                  <span style={{ color: "#FFAA00", fontSize: "10px", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.method || "transfer()"}</span>
                  <span style={{ color: "#00E5FF", fontSize: "10px", textTransform: "uppercase" }}>{t.chain?.slice(0, 8)}</span>
                </div>
              ))}
          </div>
        )}

        {/* AI INSIGHTS */}
       {tab === "ai" && (
  <div style={{ flex: 1, overflow: "auto" }}>
    <WalletScore
      address={address}
      balances={balances}
      activity={activity}
      nfts={nfts}
      transactions={txns}
    />
  </div>
)}
      </div>

      {/* Footer */}
      <div style={{ position: "relative", zIndex: 10, padding: "8px 20px", borderTop: "1px solid #1a2a1a", background: "#030703", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "10px", color: "#1a3a1a" }}>DATA_SOURCE: DUNE_SIM_API | CHAINS: 60+ | AI: GEMINI-1.5-FLASH</span>
        <span style={{ fontSize: "10px", color: "#1a3a1a" }}>CHAIN<span style={{ color: "#00E5FF" }}>VISION</span>_v1.0.0</span>
      </div>

      <style>{`
        @keyframes shimmer { 0%,100%{opacity:0.4} 50%{opacity:1} }
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#020502}
        ::-webkit-scrollbar-thumb{background:#1a3a1a;border-radius:2px}
        ::-webkit-scrollbar-thumb:hover{background:#00FF8833}
      `}</style>
    </div>
  );
}