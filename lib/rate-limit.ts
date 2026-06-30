import "server-only";

/**
 * Lightweight in-memory rate limiter (fixed-window). Keyed by an arbitrary
 * string, usually "<route>:<ip>". Good enough on a single always-on Node
 * instance (the current Render deployment). When the app scales to multiple
 * instances, swap the Map for a shared store (Upstash Redis / Vercel KV) so
 * the window is counted across all instances. The call sites don't change.
 */

type Window = { count: number; resetAt: number };

const buckets = new Map<string, Window>();

// Opportunistic cleanup so the Map can't grow without bound under attack.
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, w] of buckets) {
    if (w.resetAt <= now) buckets.delete(k);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
}

/**
 * Allow up to `limit` requests per `windowMs` for a given key.
 * Returns ok=false once the limit is exceeded within the window.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt, retryAfterSec: 0 };
  }

  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);
  const ok = existing.count <= limit;
  return {
    ok,
    remaining,
    resetAt: existing.resetAt,
    retryAfterSec: ok ? 0 : Math.ceil((existing.resetAt - now) / 1000),
  };
}

/** Best-effort client IP from proxy headers (Render/Vercel set these). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Standard 429 response with a Retry-After header. Pass the result of
 * rateLimit() when ok is false.
 */
export function tooManyRequests(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please slow down and try again shortly." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSec || 1),
      },
    },
  );
}
