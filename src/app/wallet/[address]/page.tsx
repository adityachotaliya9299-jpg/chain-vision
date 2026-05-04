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

// Solana address detection (base58, 32–44 chars, no 0x prefix)
function isSolanaAddress(addr: string): boolean {
  return !addr.startsWith("0x") && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr);
}

// ─── Small UI pieces ──────────────────────────────────────────────────────────
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
  return <div style={{ padding: "60px", textAlign: "center", color: "#1a3a1a", fontSize: "13px", letterSpacing: "0.1em" }}>[ {msg} ]</div>;
}
function TH({ cols }: { cols: string[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols.length}, 1fr)`, padding: "8px 20px", borderBottom: "1px solid #1a2a1a", background: "#030a03", position: "sticky", top: 0, zIndex: 1 }}>
      {cols.map((h) => <span key={h} style={{ fontSize: "9px", color: "#336633", letterSpacing: "0.12em" }}>{h}</span>)}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WalletPage() {
  const params = useParams();
  const router = useRouter();
  const address = decodeURIComponent(params.address as string);
  const isSolana = isSolanaAddress(address);

  type TabKey = "balances" | "activity" | "nfts" | "transactions" | "defi" | "live" | "ai";
  const [tab, setTab] = useState<TabKey>("balances");

  // EVM data
  const [balances, setBalances] = useState<TokenBalance[] | null>(null);
  const [activity, setActivity] = useState<ActivityItem[] | null>(null);
  const [nfts, setNfts] = useState<NFTItem[] | null>(null);
  const [txns, setTxns] = useState<Transaction[] | null>(null);
  const [defi, setDefi] = useState<DefiPosition[] | null>(null);
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
  const fetchEVM = useCallback(async (type: "balances" | "activity" | "nfts" | "transactions" | "defi") => {
    setLoading(true);
    setError(null);
    try {
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
      if (type === "defi") setDefi(data.positions || []);
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
    if (tab === "ai") {
      if (!activity) fetchEVM("activity");
      if (!nfts) fetchEVM("nfts");
      if (!txns) fetchEVM("transactions");
    }
  }, [tab, isSolana, activity, nfts, txns, defi, solTxns, fetchEVM, fetchSolana]);

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
        { key: "live" as const, label: "LIVE_FEED ◉", color: "#00FF88" },
        { key: "ai" as const, label: "AI_INSIGHTS ✦", color: "#A78BFA" },
      ];

  const refreshCurrent = () => {
    if (tab === "live" || tab === "ai") return;
    if (isSolana) {
      fetchSolana(tab as "balances" | "transactions");
    } else {
      fetchEVM(tab as "balances" | "activity" | "nfts" | "transactions" | "defi");
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
      <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", borderBottom: "1px solid #1a2a1a", background: "#030703", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: "#00FF88", fontFamily: "monospace", fontSize: "13px", cursor: "pointer", fontWeight: "bold" }}>
            ← CHAIN<span style={{ color: "#00E5FF" }}>VISION</span>
          </button>
          <span style={{ color: "#1a3a1a" }}>│</span>
          <span style={{ fontSize: "10px", color: "#336633", letterSpacing: "0.12em" }}>WALLET_ANALYSIS</span>
          {isSolana && (
            <span style={{ fontSize: "9px", color: "#9945FF", border: "1px solid #9945FF44", padding: "2px 8px", letterSpacing: "0.1em" }}>
              ◎ SOLANA
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "10px", color: "#336633" }}>
            SIM_API: <span style={{ color: "#00FF88" }}>CONNECTED</span>
          </span>
          {mounted && <span suppressHydrationWarning style={{ fontSize: "10px", color: "#336633" }}>{currentTime}</span>}
          <span style={{ color: "#00FF88", fontSize: "12px" }}>{tick ? "█" : " "}</span>
        </div>
      </div>

      {/* Address + stats */}
      <div style={{ position: "relative", zIndex: 10, padding: "16px 20px", borderBottom: "1px solid #1a2a1a", background: "#030a03", flexShrink: 0 }}>
        <div style={{ fontSize: "9px", color: "#336633", marginBottom: "6px", letterSpacing: "0.12em" }}>TARGET_ADDRESS</div>
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
              <div key={s.label} style={{ flex: "1 1 120px", padding: "10px 20px", borderRight: i < 3 ? "1px solid #1a2a1a" : "none" }}>
                <div style={{ fontSize: "9px", color: "#336633", letterSpacing: "0.1em", marginBottom: "4px" }}>{s.label}</div>
                <div style={{ fontSize: "22px", fontWeight: "bold", color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          {/* Compare wallet button */}
          <button
            onClick={() => router.push(`/compare?a=${address}`)}
            style={{
              margin: "10px 0 0 20px",
              background: "transparent",
              border: "1px solid #1a3a1a",
              color: "#336633",
              fontFamily: "monospace",
              fontSize: "10px",
              padding: "8px 16px",
              cursor: "pointer",
              letterSpacing: "0.08em",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#00FF88"; e.currentTarget.style.borderColor = "#00FF88"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#336633"; e.currentTarget.style.borderColor = "#1a3a1a"; }}
          >
            ⊕ COMPARE_WALLETS
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", borderBottom: "1px solid #1a2a1a", background: "#030703", flexShrink: 0, overflowX: "auto" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "10px 18px",
            background: tab === t.key ? "#0a1a0a" : "transparent",
            border: "none",
            borderRight: "1px solid #1a2a1a",
            borderBottom: tab === t.key ? `2px solid ${t.color}` : "2px solid transparent",
            color: tab === t.key ? t.color : "#336633",
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

        {/* ── EVM TOKENS ── */}
        {tab === "balances" && !isSolana && (
          <div style={{ flex: 1, overflow: "auto" }}>
            <TH cols={["TOKEN", "CHAIN", "BALANCE", "VALUE_USD", "PRICE_USD"]} />
            {loading ? Array.from({ length: 12 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
              : (balances || []).length === 0 ? <Empty msg="NO_TOKENS_FOUND" />
              : [...(balances || [])].sort((a, b) => (b.balance_usd || 0) - (a.balance_usd || 0)).map((t, i) => (
                <div key={`${t.chain}-${t.address}-${i}`}
                  style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", padding: "10px 20px", borderBottom: "1px solid #0a150a", alignItems: "center" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#0a150a")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {t.logo_url && <img src={t.logo_url} alt="" width={14} height={14} style={{ borderRadius: "50%", opacity: 0.8 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                    <span style={{ color: "#00FF88", fontSize: "12px", fontWeight: "bold" }}>{t.symbol}</span>
                    <span style={{ color: "#1a3a1a", fontSize: "10px" }}>{t.name?.slice(0, 14)}</span>
                  </div>
                  <span style={{ color: "#00E5FF", fontSize: "11px", textTransform: "uppercase" }}>{t.chain?.slice(0, 12)}</span>
                  <span style={{ color: "#88BB88", fontSize: "12px" }}>{fmtBal(t.balance, t.decimals ?? 18)}</span>
                  <span style={{ fontSize: "13px", color: (t.balance_usd || 0) > 100 ? "#00FF88" : "#88BB88", fontWeight: "bold" }}>{fmt(t.balance_usd)}</span>
                  <span style={{ color: "#555", fontSize: "11px" }}>{t.price_usd != null ? `$${Number(t.price_usd).toFixed(4)}` : "—"}</span>
                </div>
              ))}
          </div>
        )}

        {/* ── SOLANA TOKENS ── */}
        {tab === "balances" && isSolana && (
          <div style={{ flex: 1, overflow: "auto" }}>
            <div style={{ padding: "8px 20px", borderBottom: "1px solid #1a2a1a", background: "#030a03", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "9px", color: "#9945FF", letterSpacing: "0.15em" }}>◎ SOLANA_MAINNET</span>
              <span style={{ fontSize: "9px", color: "#1a3a1a" }}>│ SVM_BALANCES_ENDPOINT</span>
            </div>
            <TH cols={["TOKEN", "BALANCE", "VALUE_USD", "PRICE_USD", "TYPE"]} />
            {loading ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
              : (solBalances || []).length === 0 ? <Empty msg="NO_SOL_TOKENS_FOUND" />
              : [...(solBalances || [])].sort((a, b) => (b.value_usd || 0) - (a.value_usd || 0)).map((t, i) => (
                <div key={`${t.address}-${i}`}
                  style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", padding: "10px 20px", borderBottom: "1px solid #0a150a", alignItems: "center" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#0a150a")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#9945FF", fontSize: "12px", fontWeight: "bold" }}>{t.symbol}</span>
                    <span style={{ color: "#1a3a1a", fontSize: "10px" }}>{t.name?.slice(0, 14)}</span>
                  </div>
                  <span style={{ color: "#88BB88", fontSize: "12px" }}>{parseFloat(t.balance).toFixed(4)}</span>
                  <span style={{ fontSize: "13px", color: (t.value_usd || 0) > 10 ? "#9945FF" : "#88BB88", fontWeight: "bold" }}>{fmt(t.value_usd)}</span>
                  <span style={{ color: "#555", fontSize: "11px" }}>{t.price_usd != null ? `$${Number(t.price_usd).toFixed(4)}` : "—"}</span>
                  <span style={{ color: "#336633", fontSize: "10px" }}>
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

        {/* ── NFTs ── */}
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
                      <div style={{ position: "absolute", top: "4px", right: "4px", background: "#00E5FF22", border: "1px solid #00E5FF44", padding: "2px 5px", fontSize: "8px", color: "#00E5FF" }}>#{n.token_id.slice(0, 6)}</div>
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

        {/* ── TRANSACTIONS ── */}
        {tab === "transactions" && (
          <div style={{ flex: 1, overflow: "auto" }}>
            <TH cols={["AGE", "STATUS", "FROM", "TO", "METHOD", "CHAIN"]} />
            {loading ? Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              : (isSolana ? solTxns : txns || [])?.length === 0 ? <Empty msg="NO_TRANSACTIONS_FOUND" />
              : (isSolana ? solTxns : txns || [])?.map((t, i) => (
                <div key={`${t.hash}-${i}`}
                  style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", padding: "10px 20px", borderBottom: "1px solid #0a150a", alignItems: "center" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#0a150a")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ color: "#336633", fontSize: "11px" }}>{ago(t.block_time)}</span>
                  <span style={{ fontSize: "11px", color: t.status === "success" ? "#00FF88" : "#FF4466", fontWeight: "bold" }}>{t.status === "success" ? "✓ OK" : "✗ FAIL"}</span>
                  <span style={{ color: "#88BB88", fontSize: "11px", fontFamily: "monospace" }}>{short(t.from)}</span>
                  <span style={{ color: "#88BB88", fontSize: "11px", fontFamily: "monospace" }}>{t.to ? short(t.to) : "CONTRACT_DEPLOY"}</span>
                  <span style={{ color: "#FFAA00", fontSize: "10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.method || "transfer()"}</span>
                  <span style={{ color: isSolana ? "#9945FF" : "#00E5FF", fontSize: "10px", textTransform: "uppercase" }}>{t.chain?.slice(0, 8)}</span>
                </div>
              ))}
          </div>
        )}

        {/* ── DEFI POSITIONS ── */}
        {tab === "defi" && (
          <div style={{ flex: 1, overflow: "auto" }}>
            <div style={{ padding: "8px 20px", borderBottom: "1px solid #1a2a1a", background: "#030a03" }}>
              <span style={{ fontSize: "9px", color: "#FFAA00", letterSpacing: "0.15em" }}>DEFI_POSITIONS_ENDPOINT</span>
              <span style={{ fontSize: "9px", color: "#1a3a1a", marginLeft: "8px" }}>│ lending · liquidity · staking</span>
            </div>
            <TH cols={["PROTOCOL", "CHAIN", "TYPE", "ASSETS", "VALUE_USD"]} />
            {loading ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
              : (defi || []).length === 0 ? <Empty msg="NO_DEFI_POSITIONS_FOUND" />
              : (defi || []).map((p, i) => (
                <div key={i}
                  style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", padding: "12px 20px", borderBottom: "1px solid #0a150a", alignItems: "center" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#0a150a")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span style={{ color: "#FFAA00", fontSize: "12px", fontWeight: "bold" }}>{p.protocol}</span>
                  <span style={{ color: "#00E5FF", fontSize: "11px", textTransform: "uppercase" }}>{p.chain}</span>
                  <span style={{ color: "#336633", fontSize: "11px", textTransform: "uppercase" }}>{p.position_type}</span>
                  <div>
                    {(p.assets || []).slice(0, 2).map((a, ai) => (
                      <div key={ai} style={{ fontSize: "10px", color: "#88BB88" }}>
                        {a.symbol}: {parseFloat(a.balance || "0").toFixed(4)}
                      </div>
                    ))}
                  </div>
                  <span style={{ fontSize: "13px", color: "#FFAA00", fontWeight: "bold" }}>{fmt(p.balance_usd)}</span>
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
      <div style={{ position: "relative", zIndex: 10, padding: "8px 20px", borderTop: "1px solid #1a2a1a", background: "#030703", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{ fontSize: "10px", color: "#1a3a1a" }}>
          DATA: DUNE_SIM_API | EVM: 60+ CHAINS | SVM: SOLANA | AI: LLAMA-3.3-70B
        </span>
        <span style={{ fontSize: "10px", color: "#1a3a1a" }}>CHAIN<span style={{ color: "#00E5FF" }}>VISION</span>_v2.0</span>
      </div>

      <style>{`
        @keyframes shimmer { 0%,100%{opacity:0.3} 50%{opacity:0.8} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #020502; }
        ::-webkit-scrollbar-thumb { background: #1a3a1a; border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: #00FF8833; }
      `}</style>
    </div>
  );
}