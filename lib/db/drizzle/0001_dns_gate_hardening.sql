-- Delta migration: DNS ownership gate + AI opt-out (2026-09-21)
--
-- This project deploys schema via `pnpm --filter @workspace/db db:push`
-- (drizzle-kit push), which applies the schema in `src/schema/` directly.
-- This file exists so the change is reviewable and so databases that do
-- NOT use db:push can apply the delta with:
--
--   psql "$DATABASE_URL" -f 0001_dns_gate_hardening.sql
--
-- It is idempotent (safe to run twice).

-- 1. Domain ownership verifications (DNS TXT challenge)
CREATE TABLE IF NOT EXISTS "domain_verifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "hostname" text NOT NULL,
  "token" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "verified_at" timestamptz,
  "expires_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "domain_verifications_token_unique" UNIQUE("token"),
  CONSTRAINT "uq_domain_verifications_user_hostname" UNIQUE("user_id", "hostname")
);
CREATE INDEX IF NOT EXISTS "idx_domain_verifications_hostname"
  ON "domain_verifications" ("hostname");

-- 2. Per-scan opt-out of third-party AI analysis
ALTER TABLE "scans" ADD COLUMN IF NOT EXISTS "ai_opt_out" boolean DEFAULT false NOT NULL;
