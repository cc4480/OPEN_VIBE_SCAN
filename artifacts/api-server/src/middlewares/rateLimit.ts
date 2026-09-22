/**
 * Minimal in-memory token-bucket rate limiter for the API.
 *
 * Keyed per user when authenticated, per IP otherwise. This is a single-
 * instance limiter: if the API ever runs behind multiple replicas, replace
 * the Map with a shared store (Redis). Limits are deliberately conservative.
 */

import type { Request, Response, NextFunction, RequestHandler } from "express";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Opportunistic cleanup so the map can't grow without bound.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000).unref();

export interface RateLimitOptions {
  /** Window length in milliseconds. */
  windowMs: number;
  /** Max requests per window per key. */
  max: number;
  /** 429 response message. */
  message?: string;
  /**
   * Fixed namespace replacing `req.path` in the bucket key. Use for routes
   * with path params (e.g. /share/:token) so one bucket covers the whole
   * route instead of one bucket per token.
   */
  namespace?: string;
}

function keyFor(req: Request): string {
  const userId = (req as Request & { user?: { id?: string } }).user?.id;
  if (userId) return `user:${userId}`;
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  return `ip:${ip}`;
}

export function rateLimit(options: RateLimitOptions): RequestHandler {
  const { windowMs, max, message = "Too many requests. Please slow down and try again.", namespace } = options;
  return (req: Request, res: Response, next: NextFunction): void => {
    const routeKey = namespace ?? req.path;
    const key = `${routeKey}::${keyFor(req)}`;
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - bucket.count)));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));
    if (bucket.count > max) {
      res.status(429).json({ error: message });
      return;
    }
    next();
  };
}

/** Test-only: reset all buckets. */
export function __resetRateLimitBuckets(): void {
  buckets.clear();
}
