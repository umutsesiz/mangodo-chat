type Bucket = { tokens: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function parseWindowMs(window: `${number}${"s" | "m" | "h"}` | number) {
  if (typeof window === "number") return window;
  const n = parseInt(window);
  const unit = window.slice(-1);
  const mul = unit === "s" ? 1_000 : unit === "m" ? 60_000 : 3_600_000;
  return n * mul;
}

function ipFrom(req: Request) {
  const h = req.headers;
  const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return fwd || h.get("x-real-ip") || "127.0.0.1";
}

export type RateResult = {
  ok: boolean;
  headers: Record<string, string>;
};

export function rateLimitKey(
  key: string,
  { limit, window }: { limit: number; window: `${number}${"s" | "m" | "h"}` | number }
): RateResult {
  const now = Date.now();
  const windowMs = parseWindowMs(window);

  let b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    b = { tokens: limit, resetAt: now + windowMs };
    buckets.set(key, b);
  }

  const remaining = Math.max(0, b.tokens - 1);
  const ok = b.tokens > 0;
  if (ok) b.tokens = remaining;

  const resetSec = Math.ceil((b.resetAt - now) / 1000);
  return {
    ok,
    headers: {
      "X-RateLimit-Limit": String(limit),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset": String(resetSec),
    },
  };
}

export function rateLimitReq(
  req: Request,
  { limit, window, key }: { limit: number; window: `${number}${"s" | "m" | "h"}` | number; key?: string }
): RateResult {
  const url = new URL(req.url);
  const ip = ipFrom(req);
  const k = key ?? `${ip}:${url.pathname}`;
  return rateLimitKey(k, { limit, window });
}
