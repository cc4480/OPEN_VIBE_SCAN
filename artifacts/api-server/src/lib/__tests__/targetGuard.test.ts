/**
 * Unit tests for the target validation guard (finding #2 / #6 / #10):
 *  - structural URL checks (protocol, credentials, ports)
 *  - public-IP classification (IPv4 ranges, IPv6, mapped IPv6)
 *  - redirect revalidation: a public start URL that bounces to an internal
 *    destination must be refused.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ALLOWED_TARGET_PORTS,
  TargetValidationError,
  assertPublicResolution,
  assertTargetSafe,
  isPublicIpAddress,
  parseTargetUrl,
  resolveRedirectTarget,
  validatedFetch,
} from "../targetGuard";

vi.mock("node:dns", () => ({
  promises: {
    lookup: vi.fn(async (hostname: string) => {
      const table: Record<string, Array<{ address: string; family: number }>> = {
        "public.example": [{ address: "93.184.216.34", family: 4 }],
        "private.example": [{ address: "10.1.2.3", family: 4 }],
        "mixed.example": [
          { address: "93.184.216.34", family: 4 },
          { address: "192.168.1.9", family: 4 },
        ],
        "unresolvable.example": [],
        "cdn.example": [{ address: "151.101.1.1", family: 4 }],
      };
      if (!(hostname in table)) {
        const err = new Error(`ENOTFOUND ${hostname}`) as NodeJS.ErrnoException;
        err.code = "ENOTFOUND";
        throw err;
      }
      return table[hostname]!;
    }),
  },
}));

describe("parseTargetUrl", () => {
  it("accepts plain http/https URLs on allowlisted ports", () => {
    for (const port of ALLOWED_TARGET_PORTS) {
      const t = parseTargetUrl(`https://example.com:${port}/path`);
      expect(t.hostname).toBe("example.com");
    }
    expect(parseTargetUrl("http://example.com").hostname).toBe("example.com");
    expect(parseTargetUrl("https://EXAMPLE.com").hostname).toBe("example.com");
  });

  it("rejects non-http(s) protocols", () => {
    for (const u of ["ftp://example.com", "file:///etc/passwd", "gopher://example.com", "javascript:alert(1)"]) {
      expect(() => parseTargetUrl(u)).toThrowError(TargetValidationError);
      try {
        parseTargetUrl(u);
      } catch (e) {
        expect((e as TargetValidationError).code).toBe("bad_protocol");
      }
    }
  });

  it("rejects URLs with embedded credentials", () => {
    expect(() => parseTargetUrl("https://user:pass@example.com/")).toThrowError(
      expect.objectContaining({ code: "credentials_in_url" }),
    );
    expect(() => parseTargetUrl("https://user@example.com/")).toThrowError(
      expect.objectContaining({ code: "credentials_in_url" }),
    );
  });

  it("rejects non-allowlisted ports", () => {
    for (const p of [22, 21, 25, 3306, 6379, 9200, 27017]) {
      expect(() => parseTargetUrl(`https://example.com:${p}/`)).toThrowError(
        expect.objectContaining({ code: "port_not_allowed" }),
      );
    }
  });

  it("rejects malformed URLs", () => {
    expect(() => parseTargetUrl("not a url")).toThrowError(
      expect.objectContaining({ code: "bad_url" }),
    );
  });
});

describe("isPublicIpAddress", () => {
  const privateV4 = [
    "10.0.0.1", "10.255.255.255",
    "172.16.0.1", "172.31.255.255",
    "192.168.1.1",
    "127.0.0.1", "127.1.2.3",
    "169.254.169.254",
    "0.0.0.0",
    "100.64.0.1",
    "192.0.2.1", "198.51.100.7", "203.0.113.9",
    "224.0.0.1", "240.0.0.1", "255.255.255.255",
  ];
  const publicV4 = ["8.8.8.8", "1.1.1.1", "93.184.216.34", "172.15.0.1", "172.32.0.1", "11.0.0.1"];

  it.each(privateV4)("rejects non-public IPv4 %s", (ip) => {
    expect(isPublicIpAddress(ip)).toBe(false);
  });
  it.each(publicV4)("accepts public IPv4 %s", (ip) => {
    expect(isPublicIpAddress(ip)).toBe(true);
  });

  it("rejects IPv6 loopback, link-local, unique-local, multicast, documentation", () => {
    for (const ip of ["::1", "fe80::1", "fc00::1", "fd12:3456::1", "ff02::1", "2001:db8::1"]) {
      expect(isPublicIpAddress(ip)).toBe(false);
    }
  });

  it("accepts public IPv6", () => {
    expect(isPublicIpAddress("2606:4700:4700::1111")).toBe(true);
    expect(isPublicIpAddress("2001:4860:4860::8888")).toBe(true);
  });

  it("classifies IPv4-mapped IPv6 by the embedded address", () => {
    expect(isPublicIpAddress("::ffff:8.8.8.8")).toBe(true);
    expect(isPublicIpAddress("::ffff:10.0.0.1")).toBe(false);
    expect(isPublicIpAddress("::ffff:127.0.0.1")).toBe(false);
  });

  it("fails closed on garbage", () => {
    expect(isPublicIpAddress("999.1.1.1")).toBe(false);
    expect(isPublicIpAddress("not-an-ip")).toBe(false);
  });
});

describe("assertPublicResolution", () => {
  beforeEach(() => vi.clearAllMocks());

  it("accepts IP literals that are public", async () => {
    await expect(assertPublicResolution("8.8.8.8")).resolves.toEqual(["8.8.8.8"]);
  });

  it("rejects IP literals that are private (no DNS needed)", async () => {
    await expect(assertPublicResolution("127.0.0.1")).rejects.toMatchObject({ code: "private_ip" });
    await expect(assertPublicResolution("169.254.169.254")).rejects.toMatchObject({ code: "private_ip" });
    await expect(assertPublicResolution("[::1]")).rejects.toMatchObject({ code: "private_ip" });
  });

  it("accepts hostnames resolving to public IPs", async () => {
    await expect(assertPublicResolution("public.example")).resolves.toEqual(["93.184.216.34"]);
  });

  it("rejects hostnames resolving to private IPs", async () => {
    await expect(assertPublicResolution("private.example")).rejects.toMatchObject({ code: "private_ip" });
  });

  it("rejects hostnames where ANY resolved address is private", async () => {
    await expect(assertPublicResolution("mixed.example")).rejects.toMatchObject({ code: "private_ip" });
  });

  it("fails closed when DNS fails", async () => {
    await expect(assertPublicResolution("nxdomain.invalid")).rejects.toMatchObject({ code: "dns_failed" });
  });
});

describe("assertTargetSafe", () => {
  it("accepts a public target end to end", async () => {
    const t = await assertTargetSafe("https://public.example/scan");
    expect(t.hostname).toBe("public.example");
  });

  it("rejects SSRF-shaped targets", async () => {
    await expect(assertTargetSafe("http://169.254.169.254:8080/latest/meta-data/")).rejects.toMatchObject({
      code: "private_ip",
    });
    await expect(assertTargetSafe("https://user:secret@public.example/")).rejects.toMatchObject({
      code: "credentials_in_url",
    });
    await expect(assertTargetSafe("ftp://public.example/")).rejects.toMatchObject({ code: "bad_protocol" });
  });
});

describe("resolveRedirectTarget (redirect revalidation)", () => {
  const current = new URL("https://public.example/start");

  it("follows a relative redirect that stays on the public host", async () => {
    const next = await resolveRedirectTarget(current, "/other");
    expect(next.toString()).toBe("https://public.example/other");
  });

  it("follows an absolute redirect to another public host", async () => {
    const next = await resolveRedirectTarget(current, "https://cdn.example/x");
    expect(next.hostname).toBe("cdn.example");
  });

  it("refuses a redirect to a private IP literal", async () => {
    await expect(resolveRedirectTarget(current, "http://127.0.0.1:8080/evil")).rejects.toMatchObject({
      code: "private_ip",
    });
    await expect(resolveRedirectTarget(current, "http://169.254.169.254/latest/")).rejects.toMatchObject({
      code: "private_ip",
    });
    await expect(resolveRedirectTarget(current, "http://[::1]/")).rejects.toMatchObject({
      code: "private_ip",
    });
  });

  it("refuses a redirect to a hostname resolving to a private IP", async () => {
    await expect(resolveRedirectTarget(current, "https://private.example/")).rejects.toMatchObject({
      code: "private_ip",
    });
    await expect(resolveRedirectTarget(current, "https://mixed.example/")).rejects.toMatchObject({
      code: "private_ip",
    });
  });

  it("refuses a redirect carrying credentials or a bad protocol", async () => {
    await expect(resolveRedirectTarget(current, "https://user:pw@public.example/")).rejects.toMatchObject({
      code: "credentials_in_url",
    });
    await expect(resolveRedirectTarget(current, "ftp://public.example/x")).rejects.toMatchObject({
      code: "bad_protocol",
    });
  });

  it("refuses a redirect to a disallowed port", async () => {
    await expect(resolveRedirectTarget(current, "https://public.example:22/")).rejects.toMatchObject({
      code: "port_not_allowed",
    });
  });

  it("refuses an invalid redirect location", async () => {
    await expect(resolveRedirectTarget(current, "http://exa mple.com/")).rejects.toBeInstanceOf(
      TargetValidationError,
    );
  });
});

describe("validatedFetch", () => {
  it("refuses to talk to private IPs at all", async () => {
    await expect(validatedFetch("http://127.0.0.1:8080/", {}, { timeoutMs: 1_000 })).rejects.toMatchObject({
      code: "private_ip",
    });
  });

  it("rejects a structurally invalid target before any network access", async () => {
    await expect(validatedFetch("ftp://public.example/", {}, { timeoutMs: 1_000 })).rejects.toMatchObject({
      code: "bad_protocol",
    });
  });
});
