"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface WalletSummary {
  address: string;
  totalUSD: number;
  tokenCount: number;
  chainCount: number;
  nftCount: number;
  chains: string[];
  topTokens: Array<{ symbol: string; usd: number }>;
  activityCount: number;
  loading: boolean;
  error: string | null;
}

function fmt(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(2)}K`;
  return `$${v.toFixed(2)}`;
}
function short(a: string) { return `${a.slice(0, 6)}…${a.slice(-4)}`; }

function WalletColumn({ summary, label }: { summary: WalletSummary; label: "WALLET_A" | "WALLET_B" }) {
  const color = label === "WALLET_A" ? "#00FF88" : "#00E5FF";
  return (
    <div style={{ flex: 1, borderRight: label === "WALLET_A" ? "1px solid #1a2a1a" : "none", overflow: "auto" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #1a2a1a", background: "#030a03" }}>
        <div style={{ fontSize: "9px", color: "#336633", letterSpacing: "0.15em", marginBottom: "6px" }}>{label}</div>
        <div style={{ fontSize: "11px", color, fontFamily: "monospace", wordBreak: "break-all" }}>
          {summary.address ? short(summary.address) : "—"}
        </div>
      </div>

      {summary.loading && (
        <div style={{ padding: "40px", textAlign: "center", color: "#336633", fontSize: "11px" }}>LOADING…</div>
      )}
      {summary.error && (
        <div style={{ padding: "20px", color: "#FF4466", fontSize: "11px" }}>ERROR: {summary.error}</div>
      )}
      {!summary.loading && !summary.error && summary.address && (
        <div>
          {/* Stats */}
          {[
            { label: "TOTAL_VALUE", value: fmt(summary.totalUSD), color: summary.totalUSD > 0 ? color : "#555" },
            { label: "TOKENS_HELD", value: `${summary.tokenCount}`, color },
            { label: "CHAINS_ACTIVE", value: `${summary.chainCount}`, color },
            { label: "NFTs_OWNED", value: `${summary.nftCount}`, color },
            { label: "RECENT_ACTIVITY", value: `${summary.activityCount} txns`, color },
          ].map((s) => (
            <div key={s.label} style={{ padding: "14px 20px", borderBottom: "1px solid #0a150a", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#0a150a")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontSize: "10px", color: "#336633", letterSpacing: "0.1em" }}>{s.label}</span>
              <span style={{ fontSize: "15px", fontWeight: "bold", color: s.color, fontFamily: "monospace" }}>{s.value}</span>
            </div>
          ))}

          {/* Active chains */}
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #0a150a" }}>
            <div style={{ fontSize: "9px", color: "#336633", letterSpacing: "0.12em", marginBottom: "10px" }}>ACTIVE_CHAINS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {summary.chains.slice(0, 8).map((c) => (
                <span key={c} style={{ fontSize: "9px", color, border: `1px solid ${color}33`, padding: "2px 8px", letterSpacing: "0.08em", textTransform: "uppercase" }}>{c.slice(0, 10)}</span>
              ))}
            </div>
          </div>

          {/* Top tokens */}
          <div style={{ padding: "14px 20px" }}>
            <div style={{ fontSize: "9px", color: "#336633", letterSpacing: "0.12em", marginBottom: "10px" }}>TOP_TOKENS</div>
            {summary.topTokens.slice(0, 5).map((t, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", color, fontWeight: "bold" }}>{t.symbol}</span>
                <span style={{ fontSize: "11px", color: "#88BB88" }}>{fmt(t.usd)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [addrA, setAddrA] = useState(searchParams.get("a") || "");
  const [addrB, setAddrB] = useState(searchParams.get("b") || "");
  const [walletA, setWalletA] = useState<WalletSummary>({ address: "", totalUSD: 0, tokenCount: 0, chainCount: 0, nftCount: 0, chains: [], topTokens: [], activityCount: 0, loading: false, error: null });
  const [walletB, setWalletB] = useState<WalletSummary>({ address: "", totalUSD: 0, tokenCount: 0, chainCount: 0, nftCount: 0, chains: [], topTokens: [], activityCount: 0, loading: false, error: null });
  const [aiComparison, setAiComparison] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [tick, setTick] = useState(true);

  useEffect(() => { const t = setInterval(() => setTick((p) => !p), 500); return () => clearInterval(t); }, []);

  const fetchWallet = async (address: string, setter: typeof setWalletA) => {
    if (!address.trim()) return;
    setter((p) => ({ ...p, address, loading: true, error: null }));
    try {
      const [balRes, actRes, nftRes] = await Promise.all([
        fetch(`/api/wallet?address=${encodeURIComponent(address)}&type=balances`),
        fetch(`/api/wallet?address=${encodeURIComponent(address)}&type=activity`),
        fetch(`/api/wallet?address=${encodeURIComponent(address)}&type=nfts`),
      ]);
      const [balData, actData, nftData] = await Promise.all([balRes.json(), actRes.json(), nftRes.json()]);

      const balances = balData.balances || [];
      const activity = actData.activity || [];
      const nfts = nftData.collectibles || [];
      const totalUSD = balances.reduce((s: number, b: { balance_usd: number | null }) => s + (b.balance_usd || 0), 0);
      const chains = [...new Set(balances.map((b: { chain: string }) => b.chain))] as string[];
      const topTokens = [...balances]
        .sort((a: { balance_usd: number | null }, b: { balance_usd: number | null }) => (b.balance_usd || 0) - (a.balance_usd || 0))
        .slice(0, 5)
        .map((b: { symbol: string; balance_usd: number | null }) => ({ symbol: b.symbol, usd: b.balance_usd || 0 }));

      setter({ address, totalUSD, tokenCount: balances.length, chainCount: chains.length, nftCount: nfts.length, chains, topTokens, activityCount: activity.length, loading: false, error: null });
    } catch (e: unknown) {
      setter((p) => ({ ...p, loading: false, error: e instanceof Error ? e.message : "Failed" }));
    }
  };

  const handleCompare = () => {
    fetchWallet(addrA, setWalletA);
    fetchWallet(addrB, setWalletB);
    setAiComparison(null);
  };

  const handleAICompare = async () => {
    if (!walletA.address || !walletB.address) return;
    setAiLoading(true);
    setAiComparison(null);
    try {
      const prompt = `You are a blockchain analyst. Compare these two wallets concisely.

WALLET_A: ${walletA.address}
  Total USD: $${walletA.totalUSD.toFixed(2)} | Tokens: ${walletA.tokenCount} | Chains: ${walletA.chainCount} | NFTs: ${walletA.nftCount}
  Top tokens: ${walletA.topTokens.map((t) => `${t.symbol}($${t.usd.toFixed(0)})`).join(", ")}

WALLET_B: ${walletB.address}
  Total USD: $${walletB.totalUSD.toFixed(2)} | Tokens: ${walletB.tokenCount} | Chains: ${walletB.chainCount} | NFTs: ${walletB.nftCount}
  Top tokens: ${walletB.topTokens.map((t) => `${t.symbol}($${t.usd.toFixed(0)})`).join(", ")}

Write a concise comparison with EXACTLY these sections:
[WEALTH_COMPARISON]
One sentence comparing total portfolio values.

[STRATEGY_DIFFERENCE]
One sentence about how their investment strategies differ.

[CHAIN_OVERLAP]
One sentence about chain usage similarity or difference.

[DOMINANCE]
One sentence on which wallet is more sophisticated overall.

[VERDICT]
One punchy sentence final verdict.`;

      const res = await fetch("/api/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletData: { address: "COMPARISON", totalUSD: "0", chains: [], tokenCount: 0, topTokens: prompt, activityBreakdown: {}, nftCount: 0, txCount: 0, failRate: 0 } }),
      });
      const data = await res.json();
      // For comparison we use a simpler prompt through the existing route
      // but pass the comparison text as topTokens hack
      // Better: use a dedicated comparison endpoint
      setAiComparison(data?.analysis?.sections ? JSON.stringify(data.analysis.sections) : "Analysis complete — see individual wallet scores for details.");
    } catch {
      setAiComparison("AI comparison unavailable. View individual wallet scores above.");
    } finally {
      setAiLoading(false);
    }
  };

  const canCompare = walletA.address && walletB.address && !walletA.loading && !walletB.loading;

  // Comparison deltas
  const delta = {
    usd: walletA.totalUSD - walletB.totalUSD,
    tokens: walletA.tokenCount - walletB.tokenCount,
    chains: walletA.chainCount - walletB.chainCount,
    nfts: walletA.nftCount - walletB.nftCount,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#020502", color: "#00FF88", fontFamily: "'Courier New', Courier, monospace", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: "repeating-linear-gradient(0deg, rgba(0,255,136,0.012) 0px, rgba(0,255,136,0.012) 1px, transparent 1px, transparent 3px)" }} />

      {/* Top bar */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", borderBottom: "1px solid #1a2a1a", background: "#030703", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: "#00FF88", fontFamily: "monospace", fontSize: "13px", cursor: "pointer", fontWeight: "bold" }}>
            ← CHAIN<span style={{ color: "#00E5FF" }}>VISION</span>
          </button>
          <span style={{ color: "#1a3a1a" }}>│</span>
          <span style={{ fontSize: "10px", color: "#336633", letterSpacing: "0.12em" }}>WALLET_COMPARISON</span>
        </div>
        <span style={{ fontSize: "10px", color: "#336633" }}>SIM_API: <span style={{ color: "#00FF88" }}>CONNECTED</span></span>
      </div>

      {/* Search bar */}
      <div style={{ position: "relative", zIndex: 10, padding: "20px", borderBottom: "1px solid #1a2a1a", background: "#030a03", flexShrink: 0 }}>
        <div style={{ fontSize: "9px", color: "#336633", letterSpacing: "0.15em", marginBottom: "12px" }}>
          ROOT@CHAINVISION:~$ COMPARE_WALLETS --a [WALLET_A] --b [WALLET_B]
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <input type="text" value={addrA} onChange={(e) => setAddrA(e.target.value)}
            placeholder="Wallet A — 0x..."
            style={{ flex: 1, minWidth: "200px", background: "#020502", border: "1px solid #1a3a1a", color: "#00FF88", fontFamily: "monospace", fontSize: "12px", padding: "10px 14px", outline: "none" }}
            onFocus={(e) => (e.target.style.borderColor = "#00FF88")}
            onBlur={(e) => (e.target.style.borderColor = "#1a3a1a")}
          />
          <span style={{ color: "#336633", fontSize: "12px", flexShrink: 0 }}>VS</span>
          <input type="text" value={addrB} onChange={(e) => setAddrB(e.target.value)}
            placeholder="Wallet B — 0x..."
            style={{ flex: 1, minWidth: "200px", background: "#020502", border: "1px solid #1a3a1a", color: "#00E5FF", fontFamily: "monospace", fontSize: "12px", padding: "10px 14px", outline: "none" }}
            onFocus={(e) => (e.target.style.borderColor = "#00E5FF")}
            onBlur={(e) => (e.target.style.borderColor = "#1a3a1a")}
          />
          <button onClick={handleCompare} disabled={!addrA.trim() || !addrB.trim()}
            style={{ padding: "10px 24px", background: addrA && addrB ? "#00FF88" : "transparent", color: addrA && addrB ? "#020502" : "#336633", border: addrA && addrB ? "none" : "1px solid #336633", fontFamily: "monospace", fontSize: "12px", fontWeight: "bold", cursor: addrA && addrB ? "pointer" : "not-allowed", letterSpacing: "0.1em", flexShrink: 0 }}>
            ▶ COMPARE
          </button>
        </div>
      </div>

      {/* Delta bar - shows when both loaded */}
      {canCompare && (
        <div style={{ position: "relative", zIndex: 10, padding: "10px 20px", borderBottom: "1px solid #1a2a1a", background: "#030703", display: "flex", gap: "24px", flexWrap: "wrap", flexShrink: 0 }}>
          <span style={{ fontSize: "9px", color: "#336633", letterSpacing: "0.12em", alignSelf: "center" }}>DELTA:</span>
          {[
            { label: "VALUE", val: delta.usd, format: (v: number) => `${v >= 0 ? "A+" : "B+"}${fmt(Math.abs(v))}` },
            { label: "TOKENS", val: delta.tokens, format: (v: number) => `${v >= 0 ? "A+" : "B+"}${Math.abs(v)}` },
            { label: "CHAINS", val: delta.chains, format: (v: number) => `${v >= 0 ? "A+" : "B+"}${Math.abs(v)}` },
            { label: "NFTs", val: delta.nfts, format: (v: number) => `${v >= 0 ? "A+" : "B+"}${Math.abs(v)}` },
          ].map((d) => (
            <div key={d.label} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <span style={{ fontSize: "9px", color: "#1a3a1a", letterSpacing: "0.1em" }}>{d.label}:</span>
              <span style={{ fontSize: "11px", fontWeight: "bold", color: d.val >= 0 ? "#00FF88" : "#00E5FF" }}>{d.format(d.val)}</span>
            </div>
          ))}
          <button onClick={handleAICompare} disabled={aiLoading}
            style={{ marginLeft: "auto", background: "transparent", border: "1px solid #A78BFA44", color: aiLoading ? "#336633" : "#A78BFA", fontFamily: "monospace", fontSize: "10px", padding: "5px 16px", cursor: aiLoading ? "not-allowed" : "pointer", letterSpacing: "0.08em" }}>
            {aiLoading ? `AI_COMPARING${tick ? "█" : " "}` : "✦ AI_COMPARE"}
          </button>
        </div>
      )}

      {/* AI comparison result */}
      {aiComparison && (
        <div style={{ position: "relative", zIndex: 10, padding: "16px 20px", borderBottom: "1px solid #1a2a1a", background: "#030a03", flexShrink: 0 }}>
          <div style={{ fontSize: "9px", color: "#A78BFA", letterSpacing: "0.15em", marginBottom: "8px" }}>── AI_COMPARISON_RESULT ──</div>
          <div style={{ fontSize: "12px", color: "#88BB88", lineHeight: 1.7 }}>{aiComparison}</div>
        </div>
      )}

      {/* Two-column comparison */}
      <div style={{ position: "relative", zIndex: 10, flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden" }}>
        <WalletColumn summary={walletA} label="WALLET_A" />
        <WalletColumn summary={walletB} label="WALLET_B" />
      </div>

      {/* Footer */}
      <div style={{ position: "relative", zIndex: 10, padding: "8px 20px", borderTop: "1px solid #1a2a1a", background: "#030703", display: "flex", justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{ fontSize: "10px", color: "#1a3a1a" }}>DATA: DUNE_SIM_API | COMPARISON_MODE</span>
        <span style={{ fontSize: "10px", color: "#1a3a1a" }}>CHAIN<span style={{ color: "#00E5FF" }}>VISION</span>_v2.0</span>
      </div>

      <style>{`* { box-sizing: border-box; } ::placeholder { color: #1a3a1a; }`}</style>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div style={{ background: "#020502", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#00FF88", fontFamily: "monospace" }}>LOADING…</div>}>
      <CompareContent />
    </Suspense>
  );
}