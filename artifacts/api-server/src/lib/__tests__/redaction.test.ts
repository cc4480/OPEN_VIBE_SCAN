/**
 * Unit tests for AI evidence redaction (finding #8):
 * secrets, tokens, auth headers, and high-entropy blobs must never reach
 * the third-party AI provider in scan evidence.
 */
import { describe, it, expect } from "vitest";
import { redactSensitiveEvidence } from "../deepseek";

describe("redactSensitiveEvidence", () => {
  it("redacts named secrets", () => {
    expect(redactSensitiveEvidence('password: hunter2')).toContain("password=[REDACTED]");
    expect(redactSensitiveEvidence('api_key="sk-live-abc123"')).toContain("api_key=[REDACTED]");
    expect(redactSensitiveEvidence("token=abc123")).toContain("token=[REDACTED]");
    expect(redactSensitiveEvidence("Authorization: Bearer xyz")).not.toContain("xyz");
  });

  it("redacts authorization and cookie headers", () => {
    const out = redactSensitiveEvidence("authorization: Bearer dXNlcjpwYXNz\ncookie: session=abc123;");
    expect(out).toContain("authorization: [REDACTED]");
    expect(out).not.toContain("dXNlcjpwYXNz");
  });

  it("redacts high-entropy blobs but keeps prose", () => {
    const blob = "ghp_" + "aB3dE5fG7hJ9kL2mN4pQ6rS8tU0vW1xY3z";
    expect(redactSensitiveEvidence(`key ${blob} leaked`)).toContain("[REDACTED]");
    const prose = "The server responded with status 200 and a JSON body";
    expect(redactSensitiveEvidence(prose)).toBe(prose);
  });

  it("leaves short readable words alone", () => {
    expect(redactSensitiveEvidence("header X-Frame-Options missing")).toBe(
      "header X-Frame-Options missing",
    );
  });

  it("is idempotent", () => {
    const once = redactSensitiveEvidence("token=supersecretvalue123 secret hunter2");
    expect(redactSensitiveEvidence(once)).toBe(once);
  });
});
