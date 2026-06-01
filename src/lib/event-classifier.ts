export type EventType =
  | "SWAP"
  | "TRANSFER"
  | "LP_ADD"
  | "LP_REMOVE"
  | "BRIDGE_IN"
  | "BRIDGE_OUT"
  | "MINT"
  | "BURN"
  | "APPROVE"
  | "CONTRACT_CALL"
  | "TOKEN_LAUNCH"
  | "UNKNOWN";

export type SignalType =
  | "SMART_MONEY_BUY"
  | "SMART_MONEY_SELL"
  | "WHALE_TRANSFER"
  | "LP_REMOVAL"
  | "BRIDGE_INFLOW"
  | "BRIDGE_OUTFLOW"
  | "NEW_TOKEN_LAUNCH"
  | "COORDINATED_ACTIVITY"
  | null;

export interface ClassifiedEvent {
  txHash: string;
  walletAddress: string;
  chain: string;
  eventType: EventType;
  signalType: SignalType;
  tokenSymbol?: string;
  tokenAddress?: string;
  amountUsd?: number;
  fromAddress?: string;
  toAddress?: string;
  blockTime: string;
  metadata?: Record<string, unknown>;
  // For UI display
  summary: string;
  detail: string;
  direction?: "in" | "out";
  color: string;
}

// ─── Known Contract Addresses ─────────────────────────────────────────────
// Testnet versions for devnet/Sepolia testing

const KNOWN_CONTRACTS: Record<string, { name: string; type: string }> = {
  // Ethereum Mainnet DEXes
  "0x7a250d5630b4cf539739df2c5dacb4c659f2488d": { name: "Uniswap V2 Router", type: "dex" },
  "0xe592427a0aece92de3edee1f18e0157c05861564": { name: "Uniswap V3 Router", type: "dex" },
  "0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f": { name: "SushiSwap Router", type: "dex" },
  "0x1111111254eeb25477b68fb85ed929f73a960582": { name: "1inch V5", type: "dex" },
  // Bridges
  "0x40ec5b33f54e0e8a33a975908c5ba1c14e5bbbdf": { name: "Polygon Bridge", type: "bridge" },
  "0x99c9fc46f92e8a1c0dec1b1747d010903e884be1": { name: "Optimism Bridge", type: "bridge" },
  "0x8315177ab297ba92a06054ce80a67ed4dbd7ed3a": { name: "Arbitrum Bridge", type: "bridge" },
  // LP
  "0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f": { name: "Uniswap V2 Factory", type: "lp" },
  "0x1f98431c8ad98523631ae4a59f267346ea31f984": { name: "Uniswap V3 Factory", type: "lp" },
  // Lending
  "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2": { name: "Aave V3 Pool", type: "lending" },
  "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b": { name: "Compound V2", type: "lending" },
};

// ─── Smart Money wallet set (check against DB in production) ─────────────
// In production, this comes from Postgres wallets table where isSmartMoney=true
const SMART_MONEY_WALLETS = new Set([
  "0xf89d7b9c864f589bbf53a82105107622b35eaa40", // Wintermute
  "0x0a4c79ce84202b03e95b7a692e5d728d83c44c76", // Jump Trading
  "0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be", // Binance 1
  // Add more as you research
]);

// Whale threshold — transactions above this are WHALE events
const WHALE_USD_THRESHOLD = 100_000;

// ─── Main classifier ──────────────────────────────────────────────────────
export function classifyTransaction(
  raw: Record<string, unknown>,
  chain: "ethereum" | "solana"
): ClassifiedEvent {
  if (chain === "solana") {
    return classifySolanaTransaction(raw);
  }
  return classifyEVMTransaction(raw);
}

// ─── EVM Transaction Classifier ───────────────────────────────────────────
function classifyEVMTransaction(raw: Record<string, unknown>): ClassifiedEvent {
  const txHash = String(raw.hash || raw.txHash || "");
  const from = String(raw.from || "").toLowerCase();
  const to = String(raw.to || "").toLowerCase();
  const value = Number(raw.value || 0);
  const blockTime = String(raw.timestamp || new Date().toISOString());

  // Look up known contract
  const toContract = KNOWN_CONTRACTS[to];
  const fromContract = KNOWN_CONTRACTS[from];

  // Determine event type
  let eventType: EventType = "UNKNOWN";
  let signalType: SignalType = null;
  let summary = "Transaction";
  let detail = "";
  let color = "#88BB88";
  let direction: "in" | "out" | undefined;

  // DEX interaction
  if (toContract?.type === "dex") {
    eventType = "SWAP";
    summary = `⇄ SWAP via ${toContract.name}`;
    color = "#00E5FF";
  }
  // Bridge
  else if (toContract?.type === "bridge" || fromContract?.type === "bridge") {
    if (toContract?.type === "bridge") {
      eventType = "BRIDGE_OUT";
      signalType = "BRIDGE_OUTFLOW";
      summary = `→ BRIDGE_OUT via ${toContract.name}`;
      color = "#A78BFA";
      direction = "out";
    } else {
      eventType = "BRIDGE_IN";
      signalType = "BRIDGE_INFLOW";
      summary = `← BRIDGE_IN via ${fromContract?.name}`;
      color = "#34D399";
      direction = "in";
    }
  }
  // LP interaction
  else if (toContract?.type === "lp") {
    // Simplified — in production decode the method signature
    eventType = "LP_ADD";
    summary = `+ LP_ADD via ${toContract.name}`;
    color = "#FFAA00";
  }
  // Simple ETH transfer
  else if (value > 0 && (!to || to === "")) {
    eventType = "TRANSFER";
    summary = "→ ETH TRANSFER";
    color = "#FF4466";
    direction = "out";
  }
  // Incoming transfer
  else if (value > 0) {
    eventType = "TRANSFER";
    summary = "← ETH RECEIVED";
    color = "#00FF88";
    direction = "in";
  }

  // Check value thresholds for signal types
  const valueUsd = estimateETHValueUsd(value);
  if (valueUsd >= WHALE_USD_THRESHOLD && eventType === "TRANSFER") {
    signalType = "WHALE_TRANSFER";
    summary = `🐋 WHALE_TRANSFER — $${formatUsd(valueUsd)}`;
    color = "#FFAA00";
  }

  // Check if smart money wallet
  if (SMART_MONEY_WALLETS.has(from) && (eventType === "SWAP" || eventType === "TRANSFER")) {
    signalType = "SMART_MONEY_BUY";
    summary = `★ SMART_MONEY_BUY — ${summary}`;
    color = "#00FF88";
  }

  detail = `${shortAddr(from)} → ${shortAddr(to)} | tx: ${txHash.slice(0, 16)}...`;

  return {
    txHash,
    walletAddress: from,
    chain: "ethereum",
    eventType,
    signalType,
    amountUsd: valueUsd > 0 ? valueUsd : undefined,
    fromAddress: from,
    toAddress: to,
    blockTime,
    summary,
    detail,
    direction,
    color,
    metadata: { raw },
  };
}

// ─── Solana Transaction Classifier ───────────────────────────────────────
function classifySolanaTransaction(raw: Record<string, unknown>): ClassifiedEvent {
  const txHash = String(raw.signature || raw.hash || "");
  const blockTime = String(raw.blockTime || new Date().toISOString());

  // Helius enhanced transactions have type field
  const type = String(raw.type || "UNKNOWN").toUpperCase();
  const source = String(raw.source || "").toUpperCase();
  const feePayer = String(raw.feePayer || "");

  let eventType: EventType = "UNKNOWN";
  let signalType: SignalType = null;
  let summary = "Solana Transaction";
  let color = "#88BB88";
  let tokenSymbol: string | undefined;
  let amountUsd: number | undefined;

  // Map Helius transaction types to our event types
  if (type === "SWAP" || source === "JUPITER" || source === "RAYDIUM" || source === "ORCA") {
    eventType = "SWAP";
    summary = `⇄ SWAP on ${source || "Solana DEX"}`;
    color = "#00E5FF";
  } else if (type === "TRANSFER") {
    eventType = "TRANSFER";
    summary = "→ SOL TRANSFER";
    color = "#88BB88";
  } else if (type === "NFT_MINT" || type === "MINT_NFT") {
    eventType = "MINT";
    summary = "✦ NFT MINT";
    color = "#A78BFA";
  } else if (type === "TOKEN_MINT") {
    eventType = "TOKEN_LAUNCH";
    signalType = "NEW_TOKEN_LAUNCH";
    summary = "🚀 NEW_TOKEN_LAUNCH";
    color = "#FF4466";
  } else if (type === "ADD_LIQUIDITY" || type === "DEPOSIT") {
    eventType = "LP_ADD";
    summary = "+ LP_ADD";
    color = "#FFAA00";
  } else if (type === "REMOVE_LIQUIDITY" || type === "WITHDRAW") {
    eventType = "LP_REMOVE";
    signalType = "LP_REMOVAL";
    summary = "- LP_REMOVAL";
    color = "#FF6B6B";
  } else if (type === "BURN") {
    eventType = "BURN";
    summary = "✕ TOKEN BURN";
    color = "#FF4466";
  }

  // Extract token info from Helius enhanced data
  const tokenTransfers = raw.tokenTransfers as Array<Record<string, unknown>> | undefined;
  if (tokenTransfers && tokenTransfers.length > 0) {
    const primaryTransfer = tokenTransfers[0];
    tokenSymbol = String(primaryTransfer.mint || "").slice(0, 8);
    amountUsd = Number(primaryTransfer.tokenAmount || 0);
  }

  // Check smart money
  if (SMART_MONEY_WALLETS.has(feePayer) && eventType === "SWAP") {
    signalType = "SMART_MONEY_BUY";
    summary = `★ SMART_MONEY_BUY — ${summary}`;
    color = "#00FF88";
  }

  return {
    txHash,
    walletAddress: feePayer,
    chain: "solana",
    eventType,
    signalType,
    tokenSymbol,
    amountUsd,
    fromAddress: feePayer,
    blockTime,
    summary,
    detail: `sig: ${txHash.slice(0, 20)}... | source: ${source || "unknown"}`,
    color,
    metadata: { type, source, raw },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function shortAddr(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

// Rough ETH price estimate for testnet (use Chainlink in production)
function estimateETHValueUsd(wei: number): number {
  const eth = wei / 1e18;
  const ETH_PRICE = 2300; // Rough estimate — replace with live price
  return eth * ETH_PRICE;
}

// ─── Coordination Detector ────────────────────────────────────────────────
// Detects when multiple smart wallets buy same token in short window

interface TokenActivity {
  wallets: string[];
  totalUsd: number;
  firstSeen: number;
}

const recentTokenActivity = new Map<string, TokenActivity>();

export function checkCoordination(
  event: ClassifiedEvent
): { isCoordinated: boolean; walletCount: number; totalUsd: number } {
  if (!event.tokenSymbol || !SMART_MONEY_WALLETS.has(event.walletAddress)) {
    return { isCoordinated: false, walletCount: 0, totalUsd: 0 };
  }

  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minute window
  const key = `${event.chain}:${event.tokenSymbol}`;

  const existing = recentTokenActivity.get(key);

  if (!existing || now - existing.firstSeen > windowMs) {
    // New window
    recentTokenActivity.set(key, {
      wallets: [event.walletAddress],
      totalUsd: event.amountUsd || 0,
      firstSeen: now,
    });
    return { isCoordinated: false, walletCount: 1, totalUsd: event.amountUsd || 0 };
  }

  // Add to existing window
  if (!existing.wallets.includes(event.walletAddress)) {
    existing.wallets.push(event.walletAddress);
    existing.totalUsd += event.amountUsd || 0;
  }

  const COORDINATION_THRESHOLD = 3; // 3+ smart wallets = coordinated
  const isCoordinated = existing.wallets.length >= COORDINATION_THRESHOLD;

  return {
    isCoordinated,
    walletCount: existing.wallets.length,
    totalUsd: existing.totalUsd,
  };
}