/**
 * API integration tests for the SecScan hardening work (all 10 findings).
 *
 * Requires a PostgreSQL test database with the full schema applied:
 *
 *   DATABASE_URL=postgres://postgres:postgres@localhost:5432/secscan_test \
 *     pnpm --filter @workspace/db db:push
 *
 * then run with:
 *
 *   TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/secscan_test \
 *     pnpm vitest run src/routes/__tests__/hardening.test.ts
 *
 * Tables are truncated between tests; nothing here touches the network
 * except the mocked `node:dns` module.
 */

process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/secscan_test";
process.env.DISABLE_PAYMENTS = "true";
process.env.NODE_ENV = "test";

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { randomUUID } from "node:crypto";
import request from "supertest";

// ─── DNS mock ──────────────────────────────────────────────────────────────
// public.example resolves to a public IP; everything else NXDOMAIN.
// TXT records are driven by the mutable `txtRecords` map below so tests can
// simulate the user publishing the challenge record.

const txtRecords = new Map<string, string[][]>();

vi.mock("node:dns", () => ({
  promises: {
    lookup: vi.fn(async (hostname: string) => {
      if (hostname === "public.example" || hostname === "other.example") {
        return [{ address: "93.184.216.34", family: 4 }];
      }
      const err = new Error(`ENOTFOUND ${hostname}`) as NodeJS.ErrnoException;
      err.code = "ENOTFOUND";
      throw err;
    }),
    resolveTxt: vi.fn(async (name: string) => txtRecords.get(name) ?? []),
  },
}));

// Never start pg-boss or the real worker in tests.
vi.mock("../../lib/queue", () => ({
  enqueueScan: vi.fn(async () => {}),
}));

const { default: app } = await import("../../app");
const { __resetRateLimitBuckets } = await import("../../middlewares/rateLimit");
const { db, pool } = await import("@workspace/db");
const { scansTable, reportsTable, reportSharesTable, usersTable } = await import("@workspace/db");

function validReportData() {
  return {
    vulnerabilities: [],
    summary: {
      totalVulnerabilities: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
      riskScore: 0,
      grade: "A",
      executiveSummary: "No issues found.",
    },
    technologies: [],
    targetUrl: "https://public.example/",
  };
}

const USER_A = randomUUID();
const USER_B = randomUUID();
const auth = (id: string) => ({ Authorization: `Bearer ${id}` });

async function truncateAll() {
  await db.execute(
    `TRUNCATE domain_verifications, report_shares, reports, scans, credits, users RESTART IDENTITY CASCADE`,
  );
  txtRecords.clear();
}

beforeAll(async () => {
  await pool.query("SELECT 1");
});

afterAll(async () => {
  await pool.end();
});

beforeEach(async () => {
  await truncateAll();
  __resetRateLimitBuckets();
});

// ─── Finding #1: DNS ownership gate ─────────────────────────────────────────

describe("DNS ownership gate", () => {
  it("blocks scan creation for an unverified target with TXT instructions", async () => {
    const res = await request(app)
      .post("/api/scans")
      .set(auth(USER_A))
      .send({ targetUrl: "https://public.example/", tier: "deep" });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("TARGET_NOT_VERIFIED");
    expect(res.body.verification).toMatchObject({
      hostname: "public.example",
      txtName: "_secscan-challenge.public.example",
    });
    expect(typeof res.body.verification.token).toBe("string");
    expect(res.body.verification.token.length).toBeGreaterThan(16);
  });

  it("issues a challenge, confirms via TXT, then lets the scan through", async () => {
    const challenge = await request(app)
      .post("/api/verify/challenge")
      .set(auth(USER_A))
      .send({ hostname: "public.example" });
    expect(challenge.status).toBe(200);
    const token = challenge.body.token as string;

    // Before the TXT record exists, confirm must fail.
    const early = await request(app)
      .post("/api/verify/confirm")
      .set(auth(USER_A))
      .send({ hostname: "public.example" });
    expect(early.status).toBe(200);
    expect(early.body.verified).toBe(false);

    // Publish the TXT record (mocked DNS) and confirm.
    txtRecords.set("_secscan-challenge.public.example", [[token]]);
    const confirmed = await request(app)
      .post("/api/verify/confirm")
      .set(auth(USER_A))
      .send({ hostname: "public.example" });
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.verified).toBe(true);

    const status = await request(app)
      .get("/api/verify/status")
      .set(auth(USER_A))
      .query({ hostname: "public.example" });
    expect(status.body.verified).toBe(true);

    // Now the scan gate passes (queue is mocked).
    const scan = await request(app)
      .post("/api/scans")
      .set(auth(USER_A))
      .send({ targetUrl: "https://public.example/", tier: "deep" });
    expect(scan.status).toBe(201);
    expect(scan.body.scanId).toBeTruthy();
  });

  it("verification is per-user: another user still gets blocked", async () => {
    const challenge = await request(app)
      .post("/api/verify/challenge")
      .set(auth(USER_A))
      .send({ hostname: "public.example" });
    txtRecords.set("_secscan-challenge.public.example", [[challenge.body.token]]);
    await request(app).post("/api/verify/confirm").set(auth(USER_A)).send({ hostname: "public.example" });

    const res = await request(app)
      .post("/api/scans")
      .set(auth(USER_B))
      .send({ targetUrl: "https://public.example/", tier: "deep" });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("TARGET_NOT_VERIFIED");
  });

  it("rejects SSRF-shaped targets at intake", async () => {
    for (const targetUrl of [
      "http://169.254.169.254/latest/meta-data/",
      "https://user:secret@public.example/",
      "ftp://public.example/",
      "https://public.example:22/",
    ]) {
      const res = await request(app)
        .post("/api/scans")
        .set(auth(USER_A))
        .send({ targetUrl, tier: "basic" });
      expect(res.status).toBe(400);
    }
  });
});

// ─── Finding #7: scan intake rate limiting ──────────────────────────────────

describe("scan intake rate limiting", () => {
  it("allows the first 10 scans/hour and rejects the 11th", async () => {
    // Verify once so the gate doesn't block the loop.
    const challenge = await request(app)
      .post("/api/verify/challenge")
      .set(auth(USER_A))
      .send({ hostname: "public.example" });
    txtRecords.set("_secscan-challenge.public.example", [[challenge.body.token]]);
    await request(app).post("/api/verify/confirm").set(auth(USER_A)).send({ hostname: "public.example" });

    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) {
      const res = await request(app)
        .post("/api/scans")
        .set(auth(USER_A))
        .send({ targetUrl: "https://public.example/", tier: "basic" });
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 10).every((s) => s === 201)).toBe(true);
    expect(statuses[10]).toBe(429);
  }, 30_000);
});

// ─── Finding #4: report auth + ownership ────────────────────────────────────

describe("report authorization", () => {
  async function seedReport(ownerId: string) {
    const [scan] = await db
      .insert(scansTable)
      .values({
        userId: ownerId,
        userEmail: "",
        targetUrl: "https://public.example/",
        tier: "deep",
        status: "complete",
      })
      .returning();
    const [report] = await db
      .insert(reportsTable)
      .values({ scanId: scan.id, userId: ownerId, targetUrl: "https://public.example/", tier: "deep", data: validReportData() })
      .returning();
    return report;
  }

  it("requires authentication", async () => {
    const report = await seedReport(USER_A);
    const res = await request(app).get(`/api/reports/${report.id}`);
    expect(res.status).toBe(401);
  });

  it("lets the owner read their report", async () => {
    const report = await seedReport(USER_A);
    const res = await request(app).get(`/api/reports/${report.id}`).set(auth(USER_A));
    expect(res.status).toBe(200);
  });

  it("hides another user's report as 404 (not 403)", async () => {
    const report = await seedReport(USER_A);
    const res = await request(app).get(`/api/reports/${report.id}`).set(auth(USER_B));
    expect(res.status).toBe(404);
  });
});

// ─── Finding #5: share links expire by default ──────────────────────────────

describe("share link expiry", () => {
  async function seedReport(ownerId: string) {
    const [scan] = await db
      .insert(scansTable)
      .values({
        userId: ownerId,
        userEmail: "",
        targetUrl: "https://public.example/",
        tier: "deep",
        status: "complete",
      })
      .returning();
    const [report] = await db
      .insert(reportsTable)
      .values({ scanId: scan.id, userId: ownerId, targetUrl: "https://public.example/", tier: "deep", data: validReportData() })
      .returning();
    return report;
  }

  it("defaults new share links to 30-day expiry", async () => {
    const report = await seedReport(USER_A);
    const res = await request(app)
      .post(`/api/reports/${report.id}/shares`)
      .set(auth(USER_A))
      .send({});
    expect(res.status).toBe(201);
    expect(res.body.expiresAt).toBeTruthy();
    const expiresAt = new Date(res.body.expiresAt).getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    expect(expiresAt - Date.now()).toBeGreaterThan(thirtyDays - 60_000);
    expect(expiresAt - Date.now()).toBeLessThanOrEqual(thirtyDays);
  });

  it("still honors an explicit 7d choice", async () => {
    const report = await seedReport(USER_A);
    const res = await request(app)
      .post(`/api/reports/${report.id}/shares`)
      .set(auth(USER_A))
      .send({ expiresIn: "7d" });
    expect(res.status).toBe(201);
    const expiresAt = new Date(res.body.expiresAt).getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    expect(Math.abs(expiresAt - Date.now() - sevenDays)).toBeLessThan(60_000);
  });

  it("refuses to serve an expired share", async () => {
    const report = await seedReport(USER_A);
    const [share] = await db
      .insert(reportSharesTable)
      .values({
        reportId: report.id,
        userId: USER_A,
        token: "expired-token-123",
        expiresAt: new Date(Date.now() - 1000),
      })
      .returning();
    const res = await request(app).get(`/api/share/${share.token}`);
    expect(res.status).toBe(410);
  });
});

// ─── Finding #8: AI opt-out ─────────────────────────────────────────────────

describe("AI analysis opt-out", () => {
  it("persists aiOptOut on the scan record", async () => {
    const challenge = await request(app)
      .post("/api/verify/challenge")
      .set(auth(USER_A))
      .send({ hostname: "public.example" });
    txtRecords.set("_secscan-challenge.public.example", [[challenge.body.token]]);
    await request(app).post("/api/verify/confirm").set(auth(USER_A)).send({ hostname: "public.example" });

    const res = await request(app)
      .post("/api/scans")
      .set(auth(USER_A))
      .send({ targetUrl: "https://public.example/", tier: "deep", aiOptOut: true });
    expect(res.status).toBe(201);

    const rows = await db.select().from(scansTable);
    expect(rows[0]!.aiOptOut).toBe(true);
  });
});

// Quiet the unused import if schema shape differs slightly.
void usersTable;
