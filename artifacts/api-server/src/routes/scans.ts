import { Router, type IRouter } from "express";
import { db, scansTable, reportsTable, creditsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import {
  CreateScanBody,
  ListScansResponseItem,
  GetScanStatusResponse,
} from "@workspace/api-zod";
import { stripe, PRICE_MAP, getOrigin } from "../lib/stripe";
import { enqueueScan } from "../lib/queue";
import { assertTargetSafe, TargetValidationError } from "../lib/targetGuard";
import {
  isVerified,
  issueChallenge,
} from "../lib/verification";
import { rateLimit } from "../middlewares/rateLimit";

const router: IRouter = Router();

/**
 * Scan creation is the most abuse-sensitive endpoint: each request can turn
 * into outbound scanning traffic. Limit to 10 creations per user per hour
 * (bursts of legitimate use stay well under this).
 */
const createScanLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too many scan requests. Please wait before creating another scan.",
});

/** CreateScanBody plus the AI-analysis opt-out (kept in sync with the
 *  generated CreateScanBody / CreateScanRequest until the orval spec is
 *  regenerated). */
const CreateScanBodyExtended = CreateScanBody.extend({
  aiOptOut: z.boolean().optional(),
});

const STATUS_PROGRESS: Record<string, number> = {
  pending: 0,
  paid: 10,
  queued: 20,
  scanning: 55,
  analyzing: 80,
  complete: 100,
  failed: 0,
};

router.get("/scans", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const scans = await db
      .select()
      .from(scansTable)
      .where(eq(scansTable.userId, req.user.id))
      .orderBy(desc(scansTable.createdAt));

    const scansWithReports = await Promise.all(
      scans.map(async (scan) => {
        if (scan.status !== "complete") {
          return { ...scan, reportId: null };
        }
        const [report] = await db
          .select({ id: reportsTable.id })
          .from(reportsTable)
          .where(eq(reportsTable.scanId, scan.id));
        return { ...scan, reportId: report?.id ?? null };
      }),
    );

    res.json(
      scansWithReports.map((s) =>
        ListScansResponseItem.parse({
          id: s.id,
          userId: s.userId,
          userEmail: s.userEmail,
          targetUrl: s.targetUrl,
          tier: s.tier,
          status: s.status,
          stripeSessionId: s.stripeSessionId ?? null,
          stripePaymentIntentId: s.stripePaymentIntentId ?? null,
          createdAt: s.createdAt,
          startedAt: s.startedAt ?? null,
          completedAt: s.completedAt ?? null,
          error: s.error ?? null,
          reportId: s.reportId ?? null,
        }),
      ),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list scans");
    res.status(500).json({ error: "Failed to list scans" });
  }
});

router.post("/scans", createScanLimiter, async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateScanBodyExtended.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { targetUrl, tier, aiOptOut } = parsed.data;

  const isPack = tier === "pack_5" || tier === "pack_20";
  const paymentsDisabled = process.env.DISABLE_PAYMENTS === "true";

  // ── Target safety gate (scan tiers only) ─────────────────────────────
  // 1. Structural + SSRF checks: http(s), no credentials, allowlisted port,
  //    and the hostname must resolve entirely to public IPs.
  // 2. Ownership: the requester must have verified the hostname via a DNS
  //    TXT challenge. No verification → no scan, no queue entry.
  if (!isPack) {
    let hostname: string;
    try {
      const target = await assertTargetSafe(targetUrl);
      hostname = target.hostname;
    } catch (err) {
      if (err instanceof TargetValidationError) {
        res.status(400).json({ error: err.message, code: err.code });
      } else {
        res.status(400).json({ error: "Invalid target URL." });
      }
      return;
    }

    let verified = false;
    try {
      verified = await isVerified(req.user.id, hostname);
    } catch (err) {
      req.log.error({ err }, "Verification lookup failed");
      res.status(500).json({ error: "Could not check target verification." });
      return;
    }

    if (!verified) {
      // Issue (or reuse) a challenge so the response tells the user exactly
      // what DNS record to add.
      const challenge = await issueChallenge(req.user.id, hostname).catch(() => null);
      res.status(403).json({
        error:
          "This target has not been verified. Add the DNS TXT record below to prove you control it, then try again.",
        code: "TARGET_NOT_VERIFIED",
        verification: challenge,
      });
      return;
    }
  }

  // ── Free mode: payments disabled or Stripe not configured ───────────
  if ((paymentsDisabled || !stripe) && !isPack) {
    const [scan] = await db
      .insert(scansTable)
      .values({
        userId: req.user.id,
        userEmail: req.user.email ?? "",
        targetUrl,
        tier,
        status: "paid",
        aiOptOut: aiOptOut ?? false,
      })
      .returning();

    await enqueueScan({ scanId: scan.id, userId: req.user.id, targetUrl, tier, aiOptOut: aiOptOut ?? false });

    await db
      .update(scansTable)
      .set({ status: "queued", startedAt: new Date() })
      .where(eq(scansTable.id, scan.id));

    res.status(201).json({ scanId: scan.id, checkoutUrl: null, creditUsed: false });
    return;
  }

  // ── Pack: free credits when payments are disabled or Stripe absent ──
  if ((paymentsDisabled || !stripe) && isPack) {
    // In test mode, add 5 or 20 credits directly without payment
    const creditsToAdd = tier === "pack_5" ? 5 : 20;
    const [existing] = await db
      .select()
      .from(creditsTable)
      .where(eq(creditsTable.userId, req.user.id));
    if (existing) {
      await db
        .update(creditsTable)
        .set({ balance: existing.balance + creditsToAdd })
        .where(eq(creditsTable.userId, req.user.id));
    } else {
      await db.insert(creditsTable).values({ userId: req.user.id, balance: creditsToAdd });
    }
    res.status(201).json({ scanId: null, checkoutUrl: null, creditUsed: false });
    return;
  }

  // For pack purchases: create a Stripe checkout for credits only (no scan record)
  if (isPack) {
    if (!stripe) {
      res.status(503).json({ error: "Payment processing is not configured" });
      return;
    }

    const priceConfig = PRICE_MAP[tier];
    const origin = getOrigin(req);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: priceConfig.amount,
            product_data: {
              name: priceConfig.name,
              description: priceConfig.description,
            },
          },
        },
      ],
      metadata: {
        type: "credits",
        tier,
        user_id: req.user.id,
      },
      success_url: `${origin}/dashboard?credits=purchased`,
      cancel_url: `${origin}/scan`,
    });

    res.status(201).json({
      scanId: null,
      checkoutUrl: session.url,
      creditUsed: false,
    });
    return;
  }

  // Check for available credits (only for scan tiers)
  const [credit] = await db
    .select()
    .from(creditsTable)
    .where(eq(creditsTable.userId, req.user.id));

  const hasCredits = credit && credit.balance > 0;

  // Create the scan record
  const [scan] = await db
    .insert(scansTable)
    .values({
      userId: req.user.id,
      userEmail: req.user.email ?? "",
      targetUrl,
      tier,
      status: "pending",
      aiOptOut: aiOptOut ?? false,
    })
    .returning();

  // Use a credit if available
  if (hasCredits) {
    await db
      .update(creditsTable)
      .set({ balance: credit.balance - 1 })
      .where(eq(creditsTable.userId, req.user.id));

    // pending → paid → queued
    await db
      .update(scansTable)
      .set({ status: "paid" })
      .where(eq(scansTable.id, scan.id));

    await enqueueScan({
      scanId: scan.id,
      userId: req.user.id,
      targetUrl,
      tier,
      aiOptOut: aiOptOut ?? false,
    });

    await db
      .update(scansTable)
      .set({ status: "queued", startedAt: new Date() })
      .where(eq(scansTable.id, scan.id));

    res.status(201).json({
      scanId: scan.id,
      checkoutUrl: null,
      creditUsed: true,
    });
    return;
  }

  // No credits — create Stripe checkout session
  if (!stripe) {
    res.status(503).json({ error: "Payment processing is not configured. Please contact support." });
    return;
  }

  const priceConfig = PRICE_MAP[tier];
  const origin = getOrigin(req);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: priceConfig.amount,
          product_data: {
            name: priceConfig.name,
            description: `Target: ${targetUrl}`,
          },
        },
      },
    ],
    metadata: {
      type: "scan",
      scan_id: scan.id,
      user_id: req.user.id,
      target_url: targetUrl,
      tier,
    },
    payment_intent_data: {
      metadata: {
        type: "scan",
        scan_id: scan.id,
        user_id: req.user.id,
        tier,
      },
    },
    success_url: `${origin}/dashboard?scan=${scan.id}`,
    cancel_url: `${origin}/scan`,
  });

  // Save the Stripe session ID on the scan
  await db
    .update(scansTable)
    .set({ stripeSessionId: session.id })
    .where(eq(scansTable.id, scan.id));

  res.status(201).json({
    scanId: scan.id,
    checkoutUrl: session.url,
    creditUsed: false,
  });
});

router.get("/scans/:id/status", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [scan] = await db
    .select()
    .from(scansTable)
    .where(and(eq(scansTable.id, rawId), eq(scansTable.userId, req.user.id)));

  if (!scan) {
    res.status(404).json({ error: "Scan not found" });
    return;
  }

  let reportId: string | null = null;
  let grade: string | null = null;
  if (scan.status === "complete") {
    const [report] = await db
      .select({ id: reportsTable.id, data: reportsTable.data })
      .from(reportsTable)
      .where(eq(reportsTable.scanId, scan.id));
    reportId = report?.id ?? null;
    const reportData = report?.data as { summary?: { grade?: string } } | undefined;
    grade = reportData?.summary?.grade ?? null;
  }

  res.json(
    GetScanStatusResponse.parse({
      id: scan.id,
      targetUrl: scan.targetUrl,
      tier: scan.tier,
      status: scan.status,
      progress: STATUS_PROGRESS[scan.status] ?? 0,
      createdAt: scan.createdAt,
      startedAt: scan.startedAt ?? null,
      completedAt: scan.completedAt ?? null,
      error: scan.error ?? null,
      reportId,
      grade,
      steps: (scan.steps as unknown[] | null) ?? null,
    }),
  );
});

export default router;
