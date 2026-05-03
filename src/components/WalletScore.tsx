"use client";

import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TokenBalance {
  chain: string;
  symbol: string;
  balance_usd: number | null;
}
interface ActivityItem {
  activity_type: string;
}
interface NFTItem {
  chain: string;
}
interface Transaction {
  status: string;
}

interface WalletAnalysis {
  overall_score: number;
  scores: {
    whale_probability: number;
    defi_sophistication: number;
    bot_likelihood: number;
    risk_score: number;
    diversification: number;
  };
  wallet_type: string;
  verdict: string;
  sections: {
    WALLET_PROFILE: string;
    CHAIN_BEHAVIOR: string;
    ASSET_STRATEGY: string;
    ACTIVITY_PATTERN: string;
    RISK_ASSESSMENT: string;
    KEY_FINDING: string;
  };
  flags: string[];
}

interface Props {
  address: string;
  balances: TokenBalance[] | null;
  activity: ActivityItem[] | null;
  nfts: NFTItem[] | null;
  transactions: Transaction[] | null;
}

// ─── Score bar component ──────────────────────────────────────────────────────
function ScoreBar({
  label,
  value,
  color,
  description,
}: {
  label: string;
  value: number;
  color: string;
  description: string;
}) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const getLevel = (v: number) => {
    if (v >= 80) return "HIGH";
    if (v >= 50) return "MED";
    return "LOW";
  };

  const levelColor = (label: string, v: number) => {
    // For bot_likelihood and risk, high = bad (red)
    if (label.includes("BOT") || label.includes("RISK")) {
      if (v >= 70) return "#FF4466";
      if (v >= 40) return "#FFAA00";
      return "#00FF88";
    }
    // For others, high = good (green)
    if (v >= 70) return color;
    if (v >= 40) return "#FFAA00";
    return "#555";
  };

  const barColor = levelColor(label, value);

  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "11px", color: "#88BB88", letterSpacing: "0.1em", fontFamily: "monospace" }}>
            {label}
          </span>
          <span style={{ fontSize: "9px", color: "#336633", letterSpacing: "0.06em" }}>{description}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            fontSize: "9px",
            color: barColor,
            letterSpacing: "0.1em",
            border: `1px solid ${barColor}44`,
            padding: "1px 6px",
          }}>
            {getLevel(value)}
          </span>
          <span style={{ fontSize: "14px", fontWeight: "bold", color: barColor, fontFamily: "monospace", minWidth: "36px", textAlign: "right" }}>
            {value}
          </span>
        </div>
      </div>
      {/* Bar track */}
      <div style={{
        height: "4px",
        background: "#0d1a0d",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${animated}%`,
          background: barColor,
          transition: "width 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: `0 0 8px ${barColor}66`,
        }} />
        {/* Tick marks */}
        {[25, 50, 75].map((tick) => (
          <div key={tick} style={{
            position: "absolute",
            top: 0,
            left: `${tick}%`,
            width: "1px",
            height: "100%",
            background: "#1a3a1a",
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── Overall score ring ───────────────────────────────────────────────────────
function ScoreRing({ score, walletType }: { score: number; walletType: string }) {
  const color =
    score >= 75 ? "#00FF88" :
    score >= 50 ? "#FFAA00" :
    score >= 25 ? "#FF6B6B" : "#555";

  const circumference = 2 * Math.PI * 45;
  const strokeDash = (score / 100) * circumference;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "32px" }}>
      {/* SVG Ring */}
      <div style={{ position: "relative", width: "120px", height: "120px", flexShrink: 0 }}>
        <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
          {/* Track */}
          <circle cx="60" cy="60" r="45" fill="none" stroke="#0d1a0d" strokeWidth="8" />
          {/* Progress */}
          <circle
            cx="60" cy="60" r="45"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="butt"
            strokeDasharray={`${strokeDash} ${circumference}`}
            style={{ filter: `drop-shadow(0 0 6px ${color}88)`, transition: "stroke-dasharray 1.5s ease" }}
          />
          {/* Tick at 25, 50, 75 */}
          {[0.25, 0.5, 0.75].map((pct) => {
            const angle = pct * 2 * Math.PI;
            const x1 = 60 + 41 * Math.cos(angle);
            const y1 = 60 + 41 * Math.sin(angle);
            const x2 = 60 + 49 * Math.cos(angle);
            const y2 = 60 + 49 * Math.sin(angle);
            return <line key={pct} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1a3a1a" strokeWidth="1" />;
          })}
        </svg>
        {/* Center text */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: "28px", fontWeight: 900, color, fontFamily: "monospace", lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ fontSize: "9px", color: "#336633", letterSpacing: "0.1em" }}>/ 100</span>
        </div>
      </div>

      {/* Wallet type + verdict */}
      <div>
        <div style={{ fontSize: "9px", color: "#336633", letterSpacing: "0.15em", marginBottom: "8px" }}>
          WALLET_CLASSIFICATION
        </div>
        <div style={{
          display: "inline-block",
          padding: "4px 14px",
          border: `1px solid ${color}55`,
          background: `${color}11`,
          color: color,
          fontSize: "13px",
          fontWeight: "bold",
          letterSpacing: "0.12em",
          marginBottom: "12px",
        }}>
          {walletType}
        </div>
        <div style={{ fontSize: "9px", color: "#336633", letterSpacing: "0.15em", marginBottom: "6px" }}>
          OVERALL_SCORE
        </div>
        <div style={{
          fontSize: "11px",
          color: score >= 50 ? "#88BB88" : "#FF6B6B",
          letterSpacing: "0.05em",
          lineHeight: 1.5,
        }}>
          {score >= 75 ? "▲ STRONG PROFILE" :
           score >= 50 ? "◆ AVERAGE PROFILE" :
           score >= 25 ? "▼ WEAK PROFILE" : "✕ MINIMAL ACTIVITY"}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WalletScore({ address, balances, activity, nfts, transactions }: Props) {
  const [analysis, setAnalysis] = useState<WalletAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setTick((p) => !p), 400);
    return () => clearInterval(t);
  }, []);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    // Build wallet data payload
    const totalUSD = (balances || []).reduce((s, b) => s + (b.balance_usd || 0), 0);
    const chains = [...new Set((balances || []).map((b) => b.chain))];
    const topTokens = [...(balances || [])]
      .sort((a, b) => (b.balance_usd || 0) - (a.balance_usd || 0))
      .slice(0, 5)
      .map((b) => `${b.symbol} ($${(b.balance_usd || 0).toFixed(0)})`)
      .join(", ");

    const activityBreakdown = (activity || []).reduce((acc: Record<string, number>, a) => {
      acc[a.activity_type] = (acc[a.activity_type] || 0) + 1;
      return acc;
    }, {});

    const failedTx = (transactions || []).filter((t) => t.status !== "success").length;
    const failRate = transactions?.length
      ? Math.round((failedTx / transactions.length) * 100)
      : 0;

    try {
      const res = await fetch("/api/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletData: {
            address,
            totalUSD: totalUSD.toFixed(2),
            chains,
            tokenCount: balances?.length || 0,
            topTokens: topTokens || "none",
            activityBreakdown,
            nftCount: nfts?.length || 0,
            txCount: transactions?.length || 0,
            failRate,
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API ${res.status}: ${errText}`);
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data.analysis);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const SCORE_BARS = analysis ? [
    { label: "WHALE_PROBABILITY", value: analysis.scores.whale_probability, color: "#00FF88", description: "likelihood of being a high-value wallet" },
    { label: "DEFI_SOPHISTICATION", value: analysis.scores.defi_sophistication, color: "#00E5FF", description: "complexity of DeFi protocol usage" },
    { label: "DIVERSIFICATION", value: analysis.scores.diversification, color: "#A78BFA", description: "spread across chains and asset types" },
    { label: "BOT_LIKELIHOOD", value: analysis.scores.bot_likelihood, color: "#FF4466", description: "probability of automated/bot behavior" },
    { label: "RISK_SCORE", value: analysis.scores.risk_score, color: "#FFAA00", description: "exposure to risky assets or patterns" },
  ] : [];

  const SECTION_COLORS: Record<string, string> = {
    WALLET_PROFILE: "#00FF88",
    CHAIN_BEHAVIOR: "#00E5FF",
    ASSET_STRATEGY: "#FFAA00",
    ACTIVITY_PATTERN: "#A78BFA",
    RISK_ASSESSMENT: "#FF4466",
    KEY_FINDING: "#34D399",
  };

  return (
    <div style={{ padding: "24px 20px", maxWidth: "860px" }}>

      {/* ── INITIAL STATE ── */}
      {!analysis && !loading && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: "10px", color: "#336633", letterSpacing: "0.12em" }}>
            ROOT@CHAINVISION:~$ RUN_WALLET_INTELLIGENCE --model llama-3.3-70b
          </div>
          <div style={{ border: "1px solid #1a3a1a", background: "#030a03", padding: "24px" }}>

            {/* Preview of what the score looks like */}
            <div style={{ marginBottom: "20px", padding: "16px", background: "#020502", border: "1px solid #0d1a0d" }}>
              <div style={{ fontSize: "9px", color: "#1a3a1a", letterSpacing: "0.15em", marginBottom: "12px" }}>
                PREVIEW — WALLET_INTELLIGENCE_REPORT
              </div>
              <div style={{ display: "flex", gap: "20px", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "32px", fontWeight: 900, color: "#1a3a1a", fontFamily: "monospace" }}>??</div>
                  <div style={{ fontSize: "9px", color: "#1a3a1a" }}>SCORE</div>
                </div>
                <div style={{ flex: 1 }}>
                  {["WHALE_PROBABILITY", "DEFI_SOPHISTICATION", "BOT_LIKELIHOOD"].map((label) => (
                    <div key={label} style={{ marginBottom: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                        <span style={{ fontSize: "9px", color: "#1a3a1a", fontFamily: "monospace" }}>{label}</span>
                        <span style={{ fontSize: "9px", color: "#1a3a1a" }}>??</span>
                      </div>
                      <div style={{ height: "3px", background: "#0d1a0d" }}>
                        <div style={{ height: "100%", width: "40%", background: "#1a3a1a" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: "10px", color: "#1a3a1a", fontStyle: "italic" }}>
                // Run analysis to reveal wallet intelligence...
              </div>
            </div>

            <div style={{ fontSize: "12px", color: "#336633", lineHeight: 1.9, marginBottom: "20px" }}>
              <span style={{ color: "#1a3a1a" }}>//</span> Generates a scored intelligence report using LLaMA 3.3-70B<br />
              <span style={{ color: "#1a3a1a" }}>//</span> Scores: Whale Probability · DeFi Sophistication · Bot Detection<br />
              <span style={{ color: "#1a3a1a" }}>//</span> Data ready:{" "}
              <span style={{ color: "#00FF88" }}>{balances?.length ?? 0} tokens</span>{" · "}
              <span style={{ color: "#00E5FF" }}>{activity?.length ?? 0} activities</span>{" · "}
              <span style={{ color: "#A78BFA" }}>{nfts?.length ?? 0} NFTs</span>{" · "}
              <span style={{ color: "#FFAA00" }}>{transactions?.length ?? 0} txns</span>
            </div>
            <button
              onClick={runAnalysis}
              style={{
                background: "#00FF88", color: "#020502", border: "none",
                padding: "13px 36px", fontFamily: "monospace", fontSize: "13px",
                fontWeight: "bold", letterSpacing: "0.12em", cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              ▶ GENERATE_WALLET_SCORE
            </button>
          </div>
        </div>
      )}

      {/* ── LOADING STATE ── */}
      {loading && (
        <div>
          <div style={{ fontSize: "11px", color: "#336633", letterSpacing: "0.12em", marginBottom: "24px" }}>
            ANALYZING_WALLET_INTELLIGENCE{tick ? "█" : " "}
          </div>
          {/* Animated score ring placeholder */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "32px" }}>
            <div style={{
              width: "120px", height: "120px", borderRadius: "50%",
              border: "8px solid #0d1a0d",
              animation: "shimmer 1.5s infinite",
              flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: "16px", width: "120px", background: "#0d1a0d", marginBottom: "10px", animation: "shimmer 1.5s infinite" }} />
              <div style={{ height: "24px", width: "180px", background: "#0d1a0d", animation: "shimmer 1.5s infinite" }} />
            </div>
          </div>
          {/* Skeleton bars */}
          {["WHALE_PROBABILITY", "DEFI_SOPHISTICATION", "DIVERSIFICATION", "BOT_LIKELIHOOD", "RISK_SCORE"].map((label) => (
            <div key={label} style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <div style={{ height: "11px", width: "160px", background: "#0d1a0d", animation: "shimmer 1.5s infinite" }} />
                <div style={{ height: "11px", width: "30px", background: "#0d1a0d", animation: "shimmer 1.5s infinite" }} />
              </div>
              <div style={{ height: "4px", background: "#0d1a0d" }}>
                <div style={{ height: "100%", width: "0%", background: "#1a3a1a" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ERROR STATE ── */}
      {error && !loading && (
        <div style={{ border: "1px solid #550000", background: "#1a0505", padding: "20px" }}>
          <div style={{ color: "#FF4466", fontSize: "12px", marginBottom: "12px", lineHeight: 1.6 }}>
            ERROR: {error}
          </div>
          <button onClick={runAnalysis} style={{ background: "none", border: "1px solid #FF4466", color: "#FF4466", fontFamily: "monospace", fontSize: "11px", padding: "6px 16px", cursor: "pointer" }}>
            ↻ RETRY
          </button>
        </div>
      )}

      {/* ── RESULTS ── */}
      {analysis && !loading && (
        <div>
          <div style={{ fontSize: "10px", color: "#336633", letterSpacing: "0.12em", marginBottom: "24px" }}>
            ── WALLET_INTELLIGENCE_COMPLETE ── MODEL: LLAMA-3.3-70B ──────────
          </div>

          {/* Score ring + type */}
          <ScoreRing score={analysis.overall_score} walletType={analysis.wallet_type} />

          {/* Verdict */}
          <div style={{
            padding: "14px 18px",
            border: "1px solid #1a3a1a",
            background: "#030a03",
            marginBottom: "28px",
          }}>
            <div style={{ fontSize: "9px", color: "#336633", letterSpacing: "0.15em", marginBottom: "6px" }}>VERDICT</div>
            <div style={{ fontSize: "13px", color: "#00FF88", lineHeight: 1.6, fontStyle: "italic" }}>
              "{analysis.verdict}"
            </div>
          </div>

          {/* Flags */}
          {analysis.flags?.length > 0 && (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "28px" }}>
              {analysis.flags.map((flag) => (
                <span key={flag} style={{
                  fontSize: "9px",
                  letterSpacing: "0.1em",
                  padding: "3px 10px",
                  border: "1px solid #1a3a1a",
                  color: "#336633",
                  background: "#030a03",
                }}>
                  ◆ {flag}
                </span>
              ))}
            </div>
          )}

          {/* Score bars */}
          <div style={{ marginBottom: "32px" }}>
            <div style={{ fontSize: "9px", color: "#1a3a1a", letterSpacing: "0.15em", marginBottom: "16px" }}>
              ── INTELLIGENCE_SCORES ────────────────────────────────────────────
            </div>
            {SCORE_BARS.map((bar) => (
              <ScoreBar key={bar.label} {...bar} />
            ))}
          </div>

          {/* Sections — collapsible */}
          <div>
            <div style={{ fontSize: "9px", color: "#1a3a1a", letterSpacing: "0.15em", marginBottom: "16px" }}>
              ── DETAILED_ANALYSIS ──────────────────────────────────────────────
            </div>
            {Object.entries(analysis.sections).map(([key, text]) => (
              <div key={key}
                style={{
                  borderBottom: "1px solid #0d1a0d",
                  cursor: "pointer",
                }}
                onClick={() => setExpandedSection(expandedSection === key ? null : key)}
              >
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px 0",
                }}
                  onMouseEnter={(e) => (e.currentTarget.parentElement!.style.background = "#0a150a")}
                  onMouseLeave={(e) => (e.currentTarget.parentElement!.style.background = "transparent")}
                >
                  <div style={{
                    fontSize: "11px", fontWeight: "bold",
                    color: SECTION_COLORS[key] || "#00FF88",
                    letterSpacing: "0.12em",
                  }}>
                    [{key}]
                  </div>
                  <span style={{ color: "#336633", fontSize: "10px" }}>
                    {expandedSection === key ? "▲ COLLAPSE" : "▼ EXPAND"}
                  </span>
                </div>
                {expandedSection === key && (
                  <div style={{
                    padding: "0 0 16px 12px",
                    fontSize: "13px",
                    color: "#88BB88",
                    lineHeight: 1.8,
                    maxWidth: "680px",
                    borderLeft: `2px solid ${SECTION_COLORS[key] || "#00FF88"}33`,
                  }}>
                    {text}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Re-run */}
          <div style={{ marginTop: "28px" }}>
            <button
              onClick={runAnalysis}
              style={{
                background: "transparent", border: "1px solid #1a3a1a",
                color: "#336633", fontFamily: "monospace",
                fontSize: "10px", padding: "8px 20px", cursor: "pointer", letterSpacing: "0.08em",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#00FF88"; e.currentTarget.style.borderColor = "#00FF88"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#336633"; e.currentTarget.style.borderColor = "#1a3a1a"; }}
            >
              ↻ RE_ANALYZE
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer { 0%,100%{opacity:0.3} 50%{opacity:0.8} }
      `}</style>
    </div>
  );
}