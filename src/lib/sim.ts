// src/lib/sim.ts
// Dune SIM API client — all calls go through here

const SIM_BASE = "https://api.sim.dune.com/v1";

function simHeaders() {
  return {
    "X-Sim-Api-Key": process.env.SIM_API_KEY || "",
    "Content-Type": "application/json",
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenBalance {
  chain: string;
  chain_id: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balance_usd: number | null;
  price_usd: number | null;
  logo_url: string | null;
}

export interface BalancesResponse {
  wallet_address: string;
  balances: TokenBalance[];
  next_offset?: string;
}

export interface ActivityItem {
  chain: string;
  chain_id: number;
  block_time: string;
  block_number: number;
  hash: string;
  activity_type: string; // send | receive | swap | approve | contract_interaction
  from: string;
  to: string | null;
  token_symbol: string | null;
  token_address: string | null;
  amount: string | null;
  amount_usd: number | null;
  gas_used: string | null;
  gas_price: string | null;
}

export interface ActivityResponse {
  wallet_address: string;
  activity: ActivityItem[];
  next_offset?: string;
}

export interface NFTItem {
  chain: string;
  chain_id: number;
  contract_address: string;
  token_id: string;
  token_standard: string;
  name: string | null;
  collection_name: string | null;
  image_url: string | null;
  balance: string;
}

export interface NFTResponse {
  wallet_address: string;
  collectibles: NFTItem[];
  next_offset?: string;
}

export interface Transaction {
  chain: string;
  chain_id: number;
  hash: string;
  block_time: string;
  block_number: number;
  from: string;
  to: string | null;
  value: string;
  gas_used: string;
  gas_price: string;
  status: string;
  method: string | null;
}

export interface TransactionsResponse {
  wallet_address: string;
  transactions: Transaction[];
  next_offset?: string;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function getBalances(address: string): Promise<BalancesResponse> {
  const res = await fetch(
    `${SIM_BASE}/evm/balances/${address}?limit=50`,
    { headers: simHeaders(), next: { revalidate: 30 } }
  );
  if (!res.ok) throw new Error(`Balances API error: ${res.status}`);
  return res.json();
}

export async function getActivity(address: string): Promise<ActivityResponse> {
  const res = await fetch(
    `${SIM_BASE}/evm/activity/${address}?limit=25`,
    { headers: simHeaders(), next: { revalidate: 30 } }
  );
  if (!res.ok) throw new Error(`Activity API error: ${res.status}`);
  return res.json();
}

export async function getNFTs(address: string): Promise<NFTResponse> {
  const res = await fetch(
    `${SIM_BASE}/evm/collectibles/${address}?limit=30`,
    { headers: simHeaders(), next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error(`NFT API error: ${res.status}`);
  return res.json();
}

export async function getTransactions(address: string): Promise<TransactionsResponse> {
  const res = await fetch(
    `${SIM_BASE}/evm/transactions/${address}?limit=20`,
    { headers: simHeaders(), next: { revalidate: 30 } }
  );
  if (!res.ok) throw new Error(`Transactions API error: ${res.status}`);
  return res.json();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatUSD(val: number | null): string {
  if (val === null || val === undefined) return "$—";
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(2)}K`;
  return `$${val.toFixed(2)}`;
}

export function shortAddr(addr: string): string {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}