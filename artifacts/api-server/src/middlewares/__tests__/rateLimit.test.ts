/**
 * Unit tests for the rate limiter (findings #7 / #9):
 *  - per-user/per-IP bucketing
 *  - `namespace` option: routes with path params (e.g. /share/:token) share
 *    one bucket per caller instead of one bucket per token.
 */
import { describe, it, expect, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { rateLimit, __resetRateLimitBuckets } from "../rateLimit";

function fakeReq(path: string, userId?: string, ip = "10.0.0.9"): Request {
  return { path, ip, user: userId ? ({ id: userId } as never) : undefined } as unknown as Request;
}

function fakeRes() {
  const headers: Record<string, string> = {};
  let statusCode = 200;
  let body: unknown = null;
  let nextCalled = false;
  const res = {
    setHeader: (k: string, v: string) => { headers[k] = v; },
    status: (c: number) => { statusCode = c; return res; },
    json: (b: unknown) => { body = b; return res; },
  } as unknown as Response;
  return { res, headers, next: () => { nextCalled = true; }, get statusCode() { return statusCode; }, get body() { return body; }, get nextCalled() { return nextCalled; } };
}

describe("rateLimit", () => {
  beforeEach(() => __resetRateLimitBuckets());

  it("allows up to max requests then 429s", () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 2 });
    const allowed: boolean[] = [];
    for (let i = 0; i < 3; i++) {
      const ctx = fakeRes();
      let ok = false;
      limiter(fakeReq("/api/scans", "user-1"), ctx.res, () => { ok = true; });
      allowed.push(ok);
      if (!ok) expect(ctx.statusCode).toBe(429);
    }
    expect(allowed).toEqual([true, true, false]);
  });

  it("buckets users separately", () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 1 });
    const a = fakeRes();
    let okA = false;
    limiter(fakeReq("/x", "user-a"), a.res, () => { okA = true; });
    expect(okA).toBe(true);

    const b = fakeRes();
    let okB = false;
    limiter(fakeReq("/x", "user-b"), b.res, () => { okB = true; });
    expect(okB).toBe(true);
  });

  it("namespace shares one bucket across different paths (anti-enumeration)", () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 3, namespace: "public-share" });
    const results: boolean[] = [];
    // Simulate token enumeration: a different :token path per request.
    for (let i = 0; i < 5; i++) {
      const ctx = fakeRes();
      let ok = false;
      limiter(fakeReq(`/share/token-${i}`, undefined, "203.0.113.7"), ctx.res, () => { ok = true; });
      results.push(ok);
    }
    expect(results).toEqual([true, true, true, false, false]);
  });

  it("without namespace, different paths get different buckets", () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 1 });
    const results: boolean[] = [];
    for (let i = 0; i < 3; i++) {
      const ctx = fakeRes();
      let ok = false;
      limiter(fakeReq(`/share/token-${i}`, undefined, "203.0.113.7"), ctx.res, () => { ok = true; });
      results.push(ok);
    }
    // Each token got its own bucket — this is the weakness the namespace fixes.
    expect(results).toEqual([true, true, true]);
  });
});
