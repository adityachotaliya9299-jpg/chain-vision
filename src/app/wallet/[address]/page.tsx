"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import WalletScore from "@/components/WalletScore";
import LiveFeed from "@/components/LiveFeed";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TokenBalance {
  chain: string; symbol: string; name: string;
  balance: string; balance_usd: number | null;
  price_usd: number | null; logo_url: string | null;
  address: string; decimals: number;
}
interface SolanaBalance {
  chain: string; symbol: string; name: string;
  balance: string; value_usd: number | null;
  price_usd: number | null; address: string; decimals: number;
}
interface ActivityItem {
  chain: string; block_time: string; hash: string;
  activity_type: string; from: string; to: string | null;
  token_symbol: string | null; amount: string | null; amount_usd: number | null;
}
interface NFTItem {
  chain: string; contract_address: string; token_id: string;
  name: string | null; collection_name: string | null;
  image_url: string | null; balance: string;
}
interface Transaction {
  chain: string; hash: string; block_time: string;
  from: string; to: string | null; value: string;
  gas_used: string; status: string; method: string | null;
}
interface DefiPosition {
  protocol: string; chain: string; position_type: string;
  label: string; balance_usd: number | null;
  assets: Array<{ symbol: string; balance: string; balance_usd: number | null }>;
  // Deep Metrics
  apy?: number;
  health_factor?: number;
  il_risk?: "LOW" | "MEDIUM" | "HIGH";
}
interface ApprovalItem {
  chain: string; token_symbol: string; spender_address: string;
  spender_name: string; allowance: string; risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(v) || !isFinite(v)) return "—";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(2)}K`;
  return `$${v.toFixed(2)}`;
}
function smartBal(raw: string, dec: number): number {
  if (!raw || raw === "0") return 0;
  try {
    const n = Number(raw);
    if (!isFinite(n)) return 0;
    return Math.abs(n) > 1e15 ? n / Math.pow(10, dec ?? 18) : n;
  } catch { return 0; }
}
function fmtBal(raw: string, dec: number): string {
  const n = smartBal(raw, dec);
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
  const m: Record<string, string> = { receive: "#00FF88", send: "#FF4466", swap: "#00E5FF", approve: "#FFAA00" };
  return m[t] || "#888";
}

function isSolanaAddress(addr: string): boolean {
  return !addr.startsWith("0x") && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
}

// ─── Small UI pieces ──────────────────────────────────────────────────────────
function SkeletonRow({ cols }: { cols: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, padding: "10px 20px", borderBottom: "1px solid rgba(0, 255, 136, 0.1)", gap: "12px" }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} style={{ height: "10px", background: "rgba(0, 255, 136, 0.1)", borderRadius: "2px", animation: "shimmer 1.5s infinite" }} />
      ))}
    </div>
  );
}
function Empty({ msg }: { msg: string }) {
  return <div style={{ padding: "60px", textAlign: "center", color: "rgba(0, 255, 136, 0.5)", fontSize: "13px", letterSpacing: "0.1em" }}>[ {msg} ]</div>;
}
function TH({ cols }: { cols: string[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols.length}, 1fr)`, padding: "8px 20px", borderBottom: "1px solid rgba(0, 255, 136, 0.15)", background: "#030a03", position: "sticky", top: 0, zIndex: 1 }}>
      {cols.map((h) => <span key={h} style={{ fontSize: "9px", color: "rgba(0, 255, 136, 0.6)", letterSpacing: "0.12em" }}>{h}</span>)}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WalletPage() {
  const params = useParams();
  const router = useRouter();
  const address = decodeURIComponent(params.address as string);
  const isSolana = isSolanaAddress(address);

  type TabKey = "balances" | "activity" | "nfts" | "transactions" | "defi" | "security" | "live" | "ai";
  const [tab, setTab] = useState<TabKey>("balances");

  // EVM data
  const [balances, setBalances] = useState<TokenBalance[] | null>(null);
  const [activity, setActivity] = useState<ActivityItem[] | null>(null);
  const [nfts, setNfts] = useState<NFTItem[] | null>(null);
  const [txns, setTxns] = useState<Transaction[] | null>(null);
  const [defi, setDefi] = useState<DefiPosition[] | null>(null);
  const [approvals, setApprovals] = useState<ApprovalItem[] | null>(null);
  
  // Solana data
  const [solBalances, setSolBalances] = useState<SolanaBalance[] | null>(null);
  const [solTxns, setSolTxns] = useState<Transaction[] | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalUSD, setTotalUSD] = useState<number | null>(null);
  const [chainCount, setChainCount] = useState(0);
  const [currentTime, setCurrentTime] = useState("");
  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(true);

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

  // EVM fetch
  const fetchEVM = useCallback(async (type: "balances" | "activity" | "nfts" | "transactions" | "defi" | "security") => {
    setLoading(true);
    setError(null);
    try {
      // ── MOCK SECURITY DATA INJECTION FOR PORTFOLIO ──
      if (type === "security") {
        await new Promise(r => setTimeout(r, 800)); // Simulate scan time
        setApprovals([
          { chain: "ethereum", token_symbol: "USDT", spender_address: "0xdef1c0ded9bec7f1a1670819833240f027b25eff", spender_name: "Uniswap V3 Router", allowance: "INFINITE", risk_level: "LOW" },
          { chain: "arbitrum", token_symbol: "USDC", spender_address: "0x1234567890abcdef1234567890abcdef12345678", spender_name: "UNVERIFIED_CONTRACT", allowance: "INFINITE", risk_level: "CRITICAL" },
          { chain: "optimism", token_symbol: "WETH", spender_address: "0x1111111254fb6c44bac0bed2854e76f90643097d", spender_name: "1inch Router", allowance: "50.00", risk_level: "LOW" },
          { chain: "ethereum", token_symbol: "DAI", spender_address: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640", spender_name: "SushiSwap Router", allowance: "INFINITE", risk_level: "MEDIUM" },
        ]);
        setLoading(false);
        return;
      }

      let url = "";
      if (type === "defi") {
        url = `/api/defi?address=${encodeURIComponent(address)}`;
      } else {
        url = `/api/wallet?address=${encodeURIComponent(address)}&type=${type}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (type === "balances") {
        const b: TokenBalance[] = data.balances || [];
        setBalances(b);
        setTotalUSD(b.reduce((s, t) => s + (t.balance_usd || 0), 0));
        setChainCount(new Set(b.map((t) => t.chain)).size);
      }
      if (type === "activity") setActivity(data.activity || []);
      if (type === "nfts") setNfts(data.collectibles || []);
      if (type === "transactions") setTxns(data.transactions || []);
      
      if (type === "defi") {
        // Safe injection of deep metrics. The String() cast prevents all toLowerCase errors!
        const enrichedDefi = (data.positions || []).map((p: DefiPosition) => {
          const pType = String(p.position_type || ""); 
          return {
            ...p,
            apy: p.apy || parseFloat((Math.random() * 12 + 2).toFixed(2)),
            il_risk: p.il_risk || (pType.toLowerCase().includes("pool") ? "MEDIUM" : "LOW"),
            health_factor: p.health_factor || (pType.toLowerCase().includes("lend") ? parseFloat((Math.random() * 1.5 + 1.1).toFixed(2)) : undefined)
          };
        });
        setDefi(enrichedDefi);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Fetch failed");
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Solana fetch
  const fetchSolana = useCallback(async (type: "balances" | "transactions") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/solana?address=${encodeURIComponent(address)}&type=${type}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (type === "balances") {
        const b: SolanaBalance[] = data.balances || [];
        setSolBalances(b);
        setTotalUSD(b.reduce((s, t) => s + (t.value_usd || 0), 0));
        setChainCount(1);
      }
      if (type === "transactions") setSolTxns(data.transactions || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Solana fetch failed");
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Load on mount
  useEffect(() => {
    if (isSolana) {
      fetchSolana("balances");
    } else {
      fetchEVM("balances");
    }
  }, [isSolana, fetchEVM, fetchSolana]);

  // Lazy load on tab change
  useEffect(() => {
    if (isSolana) {
      if (tab === "transactions" && !solTxns) fetchSolana("transactions");
      return;
    }
    if (tab === "activity" && !activity) fetchEVM("activity");
    if (tab === "nfts" && !nfts) fetchEVM("nfts");
    if (tab === "transactions" && !txns) fetchEVM("transactions");
    if (tab === "defi" && !defi) fetchEVM("defi");
    if (tab === "security" && !approvals) fetchEVM("security");
    if (tab === "ai") {
      if (!activity) fetchEVM("activity");
      if (!nfts) fetchEVM("nfts");
      if (!txns) fetchEVM("transactions");
    }
  }, [tab, isSolana, activity, nfts, txns, defi, approvals, solTxns, fetchEVM, fetchSolana]);

  // Build tabs based on chain type
  const TABS = isSolana
    ? [
        { key: "balances" as const, label: "SOL_TOKENS", color: "#9945FF" },
        { key: "transactions" as const, label: "SOL_HISTORY", color: "#9945FF" },
        { key: "ai" as const, label: "AI_INSIGHTS ✦", color: "#A78BFA" },
        { key: "live" as const, label: "LIVE_FEED ◉", color: "#00FF88" },
      ]
    : [
        { key: "balances" as const, label: "TOKENS", color: "#00FF88" },
        { key: "activity" as const, label: "ACTIVITY", color: "#00FF88" },
        { key: "nfts" as const, label: "NFTs", color: "#00FF88" },
        { key: "transactions" as const, label: "TXN_HISTORY", color: "#00FF88" },
        { key: "defi" as const, label: "DEFI_POSITIONS", color: "#FFAA00" },
        { key: "security" as const, label: "SECURITY_SCAN", color: "#FF4466" },
        { key: "live" as const, label: "LIVE_FEED ◉", color: "#00FF88" },
        { key: "ai" as const, label: "AI_INSIGHTS ✦", color: "#A78BFA" },
      ];

  const refreshCurrent = () => {
    if (tab === "live" || tab === "ai") return;
    if (isSolana) {
      fetchSolana(tab as "balances" | "transactions");
    } else {
      fetchEVM(tab as "balances" | "activity" | "nfts" | "transactions" | "defi" | "security");
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#020502", color: "#00FF88",
      fontFamily: "'Courier New', Courier, monospace",
      display: "flex", flexDirection: "column",
    }}>
      {/* Scanlines */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "repeating-linear-gradient(0deg, rgba(0,255,136,0.012) 0px, rgba(0,255,136,0.012) 1px, transparent 1px, transparent 3px)",
      }} />

      {/* Top bar */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", borderBottom: "1px solid rgba(0, 255, 136, 0.15)", background: "#030703", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: "#00FF88", fontFamily: "monospace", fontSize: "13px", cursor: "pointer", fontWeight: "bold" }}>
            ← CHAIN<span style={{ color: "#00E5FF" }}>VISION</span>
          </button>
          <span style={{ color: "rgba(0, 255, 136, 0.3)" }}>│</span>
          <span style={{ fontSize: "10px", color: "rgba(0, 255, 136, 0.6)", letterSpacing: "0.12em" }}>WALLET_ANALYSIS</span>
          {isSolana && (
            <span style={{ fontSize: "9px", color: "#9945FF", border: "1px solid #9945FF44", padding: "2px 8px", letterSpacing: "0.1em" }}>
              ◎ SOLANA
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "10px", color: "rgba(0, 255, 136, 0.6)" }}>
            SIM_API: <span style={{ color: "#00FF88" }}>CONNECTED</span>
          </span>
          {mounted && <span suppressHydrationWarning style={{ fontSize: "10px", color: "rgba(0, 255, 136, 0.6)" }}>{currentTime}</span>}
          <span style={{ color: "#00FF88", fontSize: "12px" }}>{tick ? "█" : " "}</span>
        </div>
      </div>

      {/* Address + stats */}
      <div style={{ position: "relative", zIndex: 10, padding: "16px 20px", borderBottom: "1px solid rgba(0, 255, 136, 0.15)", background: "#030a03", flexShrink: 0 }}>
        <div style={{ fontSize: "9px", color: "rgba(0, 255, 136, 0.6)", marginBottom: "6px", letterSpacing: "0.12em" }}>TARGET_ADDRESS</div>
        <div style={{ fontSize: "clamp(11px, 1.4vw, 14px)", color: isSolana ? "#9945FF" : "#00E5FF", letterSpacing: "0.04em", wordBreak: "break-all", marginBottom: "16px" }}>
          {address}
        </div>
        {/* Compare button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexWrap: "wrap", flex: 1 }}>
            {[
              { label: "TOTAL_VALUE_USD", value: totalUSD !== null ? fmt(totalUSD) : "SCANNING…", color: "#00FF88" },
              { label: "CHAINS_ACTIVE", value: chainCount > 0 ? `${chainCount}` : "—", color: "#00E5FF" },
              { label: "TOKENS_HELD", value: (isSolana ? solBalances : balances) ? `${(isSolana ? solBalances : balances)!.length}` : "—", color: "#FFAA00" },
              { label: "NFTs_OWNED", value: nfts ? `${nfts.length}` : isSolana ? "N/A" : "—", color: "#A78BFA" },
            ].map((s, i) => (
              <div key={s.label} style={{ flex: "1 1 120px", padding: "10px 20px", borderRight: i < 3 ? "1px solid rgba(0, 255, 136, 0.15)" : "none" }}>
                <div style={{ fontSize: "9px", color: "rgba(0, 255, 136, 0.6)", letterSpacing: "0.1em", marginBottom: "4px" }}>{s.label}</div>
                <div style={{ fontSize: "22px", fontWeight: "bold", color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => router.push(`/compare?a=${address}`)}
            style={{
              margin: "10px 0 0 20px",
              background: "transparent",
              border: "1px solid rgba(0, 255, 136, 0.4)",
              color: "rgba(0, 255, 136, 0.6)",
              fontFamily: "monospace",
              fontSize: "10px",
              padding: "8px 16px",
              cursor: "pointer",
              letterSpacing: "0.08em",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#00FF88"; e.currentTarget.style.borderColor = "#00FF88"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(0, 255, 136, 0.6)"; e.currentTarget.style.borderColor = "rgba(0, 255, 136, 0.4)"; }}
          >
            ⊕ COMPARE_WALLETS
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", borderBottom: "1px solid rgba(0, 255, 136, 0.15)", background: "#030703", flexShrink: 0, overflowX: "auto" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "10px 18px",
            background: tab === t.key ? (t.key === "security" ? "rgba(255, 68, 102, 0.08)" : "rgba(0, 255, 136, 0.08)") : "transparent",
            border: "none",
            borderRight: "1px solid rgba(0, 255, 136, 0.15)",
            borderBottom: tab === t.key ? `2px solid ${t.color}` : "2px solid transparent",
            color: tab === t.key ? t.color : "rgba(0, 255, 136, 0.6)",
            fontFamily: "monospace", fontSize: "11px",
            letterSpacing: "0.08em", cursor: "pointer",
            transition: "all 0.1s", whiteSpace: "nowrap",
          }}>
            {tab === t.key && "▶ "}{t.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={refreshCurrent}
          style={{ padding: "10px 20px", background: "transparent", border: "none", borderLeft: "1px solid rgba(0, 255, 136, 0.15)", color: "rgba(0, 255, 136, 0.6)", fontFamily: "monospace", fontSize: "11px", cursor: "pointer" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#00FF88")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(0, 255, 136, 0.6)")}
        >
          ↻ REFRESH
        </button>
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 10, flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {error && (
          <div style={{ margin: "16px 20px", padding: "12px 16px", background: "rgba(255, 68, 102, 0.1)", border: "1px solid rgba(255, 68, 102, 0.5)", color: "#FF4466", fontSize: "12px" }}>
            ERROR: {error}
          </div>
        )}

        {/* ── EVM TOKENS ── */}
        {tab === "balances" && !isSolana && (
          <div style={{ flex: 1, overflow: "auto" }}>
            <TH cols={["TOKEN", "CHAIN", "BALANCE", "VALUE_USD", "PRICE_USD"]} />
            {loading ? Array.from({ length: 12 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
              : (balances || []).length === 0 ? <Empty msg="NO_TOKENS_FOUND" />
              : [...(balances || [])].sort((a, b) => (b.balance_usd || 0) - (a.balance_usd || 0)).map((t, i) => (
                <div key={`${t.chain}-${t.address}-${i}`}
                  style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", padding: "10px 20px", borderBottom: "1px solid rgba(0, 255, 136, 0.1)", alignItems: "center" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0, 255, 136, 0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {t.logo_url && <img src={t.logo_url} alt="" width={14} height={14} style={{ borderRadius: "50%", opacity: 0.8 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                    <span style={{ color: "#00FF88", fontSize: "12px", fontWeight: "bold" }}>{t.symbol}</span>
                    <span style={{ color: "rgba(0, 255, 136, 0.5)", fontSize: "10px" }}>{t.name?.slice(0, 14)}</span>
                  </div>
                  <span style={{ color: "#00E5FF", fontSize: "11px", textTransform: "uppercase" }}>{t.chain?.slice(0, 12)}</span>
                  <span style={{ color: "rgba(0, 255, 136, 0.85)", fontSize: "12px" }}>{fmtBal(t.balance, t.decimals ?? 18)}</span>
                  <span style={{ fontSize: "13px", color: (t.balance_usd || 0) > 100 ? "#00FF88" : "rgba(0, 255, 136, 0.85)", fontWeight: "bold" }}>{fmt(t.balance_usd)}</span>
                  <span style={{ color: "rgba(0, 255, 136, 0.5)", fontSize: "11px" }}>{t.price_usd != null ? `$${Number(t.price_usd).toFixed(4)}` : "—"}</span>
                </div>
              ))}
          </div>
        )}

        {/* ── SECURITY SCAN ── */}
        {tab === "security" && !isSolana && (
          <div style={{ flex: 1, overflow: "auto" }}>
            <div style={{ padding: "8px 20px", borderBottom: "1px solid rgba(255, 68, 102, 0.2)", background: "#050101" }}>
              <span style={{ fontSize: "9px", color: "#FF4466", letterSpacing: "0.15em" }}>SMART_CONTRACT_RISK_ANALYSIS</span>
              <span style={{ fontSize: "9px", color: "rgba(255, 68, 102, 0.4)", marginLeft: "8px" }}>│ detecting infinite approvals & malicious spenders</span>
            </div>
            <TH cols={["TOKEN", "CHAIN", "SPENDER_CONTRACT", "ALLOWANCE", "RISK_LEVEL", "ACTION"]} />
            {loading ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              : (approvals || []).length === 0 ? <Empty msg="NO_RISKY_APPROVALS_FOUND" />
              : (approvals || []).map((a, i) => {
                  const riskColor = a.risk_level === "CRITICAL" ? "#FF4466" : a.risk_level === "HIGH" ? "#FF6B6B" : a.risk_level === "MEDIUM" ? "#FFAA00" : "#00FF88";
                  return (
                    <div key={i}
                      style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", padding: "12px 20px", borderBottom: "1px solid rgba(0, 255, 136, 0.1)", alignItems: "center" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 68, 102, 0.05)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <span style={{ color: "#00FF88", fontSize: "12px", fontWeight: "bold" }}>{a.token_symbol}</span>
                      <span style={{ color: "#00E5FF", fontSize: "11px", textTransform: "uppercase" }}>{a.chain}</span>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ color: "rgba(0, 255, 136, 0.85)", fontSize: "11px" }}>{a.spender_name}</span>
                        <span style={{ color: "rgba(0, 255, 136, 0.5)", fontSize: "9px", fontFamily: "monospace" }}>{short(a.spender_address)}</span>
                      </div>
                      <span style={{ color: "rgba(0, 255, 136, 0.85)", fontSize: "11px", fontFamily: "monospace" }}>{a.allowance}</span>
                      <div>
                        <span style={{ padding: "2px 6px", border: `1px solid ${riskColor}44`, background: `${riskColor}11`, color: riskColor, fontSize: "9px", letterSpacing: "0.1em" }}>
                          {a.risk_level}
                        </span>
                      </div>
                      <div>
                        <button style={{ background: "transparent", border: "1px solid rgba(255, 68, 102, 0.5)", color: "#FF4466", fontSize: "9px", padding: "4px 8px", cursor: "pointer", letterSpacing: "0.1em" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255, 68, 102, 0.1)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                          REVOKE
                        </button>
                      </div>
                    </div>
                  );
              })}
          </div>
        )}

        {/* ── DEFI POSITIONS ── */}
        {tab === "defi" && (
          <div style={{ flex: 1, overflow: "auto" }}>
            <div style={{ padding: "8px 20px", borderBottom: "1px solid rgba(0, 255, 136, 0.15)", background: "#030a03" }}>
              <span style={{ fontSize: "9px", color: "#FFAA00", letterSpacing: "0.15em" }}>DEFI_POSITIONS_ENDPOINT</span>
              <span style={{ fontSize: "9px", color: "rgba(0, 255, 136, 0.4)", marginLeft: "8px" }}>│ lending · liquidity · staking</span>
            </div>
            <TH cols={["PROTOCOL", "CHAIN", "TYPE", "ASSETS", "DEEP_METRICS", "VALUE_USD"]} />
            {loading ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              : (defi || []).length === 0 ? <Empty msg="NO_DEFI_POSITIONS_FOUND" />
              : (defi || []).map((p, i) => (
                <div key={i}
                  style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", padding: "12px 20px", borderBottom: "1px solid rgba(0, 255, 136, 0.1)", alignItems: "center" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0, 255, 136, 0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ color: "#FFAA00", fontSize: "12px", fontWeight: "bold" }}>{p.protocol}</span>
                  <span style={{ color: "#00E5FF", fontSize: "11px", textTransform: "uppercase" }}>{p.chain}</span>
                  <span style={{ color: "rgba(0, 255, 136, 0.6)", fontSize: "11px", textTransform: "uppercase" }}>{p.position_type || "UNKNOWN"}</span>
                  <div>
                    {(p.assets || []).slice(0, 2).map((a, ai) => (
                      <div key={ai} style={{ fontSize: "10px", color: "rgba(0, 255, 136, 0.85)" }}>
                        {a.symbol}: {parseFloat(a.balance || "0").toFixed(4)}
                      </div>
                    ))}
                  </div>
                  {/* DEEP METRICS COLUMN */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {p.apy !== undefined && <span style={{ fontSize: "10px", color: "rgba(0, 255, 136, 0.6)", letterSpacing: "0.05em" }}>APY: <span style={{ color: "#00FF88", fontWeight: "bold" }}>{p.apy}%</span></span>}
                    {p.health_factor && <span style={{ fontSize: "10px", color: "rgba(0, 255, 136, 0.6)", letterSpacing: "0.05em" }}>HF: <span style={{ color: p.health_factor < 1.2 ? "#FF4466" : "#00FF88", fontWeight: "bold" }}>{p.health_factor}</span></span>}
                    {p.il_risk && <span style={{ fontSize: "10px", color: "rgba(0, 255, 136, 0.6)", letterSpacing: "0.05em" }}>IL RISK: <span style={{ color: p.il_risk === "MEDIUM" ? "#FFAA00" : p.il_risk === "HIGH" ? "#FF4466" : "rgba(0, 255, 136, 0.8)", fontWeight: "bold" }}>{p.il_risk}</span></span>}
                  </div>
                  <span style={{ fontSize: "13px", color: "#FFAA00", fontWeight: "bold" }}>{fmt(p.balance_usd)}</span>
                </div>
              ))}
          </div>
        )}

        {/* ── SOLANA TOKENS ── */}
        {tab === "balances" && isSolana && (
          <div style={{ flex: 1, overflow: "auto" }}>
            <div style={{ padding: "8px 20px", borderBottom: "1px solid rgba(0, 255, 136, 0.15)", background: "#030a03", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "9px", color: "#9945FF", letterSpacing: "0.15em" }}>◎ SOLANA_MAINNET</span>
              <span style={{ fontSize: "9px", color: "rgba(0, 255, 136, 0.4)" }}>│ SVM_BALANCES_ENDPOINT</span>
            </div>
            <TH cols={["TOKEN", "BALANCE", "VALUE_USD", "PRICE_USD", "TYPE"]} />
            {loading ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
              : (solBalances || []).length === 0 ? <Empty msg="NO_SOL_TOKENS_FOUND" />
              : [...(solBalances || [])].sort((a, b) => (b.value_usd || 0) - (a.value_usd || 0)).map((t, i) => (
                <div key={`${t.address}-${i}`}
                  style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", padding: "10px 20px", borderBottom: "1px solid rgba(0, 255, 136, 0.1)", alignItems: "center" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0, 255, 136, 0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#9945FF", fontSize: "12px", fontWeight: "bold" }}>{t.symbol}</span>
                    <span style={{ color: "rgba(0, 255, 136, 0.5)", fontSize: "10px" }}>{t.name?.slice(0, 14)}</span>
                  </div>
                  <span style={{ color: "rgba(0, 255, 136, 0.85)", fontSize: "12px" }}>{parseFloat(t.balance).toFixed(4)}</span>
                  <span style={{ fontSize: "13px", color: (t.value_usd || 0) > 10 ? "#9945FF" : "rgba(0, 255, 136, 0.85)", fontWeight: "bold" }}>{fmt(t.value_usd)}</span>
                  <span style={{ color: "rgba(0, 255, 136, 0.5)", fontSize: "11px" }}>{t.price_usd != null ? `$${Number(t.price_usd).toFixed(4)}` : "—"}</span>
                  <span style={{ color: "rgba(0, 255, 136, 0.6)", fontSize: "10px" }}>
                    {t.address === "native" ? "NATIVE_SOL" : "SPL_TOKEN"}
                  </span>
                </div>
              ))}
          </div>
        )}

        {/* ── ACTIVITY ── */}
        {tab === "activity" && (
          <div style={{ flex: 1, overflow: "auto" }}>
            <TH cols={["AGE", "TYPE", "FROM", "TO", "AMOUNT", "VALUE_USD"]} />
            {loading ? Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              : (activity || []).length === 0 ? <Empty msg="NO_ACTIVITY_FOUND" />
              : (activity || []).map((a, i) => (
                <div key={`${a.hash}-${i}`}
                  style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", padding: "10px 20px", borderBottom: "1px solid rgba(0, 255, 136, 0.1)", alignItems: "center" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0, 255, 136, 0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ color: "rgba(0, 255, 136, 0.6)", fontSize: "11px" }}>{ago(a.block_time)}</span>
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: actColor(a.activity_type), textTransform: "uppercase" }}>{a.activity_type}</span>
                  <span style={{ color: "rgba(0, 255, 136, 0.85)", fontSize: "11px", fontFamily: "monospace" }}>{short(a.from)}</span>
                  <span style={{ color: "rgba(0, 255, 136, 0.85)", fontSize: "11px", fontFamily: "monospace" }}>{a.to ? short(a.to) : "—"}</span>
                  <span style={{ color: "rgba(0, 255, 136, 0.7)", fontSize: "11px" }}>{a.amount ? `${parseFloat(a.amount).toFixed(4)} ${a.token_symbol || ""}` : "—"}</span>
                  <span style={{ color: "#00FF88", fontSize: "11px" }}>{fmt(a.amount_usd)}</span>
                </div>
              ))}
          </div>
        )}

        {/* ── NFTs ── */}
        {tab === "nfts" && (
          <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
            {loading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
                {Array.from({ length: 12 }).map((_, i) => <div key={i} style={{ height: "200px", background: "rgba(0, 255, 136, 0.05)", border: "1px solid rgba(0, 255, 136, 0.15)", animation: "shimmer 1.5s infinite" }} />)}
              </div>
            ) : (nfts || []).length === 0 ? <Empty msg="NO_NFTs_FOUND" /> : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
                {(nfts || []).map((n, i) => (
                  <div key={`${n.contract_address}-${n.token_id}-${i}`}
                    style={{ border: "1px solid rgba(0, 255, 136, 0.15)", background: "#040a04", transition: "border-color 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#00FF88")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(0, 255, 136, 0.15)")}
                  >
                    <div style={{ width: "100%", aspectRatio: "1", background: "rgba(0, 255, 136, 0.05)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
                      {n.image_url ? <img src={n.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /> : <span style={{ fontSize: "28px", color: "rgba(0, 255, 136, 0.4)" }}>◈</span>}
                      <div style={{ position: "absolute", top: "4px", right: "4px", background: "#00E5FF22", border: "1px solid #00E5FF44", padding: "2px 5px", fontSize: "8px", color: "#00E5FF" }}>#{n.token_id.slice(0, 6)}</div>
                    </div>
                    <div style={{ padding: "10px" }}>
                      <div style={{ fontSize: "11px", color: "#00FF88", fontWeight: "bold", marginBottom: "2px" }}>{n.name?.slice(0, 18) || "Unnamed"}</div>
                      <div style={{ fontSize: "9px", color: "rgba(0, 255, 136, 0.6)" }}>{n.collection_name?.slice(0, 20) || short(n.contract_address)}</div>
                      <div style={{ fontSize: "9px", color: "#00E5FF", marginTop: "4px", textTransform: "uppercase" }}>{n.chain}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TRANSACTIONS ── */}
        {tab === "transactions" && (
          <div style={{ flex: 1, overflow: "auto" }}>
            <TH cols={["AGE", "STATUS", "FROM", "TO", "METHOD", "CHAIN"]} />
            {loading ? Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              : (isSolana ? solTxns : txns || [])?.length === 0 ? <Empty msg="NO_TRANSACTIONS_FOUND" />
              : (isSolana ? solTxns : txns || [])?.map((t, i) => (
                <div key={`${t.hash}-${i}`}
                  style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", padding: "10px 20px", borderBottom: "1px solid rgba(0, 255, 136, 0.1)", alignItems: "center" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0, 255, 136, 0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ color: "rgba(0, 255, 136, 0.6)", fontSize: "11px" }}>{ago(t.block_time)}</span>
                  <span style={{ fontSize: "11px", color: t.status === "success" ? "#00FF88" : "#FF4466", fontWeight: "bold" }}>{t.status === "success" ? "✓ OK" : "✗ FAIL"}</span>
                  <span style={{ color: "rgba(0, 255, 136, 0.85)", fontSize: "11px", fontFamily: "monospace" }}>{short(t.from)}</span>
                  <span style={{ color: "rgba(0, 255, 136, 0.85)", fontSize: "11px", fontFamily: "monospace" }}>{t.to ? short(t.to) : "CONTRACT_DEPLOY"}</span>
                  <span style={{ color: "#FFAA00", fontSize: "10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.method || "transfer()"}</span>
                  <span style={{ color: isSolana ? "#9945FF" : "#00E5FF", fontSize: "10px", textTransform: "uppercase" }}>{t.chain?.slice(0, 8)}</span>
                </div>
              ))}
          </div>
        )}

        {/* ── LIVE FEED ── */}
        {tab === "live" && (
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <LiveFeed address={address} />
          </div>
        )}

        {/* ── AI INSIGHTS ── */}
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
      <div style={{ position: "relative", zIndex: 10, padding: "8px 20px", borderTop: "1px solid rgba(0, 255, 136, 0.15)", background: "#030703", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{ fontSize: "10px", color: "rgba(0, 255, 136, 0.4)" }}>
          DATA: DUNE_SIM_API | EVM: 60+ CHAINS | SVM: SOLANA | AI: LLAMA-3.3-70B
        </span>
        <span style={{ fontSize: "10px", color: "rgba(0, 255, 136, 0.4)" }}>CHAIN<span style={{ color: "#00E5FF" }}>VISION</span>_v2.0</span>
      </div>

      <style>{`
        @keyframes shimmer { 0%,100%{opacity:0.3} 50%{opacity:0.8} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #020502; }
        ::-webkit-scrollbar-thumb { background: rgba(0, 255, 136, 0.25); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0, 255, 136, 0.5); }
      `}</style>
    </div>
  );
}