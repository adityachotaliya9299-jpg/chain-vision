
export default function Loading() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#020502",
      color: "#00FF88",
      fontFamily: "'Courier New', Courier, monospace",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Top bar skeleton */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 20px", borderBottom: "1px solid #1a2a1a", background: "#030703",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <span style={{ fontSize: "13px", fontWeight: "bold" }}>
            ← CHAIN<span style={{ color: "#00E5FF" }}>VISION</span>
          </span>
          <span style={{ color: "#1a3a1a" }}>│</span>
          <span style={{ fontSize: "10px", color: "#336633", letterSpacing: "0.12em" }}>WALLET_ANALYSIS</span>
        </div>
        <span style={{ fontSize: "10px", color: "#336633" }}>
          SIM_API: <span style={{ color: "#00FF88" }}>CONNECTED</span>
        </span>
      </div>

      {/* Address scanning animation */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #1a2a1a", background: "#030a03" }}>
        <div style={{ fontSize: "9px", color: "#336633", marginBottom: "6px", letterSpacing: "0.12em" }}>TARGET_ADDRESS</div>
        <div style={{ height: "14px", width: "420px", background: "#0d1a0d", marginBottom: "20px", animation: "shimmer 1.2s infinite" }} />
        <div style={{ display: "flex" }}>
          {["TOTAL_VALUE_USD", "CHAINS_ACTIVE", "TOKENS_HELD", "NFTs_OWNED"].map((label, i) => (
            <div key={label} style={{ flex: 1, padding: "10px 20px", borderRight: i < 3 ? "1px solid #1a2a1a" : "none" }}>
              <div style={{ fontSize: "9px", color: "#336633", letterSpacing: "0.1em", marginBottom: "6px" }}>{label}</div>
              <div style={{ height: "22px", width: "80px", background: "#0d1a0d", animation: "shimmer 1.2s infinite" }} />
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar skeleton */}
      <div style={{ display: "flex", borderBottom: "1px solid #1a2a1a", background: "#030703" }}>
        {["TOKENS", "ACTIVITY", "NFTs", "TXN_HISTORY", "AI_INSIGHTS ✦"].map((t, i) => (
          <div key={t} style={{
            padding: "10px 20px",
            borderRight: "1px solid #1a2a1a",
            color: i === 0 ? "#00FF88" : "#1a3a1a",
            fontSize: "11px", letterSpacing: "0.1em",
            borderBottom: i === 0 ? "2px solid #00FF88" : "2px solid transparent",
          }}>
            {i === 0 && "▶ "}{t}
          </div>
        ))}
      </div>

      {/* Main content — scanning animation */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
        <div style={{ fontSize: "11px", color: "#336633", letterSpacing: "0.15em" }}>
          SCANNING_BLOCKCHAIN_DATA
          <BlinkingCursor />
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{
              width: "6px", height: "6px",
              background: "#00FF88",
              opacity: 0.3,
              animation: `dot-pulse 1.2s ease-in-out ${i * 0.15}s infinite`,
            }} />
          ))}
        </div>
        <div style={{ fontSize: "10px", color: "#1a3a1a", letterSpacing: "0.1em" }}>
          POWERED_BY_DUNE_SIM_API
        </div>
      </div>

      <style>{`
        @keyframes shimmer { 0%,100%{opacity:0.3} 50%{opacity:0.8} }
        @keyframes dot-pulse { 0%,100%{opacity:0.2;transform:scale(1)} 50%{opacity:1;transform:scale(1.4)} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}

function BlinkingCursor() {
  // Static on server, blinks on client — avoids hydration issue
  return <span style={{ animation: "dot-pulse 1s ease-in-out infinite" }}>█</span>;
}