/**
 * DNS ownership verification.
 *
 * Flow:
 *   1. `issueChallenge(userId, hostname)` — creates (or reuses) a pending
 *      challenge row and returns the token the user must publish.
 *   2. The user adds a TXT record `_secscan-challenge.<hostname>` = token.
 *   3. `confirmChallenge(userId, hostname)` — reads the TXT record and marks
 *      the hostname verified for VERIFICATION_TTL_MS.
 *   4. `isVerified(userId, hostname)` — gate check used by scan intake.
 *
 * Hostnames are stored lower-cased and matched exactly.
 */

import { promises as dns } from "node:dns";
import { randomBytes } from "node:crypto";
import { db, domainVerificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { parseTargetUrl, assertTargetSafe, TargetValidationError } from "./targetGuard";

export const CHALLENGE_LABEL = "_secscan-challenge";
/** How long a completed verification stays valid before re-verification. */
export const VERIFICATION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function challengeTxtName(hostname: string): string {
  return `${CHALLENGE_LABEL}.${hostname}`;
}

export function verificationInstructions(hostname: string, token: string): string {
  const name = challengeTxtName(hostname);
  return (
    `Add a DNS TXT record to prove you control ${hostname}:\n` +
    `Name: ${name}\nValue: ${token}\n\n` +
    `Then confirm the verification. It stays valid for 30 days.`
  );
}

/** Normalize and validate a hostname supplied for verification. */
export function normalizeHostname(raw: string): string {
  const hostname = raw.trim().toLowerCase();
  if (!hostname || hostname.length > 253) {
    throw new Error("Invalid hostname.");
  }
  // Must look like a DNS name (not an IP literal, no userinfo/ports/paths).
  if (/[/:?#@]/.test(hostname)) {
    throw new Error("Hostname must be a plain DNS name, e.g. example.com.");
  }
  if (!/^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(hostname)) {
    throw new Error("Invalid hostname.");
  }
  return hostname;
}

/** Extract the hostname from a scan target URL. */
export function hostnameFromTargetUrl(targetUrl: string): string {
  return parseTargetUrl(targetUrl).hostname;
}

export interface Challenge {
  hostname: string;
  token: string;
  txtName: string;
  instructions: string;
  status: "pending" | "verified";
  expiresAt: string | null;
}

export async function issueChallenge(userId: string, rawHostname: string): Promise<Challenge> {
  const hostname = normalizeHostname(rawHostname);

  const [existing] = await db
    .select()
    .from(domainVerificationsTable)
    .where(
      and(
        eq(domainVerificationsTable.userId, userId),
        eq(domainVerificationsTable.hostname, hostname),
      ),
    );

  // Reuse a still-valid verification instead of issuing a new challenge.
  if (existing && existing.status === "verified" && existing.expiresAt && existing.expiresAt > new Date()) {
    return {
      hostname,
      token: existing.token,
      txtName: challengeTxtName(hostname),
      instructions: verificationInstructions(hostname, existing.token),
      status: "verified",
      expiresAt: existing.expiresAt.toISOString(),
    };
  }

  const token = randomBytes(24).toString("hex");

  if (existing) {
    await db
      .update(domainVerificationsTable)
      .set({ token, status: "pending", verifiedAt: null, expiresAt: null })
      .where(eq(domainVerificationsTable.id, existing.id));
  } else {
    await db.insert(domainVerificationsTable).values({ userId, hostname, token, status: "pending" });
  }

  return {
    hostname,
    token,
    txtName: challengeTxtName(hostname),
    instructions: verificationInstructions(hostname, token),
    status: "pending",
    expiresAt: null,
  };
}

async function txtRecordContainsToken(hostname: string, token: string): Promise<boolean> {
  const name = challengeTxtName(hostname);
  let records: string[][];
  try {
    records = await dns.resolveTxt(name);
  } catch {
    return false; // No TXT record (yet) — not verified.
  }
  return records.some((chunks) => chunks.join("").trim() === token);
}

export async function confirmChallenge(
  userId: string,
  rawHostname: string,
): Promise<{ verified: boolean; expiresAt: string | null; challenge: Challenge }> {
  const hostname = normalizeHostname(rawHostname);

  const [row] = await db
    .select()
    .from(domainVerificationsTable)
    .where(
      and(
        eq(domainVerificationsTable.userId, userId),
        eq(domainVerificationsTable.hostname, hostname),
      ),
    );

  if (!row) {
    // No challenge issued yet — issue one so the caller gets instructions.
    const challenge = await issueChallenge(userId, hostname);
    return { verified: false, expiresAt: null, challenge };
  }

  if (row.status === "verified" && row.expiresAt && row.expiresAt > new Date()) {
    return {
      verified: true,
      expiresAt: row.expiresAt.toISOString(),
      challenge: {
        hostname,
        token: row.token,
        txtName: challengeTxtName(hostname),
        instructions: verificationInstructions(hostname, row.token),
        status: "verified",
        expiresAt: row.expiresAt.toISOString(),
      },
    };
  }

  const found = await txtRecordContainsToken(hostname, row.token);
  if (!found) {
    return {
      verified: false,
      expiresAt: null,
      challenge: {
        hostname,
        token: row.token,
        txtName: challengeTxtName(hostname),
        instructions: verificationInstructions(hostname, row.token),
        status: "pending",
        expiresAt: null,
      },
    };
  }

  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);
  await db
    .update(domainVerificationsTable)
    .set({ status: "verified", verifiedAt: new Date(), expiresAt })
    .where(eq(domainVerificationsTable.id, row.id));

  return {
    verified: true,
    expiresAt: expiresAt.toISOString(),
    challenge: {
      hostname,
      token: row.token,
      txtName: challengeTxtName(hostname),
      instructions: verificationInstructions(hostname, row.token),
      status: "verified",
      expiresAt: expiresAt.toISOString(),
    },
  };
}

/** Gate check: has this user verified this hostname within the TTL? */
export async function isVerified(userId: string, hostname: string): Promise<boolean> {
  const [row] = await db
    .select({ status: domainVerificationsTable.status, expiresAt: domainVerificationsTable.expiresAt })
    .from(domainVerificationsTable)
    .where(
      and(
        eq(domainVerificationsTable.userId, userId),
        eq(domainVerificationsTable.hostname, hostname),
      ),
    );
  return !!row && row.status === "verified" && !!row.expiresAt && row.expiresAt > new Date();
}

export type TargetGateResult = { ok: true } | { ok: false; reason: string };

/**
 * Full pre-scan gate used by background enqueue paths (worker pre-flight,
 * monitor scheduler): the target must be structurally safe, resolve only to
 * public IPs, and be DNS-verified by the requesting user.
 */
export async function checkTargetGate(userId: string, targetUrl: string): Promise<TargetGateResult> {
  let hostname: string;
  try {
    hostname = (await assertTargetSafe(targetUrl)).hostname;
  } catch (err) {
    const reason = err instanceof TargetValidationError ? err.message : "Invalid target URL.";
    return { ok: false, reason };
  }
  if (!(await isVerified(userId, hostname))) {
    return { ok: false, reason: `Target ${hostname} is not verified for this user.` };
  }
  return { ok: true };
}
