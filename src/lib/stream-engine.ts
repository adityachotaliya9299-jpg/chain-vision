
import { classifyTransaction, checkCoordination, ClassifiedEvent } from "./event-classifier";
import { pushSignal, pushWalletEvent } from "./redis";

// ─── Types ────────────────────────────────────────────────────────────────
interface StreamEngineStatus {
  helius: "connected" | "disconnected" | "connecting" | "error";
  alchemy: "connected" | "disconnected" | "connecting" | "error";
  eventsProcessed: number;
  signalsGenerated: number;
  startedAt: string;
}

// ─── Singleton engine state ────────────────────────────────────────────────
// NOTE: In Next.js dev mode, this module reloads frequently.
// In production on Vercel, use a separate long-running process (Fly.io/Railway)
// For now this works perfectly for development and demo.

let heliusWs: WebSocket | null = null;
let alchemyWs: WebSocket | null = null;
let isRunning = false;
let eventsProcessed = 0;
let signalsGenerated = 0;
const startedAt = new Date().toISOString();

export function getStreamStatus(): StreamEngineStatus {
  return {
    helius: heliusWs?.readyState === 1 ? "connected"
      : heliusWs?.readyState === 0 ? "connecting"
      : "disconnected",
    alchemy: alchemyWs?.readyState === 1 ? "connected"
      : alchemyWs?.readyState === 0 ? "connecting"
      : "disconnected",
    eventsProcessed,
    signalsGenerated,
    startedAt,
  };
}

// ─── Start Stream Engine ──────────────────────────────────────────────────
export function startStreamEngine() {
  if (isRunning) return;
  isRunning = true;
  console.log("[STREAM_ENGINE] Starting...");
  connectHelius();
  connectAlchemy();
}

// ─── Helius WebSocket (Solana Devnet) ─────────────────────────────────────
function connectHelius() {
  const wsUrl = process.env.HELIUS_WS_URL;
  if (!wsUrl) {
    console.warn("[HELIUS] HELIUS_WS_URL not set — skipping Solana stream");
    return;
  }

  console.log("[HELIUS] Connecting to:", wsUrl.replace(/api-key=.*/, "api-key=***"));

  try {
    // Use global WebSocket (Node 18+ supports it natively)
    heliusWs = new WebSocket(wsUrl);

    heliusWs.onopen = () => {
      console.log("[HELIUS] ✓ Connected");

      // Subscribe to all transactions on devnet
      // In production: subscribe to specific program IDs or wallet addresses
      const subscription = {
        jsonrpc: "2.0",
        id: 1,
        method: "logsSubscribe",
        params: [
          "all", // Subscribe to all logs (devnet only — too much data for mainnet)
          { commitment: "confirmed" },
        ],
      };
      heliusWs!.send(JSON.stringify(subscription));
      console.log("[HELIUS] Subscribed to transaction logs");
    };

    heliusWs.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data as string);

        // Skip subscription confirmation messages
        if (data.result !== undefined && typeof data.result === "number") return;
        if (!data.params?.result) return;

        const logData = data.params.result;
        eventsProcessed++;

        // Build a simplified transaction object from log data
        const rawTx: Record<string, unknown> = {
          signature: logData.value?.signature || "",
          feePayer: logData.value?.logs?.[0]?.slice(0, 44) || "",
          type: detectSolanaEventType(logData.value?.logs || []),
          source: detectSolanaSource(logData.value?.logs || []),
          blockTime: new Date().toISOString(),
          logs: logData.value?.logs || [],
        };

        // Classify the event
        const classified = classifyTransaction(rawTx, "solana");
        await processClassifiedEvent(classified);
      } catch (e) {
        // Silent fail — malformed messages are common in WebSocket streams
      }
    };

    heliusWs.onerror = (err) => {
      console.error("[HELIUS] WebSocket error:", err);
    };

    heliusWs.onclose = (event) => {
      console.log(`[HELIUS] Disconnected (code: ${event.code}). Reconnecting in 5s...`);
      heliusWs = null;
      setTimeout(connectHelius, 5000);
    };
  } catch (e) {
    console.error("[HELIUS] Failed to connect:", e);
    setTimeout(connectHelius, 10000);
  }
}

// ─── Alchemy WebSocket (Ethereum Sepolia testnet) ─────────────────────────
function connectAlchemy() {
  const wsUrl = process.env.ALCHEMY_WS_URL;
  if (!wsUrl) {
    console.warn("[ALCHEMY] ALCHEMY_WS_URL not set — skipping Ethereum stream");
    return;
  }

  console.log("[ALCHEMY] Connecting to:", wsUrl.replace(/v2\/.*/, "v2/***"));

  try {
    alchemyWs = new WebSocket(wsUrl);

    alchemyWs.onopen = () => {
      console.log("[ALCHEMY] ✓ Connected");

      // Subscribe to pending transactions (Sepolia testnet)
      const subscription = {
        jsonrpc: "2.0",
        id: 1,
        method: "eth_subscribe",
        params: ["newPendingTransactions"],
      };
      alchemyWs!.send(JSON.stringify(subscription));

      // Also subscribe to new blocks
      const blockSub = {
        jsonrpc: "2.0",
        id: 2,
        method: "eth_subscribe",
        params: ["newHeads"],
      };
      alchemyWs!.send(JSON.stringify(blockSub));
      console.log("[ALCHEMY] Subscribed to pending transactions + new blocks");
    };

    alchemyWs.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data as string);

        // Skip subscription confirmations
        if (data.result && typeof data.result === "string" && data.result.startsWith("0x")) return;
        if (!data.params?.result) return;

        const txData = data.params.result;
        eventsProcessed++;

        // Build raw transaction object
        const rawTx: Record<string, unknown> = {
          hash: txData.hash || txData,
          from: txData.from || "",
          to: txData.to || "",
          value: parseInt(txData.value || "0x0", 16),
          input: txData.input || "0x",
          timestamp: new Date().toISOString(),
        };

        // Classify the event
        const classified = classifyTransaction(rawTx, "ethereum");
        await processClassifiedEvent(classified);
      } catch (e) {
        // Silent fail
      }
    };

    alchemyWs.onerror = (err) => {
      console.error("[ALCHEMY] WebSocket error:", err);
    };

    alchemyWs.onclose = (event) => {
      console.log(`[ALCHEMY] Disconnected (code: ${event.code}). Reconnecting in 5s...`);
      alchemyWs = null;
      setTimeout(connectAlchemy, 5000);
    };
  } catch (e) {
    console.error("[ALCHEMY] Failed to connect:", e);
    setTimeout(connectAlchemy, 10000);
  }
}

// ─── Process Classified Event ─────────────────────────────────────────────
async function processClassifiedEvent(event: ClassifiedEvent) {
  // Skip events with no signal type and no wallet address
  if (!event.walletAddress && !event.signalType) return;

  try {
    // 1. Push to wallet-specific event store
    if (event.walletAddress) {
      await pushWalletEvent(event.walletAddress, event);
    }

    // 2. Check for coordinated activity
    const coordination = checkCoordination(event);
    if (coordination.isCoordinated) {
      const coordinationSignal = {
        type: "COORDINATED_ACTIVITY",
        confidence: Math.min(95, 50 + coordination.walletCount * 10),
        walletCount: coordination.walletCount,
        totalUsd: coordination.totalUsd,
        tokenSymbol: event.tokenSymbol,
        chain: event.chain,
        timestamp: new Date().toISOString(),
        summary: `${coordination.walletCount} smart wallets accumulated ${event.tokenSymbol} — $${formatUsd(coordination.totalUsd)}`,
        detail: `Coordinated accumulation detected in 15min window`,
        color: "#FF4466",
      };
      await pushSignal(coordinationSignal);
      signalsGenerated++;
      console.log("[SIGNAL] COORDINATED_ACTIVITY detected:", coordinationSignal.summary);
    }

    // 3. Push significant signals to global feed
    if (event.signalType) {
      const signal = {
        type: event.signalType,
        confidence: getSignalConfidence(event),
        wallet: event.walletAddress,
        tokenSymbol: event.tokenSymbol,
        amountUsd: event.amountUsd,
        chain: event.chain,
        timestamp: event.blockTime,
        summary: event.summary,
        detail: event.detail,
        color: event.color,
      };
      await pushSignal(signal);
      signalsGenerated++;
      console.log(`[SIGNAL] ${event.signalType}: ${event.summary}`);
    }
  } catch (e) {
    console.error("[STREAM_ENGINE] Error processing event:", e);
  }
}

// ─── Signal Confidence Calculator ────────────────────────────────────────
function getSignalConfidence(event: ClassifiedEvent): number {
  let confidence = 50;

  if (event.signalType === "SMART_MONEY_BUY") confidence = 85;
  if (event.signalType === "WHALE_TRANSFER") {
    if ((event.amountUsd || 0) > 1_000_000) confidence = 95;
    else if ((event.amountUsd || 0) > 500_000) confidence = 88;
    else confidence = 75;
  }
  if (event.signalType === "LP_REMOVAL") confidence = 72;
  if (event.signalType === "NEW_TOKEN_LAUNCH") confidence = 60;
  if (event.signalType === "BRIDGE_INFLOW") confidence = 65;

  return confidence;
}

// ─── Solana Log Parsers ───────────────────────────────────────────────────
function detectSolanaEventType(logs: string[]): string {
  const logStr = logs.join(" ").toLowerCase();
  if (logStr.includes("swap")) return "SWAP";
  if (logStr.includes("transfer")) return "TRANSFER";
  if (logStr.includes("mint")) return "MINT";
  if (logStr.includes("burn")) return "BURN";
  if (logStr.includes("addliquidity") || logStr.includes("deposit")) return "ADD_LIQUIDITY";
  if (logStr.includes("removeliquidity") || logStr.includes("withdraw")) return "REMOVE_LIQUIDITY";
  return "UNKNOWN";
}

function detectSolanaSource(logs: string[]): string {
  const logStr = logs.join(" ").toLowerCase();
  if (logStr.includes("jup") || logStr.includes("jupiter")) return "JUPITER";
  if (logStr.includes("raydium")) return "RAYDIUM";
  if (logStr.includes("orca")) return "ORCA";
  if (logStr.includes("meteora")) return "METEORA";
  if (logStr.includes("pump")) return "PUMP_FUN";
  return "UNKNOWN";
}

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

// ─── Stop Engine ──────────────────────────────────────────────────────────
export function stopStreamEngine() {
  isRunning = false;
  heliusWs?.close();
  alchemyWs?.close();
  heliusWs = null;
  alchemyWs = null;
  console.log("[STREAM_ENGINE] Stopped");
}