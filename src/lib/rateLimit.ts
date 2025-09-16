type Bucket = { tokens: number; updatedAt: number };
const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000, MAX_TOKENS = 20;

export function rateLimit(key: string) {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: MAX_TOKENS, updatedAt: now };
  const elapsed = now - b.updatedAt;
  const refill = Math.floor(elapsed / WINDOW_MS) * MAX_TOKENS;
  b.tokens = Math.min(MAX_TOKENS, b.tokens + (refill > 0 ? refill : 0));
  b.updatedAt = now;
  if (b.tokens <= 0) return false;
  b.tokens -= 1; buckets.set(key, b); return true;
}
