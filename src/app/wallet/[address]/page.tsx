"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

// ─── Types (inline to keep this file self-contained) ─────────────────────────
interface TokenBalance {
  chain: string;
  symbol: string;
  name: string;
  balance: string;
  balance_usd: number | null;
  price_usd: number | null;
  logo_url: string | null;
  address: string;
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
function fmt(v: number | null) {
  if (v === null || v === undefined) return "—";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(2)}K`;
  return `$${v.toFixed(2)}`;
}
function short(a: string) {
  if (!a) return "—";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}
function ago(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
function actColor(t: string) {
  if (t === "receive") return "#00FF88";
  if (t === "send") return "#FF4466";
  if (t === "swap") return "#00E5FF";
  if (t === "approve") return "#FFAA00";
  return "#888";
}

// ─── Components ───────────────────────────────────────────────────────────────
function Panel({ title, children, flex = 1 }: { title: string; children: React.ReactNode; flex?: number }) {
  return (
    <div style={{
      flex,
      border: "1px solid #1a2a1a",
      display: "flex",
      flexDirection: "column",
      minWidth: 0,
      background: "#040804",
    }}>
      <div style={{
        padding: "8px 14px",
        borderBottom: "1px solid #1a2a1a",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        background: "#060d06",
      }}>
        <span style={{ color: "#00FF88", fontSize: "10px" }}>▶</span>
        <span style={{ fontSize: "11px", color: "#00FF88", fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase" }}>
          {title}
        </span>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "0" }}>
        {children}
      </div>
    </div>
  );
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <div style={{ display: "flex", gap: "0", padding: "10px 14px", borderBottom: "1px solid #0d1a0d" }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} style={{
          flex: 1,
          height: "10px",
          background: "linear-gradient(90deg, #0d1a0d, #1a2a1a, #0d1a0d)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s infinite",
          borderRadius: "2px",
          margin: "0 4px",
        }} />
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WalletPage() {
  const params = useParams();
  const router = useRouter();
  const address = decodeURIComponent(params.address as string);

  const [tab, setTab] = useState<"balances" | "activity" | "nfts" | "transactions">("balances");
  const [balances, setBalances] = useState<TokenBalance[] | null>(null);
  const [activity, setActivity] = useState<ActivityItem[] | null>(null);
  const [nfts, setNfts] = useState<NFTItem[] | null>(null);
  const [txns, setTxns] = useState<Transaction[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalUSD, setTotalUSD] = useState<number | null>(null);
  const [chainCount, setChainCount] = useState(0);
  const [tick, setTick] = useState(true);

  // Blinking cursor effect
  useEffect(() => {
    const t = setInterval(() => setTick((p) => !p), 600);
    return () => clearInterval(t);
  }, []);

  const fetchData = useCallback(async (type: typeof tab) => {
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
        const chains = new Set(b.map((t) => t.chain));
        setChainCount(chains.size);
      }
      if (type === "activity") setActivity(data.activity || []);
      if (type === "nfts") setNfts(data.collectibles || []);
      if (type === "transactions") setTxns(data.transactions || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchData(tab);
  }, [tab, fetchData]);

  // Also preload balances for the header stats
  useEffect(() => {
    if (tab !== "balances") fetchData("balances");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const TABS = [
    { key: "balances", label: "TOKENS" },
    { key: "activity", label: "ACTIVITY" },
    { key: "nfts", label: "NFTs" },
    { key: "transactions", label: "TXN_HISTORY" },
  ] as const;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#020502",
      color: "#00FF88",
      fontFamily: "'Courier New', Courier, monospace",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* Top bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 20px",
        borderBottom: "1px solid #1a2a1a",
        background: "#030703",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <button
            onClick={() => router.push("/")}
            style={{
              background: "none",
              border: "none",
              color: "#00FF88",
              fontFamily: "monospace",
              fontSize: "12px",
              cursor: "pointer",
              letterSpacing: "0.1em",
            }}
          >
            ← CHAIN<span style={{ color: "#00E5FF" }}>VISION</span>
          </button>
          <span style={{ color: "#1a3a1a", fontSize: "12px" }}>│</span>
          <span style={{ fontSize: "11px", color: "#336633" }}>WALLET_ANALYSIS</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "10px", color: "#336633" }}>
            SIM_API:{" "}
            <span style={{ color: "#00FF88" }}>CONNECTED</span>
          </span>
          <span style={{ fontSize: "10px", color: "#336633" }}>
            {new Date().toUTCString().slice(0, 25)}
          </span>
          <span style={{ color: "#00FF88", fontSize: "10px" }}>
            {tick ? "█" : " "}
          </span>
        </div>
      </div>

      {/* Address + stats header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid #1a2a1a",
        background: "#030a03",
        flexShrink: 0,
      }}>
        <div style={{ fontSize: "10px", color: "#336633", marginBottom: "6px", letterSpacing: "0.1em" }}>
          TARGET_ADDRESS
        </div>
        <div style={{
          fontSize: "clamp(13px, 1.5vw, 16px)",
          color: "#00E5FF",
          letterSpacing: "0.05em",
          wordBreak: "break-all",
          marginBottom: "16px",
        }}>
          {address}
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: "0", flexWrap: "wrap" }}>
          {[
            {
              label: "TOTAL_VALUE_USD",
              value: totalUSD !== null ? fmt(totalUSD) : "LOADING…",
              color: "#00FF88",
            },
            {
              label: "CHAINS_ACTIVE",
              value: chainCount > 0 ? `${chainCount}` : "—",
              color: "#00E5FF",
            },
            {
              label: "TOKENS_HELD",
              value: balances ? `${balances.length}` : "—",
              color: "#FFAA00",
            },
            {
              label: "NFTs_OWNED",
              value: nfts ? `${nfts.length}` : "—",
              color: "#A78BFA",
            },
          ].map((s, i) => (
            <div key={s.label} style={{
              flex: "1 1 120px",
              padding: "10px 20px",
              borderRight: "1px solid #1a2a1a",
              borderLeft: i === 0 ? "none" : undefined,
            }}>
              <div style={{ fontSize: "9px", color: "#336633", letterSpacing: "0.12em", marginBottom: "4px" }}>
                {s.label}
              </div>
              <div style={{ fontSize: "20px", fontWeight: "bold", color: s.color, letterSpacing: "-0.5px" }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid #1a2a1a",
        background: "#030703",
        flexShrink: 0,
      }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 24px",
              background: tab === t.key ? "#0a1a0a" : "transparent",
              border: "none",
              borderRight: "1px solid #1a2a1a",
              borderBottom: tab === t.key ? "2px solid #00FF88" : "2px solid transparent",
              color: tab === t.key ? "#00FF88" : "#336633",
              fontFamily: "monospace",
              fontSize: "11px",
              letterSpacing: "0.12em",
              cursor: "pointer",
              transition: "all 0.1s",
            }}
          >
            {tab === t.key && "▶ "}{t.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => fetchData(tab)}
          style={{
            padding: "10px 20px",
            background: "transparent",
            border: "none",
            borderLeft: "1px solid #1a2a1a",
            color: "#336633",
            fontFamily: "monospace",
            fontSize: "11px",
            cursor: "pointer",
            letterSpacing: "0.08em",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#00FF88")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#336633")}
        >
          ↻ REFRESH
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {error && (
          <div style={{
            margin: "16px 20px",
            padding: "12px 16px",
            background: "#1a0505",
            border: "1px solid #550000",
            color: "#FF4466",
            fontFamily: "monospace",
            fontSize: "12px",
          }}>
            ERROR: {error}
          </div>
        )}

        {/* ── BALANCES ──────────────────────────────────────────────── */}
        {tab === "balances" && (
          <div style={{ flex: 1, overflow: "auto" }}>
            {/* Table header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1.5fr 1.5fr 1fr",
              padding: "8px 20px",
              borderBottom: "1px solid #1a2a1a",
              background: "#030a03",
              position: "sticky",
              top: 0,
            }}>
              {["TOKEN", "CHAIN", "BALANCE", "VALUE_USD", "PRICE"].map((h) => (
                <span key={h} style={{ fontSize: "9px", color: "#336633", letterSpacing: "0.12em" }}>{h}</span>
              ))}
            </div>
            {loading
              ? Array.from({ length: 12 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
              : (balances || []).length === 0
              ? <Empty msg="NO_TOKENS_FOUND" />
              : (balances || [])
                  .sort((a, b) => (b.balance_usd || 0) - (a.balance_usd || 0))
                  .map((t, i) => (
                    <div
                      key={`${t.chain}-${t.address}-${i}`}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 1.5fr 1.5fr 1fr",
                        padding: "10px 20px",
                        borderBottom: "1px solid #0a150a",
                        transition: "background 0.1s",
                        cursor: "default",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#0a150a")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {t.logo_url && (
                          <img src={t.logo_url} alt="" width={16} height={16}
                            style={{ borderRadius: "50%", opacity: 0.85 }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        )}
                        <span style={{ color: "#00FF88", fontSize: "13px", fontWeight: "bold" }}>{t.symbol}</span>
                        <span style={{ color: "#336633", fontSize: "10px" }}>{t.name?.slice(0, 20)}</span>
                      </div>
                      <span style={{ color: "#00E5FF", fontSize: "11px", textTransform: "uppercase" }}>
                        {t.chain?.slice(0, 10)}
                      </span>
                      <span style={{ color: "#88BB88", fontSize: "12px", fontFamily: "monospace" }}>
                        {parseFloat(t.balance).toFixed(4)}
                      </span>
                      <span style={{
                        fontSize: "13px",
                        color: (t.balance_usd || 0) > 100 ? "#00FF88" : "#88BB88",
                        fontWeight: "bold",
                      }}>
                        {fmt(t.balance_usd)}
                      </span>
                      <span style={{ color: "#555", fontSize: "11px" }}>
                        {t.price_usd ? `$${t.price_usd.toFixed(4)}` : "—"}
                      </span>
                    </div>
                  ))}
          </div>
        )}

        {/* ── ACTIVITY ──────────────────────────────────────────────── */}
        {tab === "activity" && (
          <div style={{ flex: 1, overflow: "auto" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "80px 100px 1fr 1fr 1fr 100px",
              padding: "8px 20px",
              borderBottom: "1px solid #1a2a1a",
              background: "#030a03",
              position: "sticky",
              top: 0,
            }}>
              {["AGE", "TYPE", "FROM", "TO", "AMOUNT", "VALUE"].map((h) => (
                <span key={h} style={{ fontSize: "9px", color: "#336633", letterSpacing: "0.12em" }}>{h}</span>
              ))}
            </div>
            {loading
              ? Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              : (activity || []).length === 0
              ? <Empty msg="NO_ACTIVITY_FOUND" />
              : (activity || []).map((a, i) => (
                  <div
                    key={`${a.hash}-${i}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "80px 100px 1fr 1fr 1fr 100px",
                      padding: "10px 20px",
                      borderBottom: "1px solid #0a150a",
                      alignItems: "center",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#0a150a")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ color: "#336633", fontSize: "11px" }}>{ago(a.block_time)}</span>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: "bold",
                      color: actColor(a.activity_type),
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}>
                      {a.activity_type}
                    </span>
                    <span style={{ color: "#88BB88", fontSize: "11px", fontFamily: "monospace" }}>
                      {short(a.from)}
                    </span>
                    <span style={{ color: "#88BB88", fontSize: "11px", fontFamily: "monospace" }}>
                      {a.to ? short(a.to) : "—"}
                    </span>
                    <span style={{ color: "#AAAAAA", fontSize: "11px" }}>
                      {a.amount ? `${parseFloat(a.amount).toFixed(4)} ${a.token_symbol || ""}` : "—"}
                    </span>
                    <span style={{ color: "#00FF88", fontSize: "11px" }}>
                      {fmt(a.amount_usd)}
                    </span>
                  </div>
                ))}
          </div>
        )}

        {/* ── NFTs ──────────────────────────────────────────────────── */}
        {tab === "nfts" && (
          <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
            {loading ? (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: "12px",
              }}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} style={{
                    height: "200px",
                    background: "#0a150a",
                    border: "1px solid #1a2a1a",
                    borderRadius: "4px",
                    animation: "shimmer 1.5s infinite",
                  }} />
                ))}
              </div>
            ) : (nfts || []).length === 0 ? (
              <Empty msg="NO_NFTs_FOUND" />
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: "12px",
              }}>
                {(nfts || []).map((n, i) => (
                  <div
                    key={`${n.contract_address}-${n.token_id}-${i}`}
                    style={{
                      border: "1px solid #1a2a1a",
                      background: "#040a04",
                      transition: "border-color 0.15s",
                      cursor: "default",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#00FF88")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1a2a1a")}
                  >
                    <div style={{
                      width: "100%",
                      aspectRatio: "1",
                      background: "#0a150a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      position: "relative",
                    }}>
                      {n.image_url ? (
                        <img src={n.image_url} alt={n.name || "NFT"} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <span style={{ fontSize: "32px", color: "#1a3a1a" }}>◈</span>
                      )}
                      <div style={{
                        position: "absolute", top: "6px", right: "6px",
                        background: "#00E5FF22",
                        border: "1px solid #00E5FF44",
                        padding: "2px 6px",
                        fontSize: "9px",
                        color: "#00E5FF",
                        fontFamily: "monospace",
                      }}>
                        #{n.token_id.slice(0, 8)}
                      </div>
                    </div>
                    <div style={{ padding: "10px" }}>
                      <div style={{ fontSize: "11px", color: "#00FF88", fontWeight: "bold", marginBottom: "2px" }}>
                        {n.name?.slice(0, 20) || "Unnamed"}
                      </div>
                      <div style={{ fontSize: "9px", color: "#336633" }}>
                        {n.collection_name?.slice(0, 22) || short(n.contract_address)}
                      </div>
                      <div style={{ fontSize: "9px", color: "#00E5FF", marginTop: "4px", textTransform: "uppercase" }}>
                        {n.chain}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TRANSACTIONS ──────────────────────────────────────────── */}
        {tab === "transactions" && (
          <div style={{ flex: 1, overflow: "auto" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "80px 100px 1fr 1fr 120px 80px",
              padding: "8px 20px",
              borderBottom: "1px solid #1a2a1a",
              background: "#030a03",
              position: "sticky",
              top: 0,
            }}>
              {["AGE", "STATUS", "FROM", "TO", "METHOD", "CHAIN"].map((h) => (
                <span key={h} style={{ fontSize: "9px", color: "#336633", letterSpacing: "0.12em" }}>{h}</span>
              ))}
            </div>
            {loading
              ? Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} cols={6} />)
              : (txns || []).length === 0
              ? <Empty msg="NO_TRANSACTIONS_FOUND" />
              : (txns || []).map((t, i) => (
                  <div
                    key={`${t.hash}-${i}`}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "80px 100px 1fr 1fr 120px 80px",
                      padding: "10px 20px",
                      borderBottom: "1px solid #0a150a",
                      alignItems: "center",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#0a150a")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ color: "#336633", fontSize: "11px" }}>{ago(t.block_time)}</span>
                    <span style={{
                      fontSize: "11px",
                      color: t.status === "success" ? "#00FF88" : "#FF4466",
                      fontWeight: "bold",
                      textTransform: "uppercase",
                    }}>
                      {t.status === "success" ? "✓ OK" : "✗ FAIL"}
                    </span>
                    <span style={{ color: "#88BB88", fontSize: "11px", fontFamily: "monospace" }}>{short(t.from)}</span>
                    <span style={{ color: "#88BB88", fontSize: "11px", fontFamily: "monospace" }}>
                      {t.to ? short(t.to) : "CONTRACT_DEPLOY"}
                    </span>
                    <span style={{
                      color: "#FFAA00",
                      fontSize: "10px",
                      fontFamily: "monospace",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {t.method || "transfer()"}
                    </span>
                    <span style={{ color: "#00E5FF", fontSize: "10px", textTransform: "uppercase" }}>
                      {t.chain?.slice(0, 8)}
                    </span>
                  </div>
                ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: "8px 20px",
        borderTop: "1px solid #1a2a1a",
        background: "#030703",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: "10px", color: "#1a3a1a" }}>
          DATA_SOURCE: DUNE_SIM_API | LATENCY: REAL_TIME | CHAINS: 60+
        </span>
        <span style={{ fontSize: "10px", color: "#1a3a1a" }}>
          CHAIN<span style={{ color: "#00E5FF" }}>VISION</span>_v1.0.0
        </span>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #020502; }
        ::-webkit-scrollbar-thumb { background: #1a3a1a; border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: #00FF8844; }
      `}</style>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div style={{
      padding: "60px",
      textAlign: "center",
      color: "#1a3a1a",
      fontFamily: "monospace",
      fontSize: "13px",
      letterSpacing: "0.1em",
    }}>
      [ {msg} ]
    </div>
  );
}