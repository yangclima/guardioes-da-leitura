interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Small fixed-window limiter kept in memory. On serverless it is per
 * instance, which is still enough to slow down password guessing.
 */
export function createRateLimiter(limit: number, windowMs: number) {
  const buckets = new Map<string, Bucket>();
  return function hit(key: string, now: number = Date.now()): { allowed: boolean; retryAfterSec: number } {
    if (buckets.size > 10_000) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    }
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, retryAfterSec: 0 };
    }
    const next = { ...bucket, count: bucket.count + 1 };
    buckets.set(key, next);
    const allowed = next.count <= limit;
    return { allowed, retryAfterSec: allowed ? 0 : Math.ceil((next.resetAt - now) / 1000) };
  };
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}
