/**
 * DNS ownership verification endpoints.
 *
 *   POST /api/verify/challenge  { hostname } -> challenge + TXT instructions
 *   POST /api/verify/confirm    { hostname } -> { verified, expiresAt }
 *   GET  /api/verify/status?hostname=...
 */

import { Router, type Request, type Response, type IRouter } from "express";
import { z } from "zod";
import {
  issueChallenge,
  confirmChallenge,
  isVerified,
  normalizeHostname,
  challengeTxtName,
} from "../lib/verification";
import { rateLimit } from "../middlewares/rateLimit";

const router: IRouter = Router();

const HostnameBody = z.object({ hostname: z.string().min(1).max(253) });

// Stricter than the scan endpoints — verification is cheap to retry but the
// confirm path does outbound DNS, so keep abuse value low.
const verifyLimiter = rateLimit({ windowMs: 60_000, max: 20 });

router.post("/verify/challenge", verifyLimiter, async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  const parsed = HostnameBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "hostname is required." });
    return;
  }
  try {
    const challenge = await issueChallenge(req.user.id, parsed.data.hostname);
    res.json(challenge);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.post("/verify/confirm", verifyLimiter, async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  const parsed = HostnameBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "hostname is required." });
    return;
  }
  try {
    const result = await confirmChallenge(req.user.id, parsed.data.hostname);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.get("/verify/status", verifyLimiter, async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  const hostname = typeof req.query.hostname === "string" ? req.query.hostname : "";
  let normalized: string;
  try {
    normalized = normalizeHostname(hostname);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
    return;
  }
  const verified = await isVerified(req.user.id, normalized);
  res.json({ hostname: normalized, verified, txtName: challengeTxtName(normalized) });
});

export default router;
