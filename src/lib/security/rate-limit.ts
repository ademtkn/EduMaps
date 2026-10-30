/**
 * Fixed-window rate limiter.
 *
 * State lives in process memory, which is correct for a single Node instance (local and
 * single-container deployments). For multi-instance production deployments swap `hit` for a
 * shared store (Redis/Upstash) keeping the same signature. Database-level limits in the
 * migrations (reviews, posts and comments per user) are enforced regardless.
 */
type Window = { count: number; resetAt: number };

const globalStore = globalThis as unknown as { __rateLimitStore?: Map<string, Window> };
const store = (globalStore.__rateLimitStore ??= new Map<string, Window>());

export type RateLimitResult = { ok: boolean; remaining: number; retryAfterSeconds: number };

/** Test servers set RATE_LIMIT_SCALE (see `npm run start:test`) so automated suites are not throttled. Always 1 in production. */
const SCALE = Math.max(1, Number(process.env.RATE_LIMIT_SCALE) || 1);

export function rateLimit(key: string, rawLimit: number, windowMs: number): RateLimitResult {
  const limit = rawLimit * SCALE;
  const now = Date.now();
  if (store.size > 10_000) {
    for (const [k, w] of store) if (w.resetAt <= now) store.delete(k);
  }
  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }
  current.count += 1;
  const ok = current.count <= limit;
  return {
    ok,
    remaining: Math.max(0, limit - current.count),
    retryAfterSeconds: ok ? 0 : Math.ceil((current.resetAt - now) / 1000),
  };
}

export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip")?.trim() || "local";
}
