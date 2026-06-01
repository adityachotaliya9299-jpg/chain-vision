
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ─── Cache helpers ─────────────────────────────────────────────────────────

// Cache any value with TTL in seconds
export async function cacheSet(key: string, value: unknown, ttlSeconds = 30) {
  await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
}

// Get cached value, returns null if missing
export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await redis.get<string>(key);
  if (!raw) return null;
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw as T;
  } catch {
    return null;
  }
}

// Delete cached value
export async function cacheDel(key: string) {
  await redis.del(key);
}

// ─── Signal store ──────────────────────────────────────────────────────────
// Stores last 100 signals in a Redis list
// Key: "signals:live"

export async function pushSignal(signal: unknown) {
  const key = "signals:live";
  await redis.lpush(key, JSON.stringify(signal));
  await redis.ltrim(key, 0, 99); // Keep last 100
  await redis.expire(key, 3600); // 1 hour TTL
}

export async function getRecentSignals(limit = 20): Promise<unknown[]> {
  const raw = await redis.lrange("signals:live", 0, limit - 1);
  return raw.map((item) => {
    try {
      return typeof item === "string" ? JSON.parse(item) : item;
    } catch {
      return item;
    }
  });
}

// ─── Webhook event store (replaces in-memory Map) ─────────────────────────
// Key: "events:{address}"

export async function pushWalletEvent(address: string, event: unknown) {
  const key = `events:${address.toLowerCase()}`;
  await redis.lpush(key, JSON.stringify(event));
  await redis.ltrim(key, 0, 49); // Keep last 50 per wallet
  await redis.expire(key, 86400); // 24h TTL
}

export async function getWalletEvents(address: string, limit = 20): Promise<unknown[]> {
  const key = `events:${address.toLowerCase()}`;
  const raw = await redis.lrange(key, 0, limit - 1);
  return raw.map((item) => {
    try {
      return typeof item === "string" ? JSON.parse(item) : item;
    } catch {
      return item;
    }
  });
}

// ─── Rate limiter ──────────────────────────────────────────────────────────
// Returns true if request is allowed, false if rate limited

export async function rateLimit(
  identifier: string,
  maxRequests = 100,
  windowSeconds = 3600
): Promise<boolean> {
  const key = `ratelimit:${identifier}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }
  return count <= maxRequests;
}

// ─── Cache TTL constants ───────────────────────────────────────────────────
export const TTL = {
  BALANCES: 30,        // 30 seconds — token prices change fast
  ACTIVITY: 30,        // 30 seconds
  NFTS: 300,           // 5 minutes — NFTs don't change often
  TRANSACTIONS: 60,    // 1 minute
  DEFI: 60,            // 1 minute
  AI_REPORT: 86400,    // 24 hours — expensive to generate
  SMART_MONEY: 300,    // 5 minutes
  SIGNALS: 10,         // 10 seconds — must be fresh
  WALLET_FEATURES: 3600, // 1 hour
};