import { describe, expect, it } from "vitest";
import { checkPassword, createSessionToken, isValidSessionToken, SESSION_TTL_MS } from "@/lib/auth";
import { signPayload, verifyPayload } from "@/lib/crypto";
import { createRateLimiter } from "@/lib/rateLimit";
import { createRunToken, MAX_RUN_MS, readRunToken } from "@/lib/runToken";

const SECRET = "test-secret-with-enough-length";

describe("signed payloads", () => {
  it("round-trips and rejects tampering or a different secret", () => {
    const token = signPayload({ a: 1 }, SECRET);
    expect(verifyPayload(token, SECRET)).toEqual({ a: 1 });
    const [body, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ a: 2 })).toString("base64url");
    expect(verifyPayload(`${forged}.${sig}`, SECRET)).toBeNull();
    expect(verifyPayload(`${body}.${sig}`, "another-secret-1234567")).toBeNull();
    expect(verifyPayload("garbage", SECRET)).toBeNull();
  });
});

describe("teacher session", () => {
  it("accepts the right password only", () => {
    expect(checkPassword("segredo", "segredo")).toBe(true);
    expect(checkPassword("segred", "segredo")).toBe(false);
    expect(checkPassword("x", null)).toBe(false);
  });

  it("expires sessions", () => {
    const now = 1_000_000;
    const token = createSessionToken(now, SECRET);
    expect(isValidSessionToken(token, now + 1000, SECRET)).toBe(true);
    expect(isValidSessionToken(token, now + SESSION_TTL_MS + 1, SECRET)).toBe(false);
    expect(isValidSessionToken(undefined, now, SECRET)).toBe(false);
  });
});

describe("run token", () => {
  it("is bound to its phase and expires", () => {
    const now = 5_000_000;
    const token = createRunToken("fase-1", now, SECRET);
    const ok = readRunToken(token, "fase-1", now + 10_000, SECRET);
    expect(ok.ok && ok.run.startedAt).toBe(now);
    expect(readRunToken(token, "fase-2", now, SECRET).ok).toBe(false);
    expect(readRunToken(token, "fase-1", now + MAX_RUN_MS + 1, SECRET).ok).toBe(false);
    expect(readRunToken("bad.token.value", "fase-1", now, SECRET).ok).toBe(false);
  });
});

describe("rate limiter", () => {
  it("blocks after the limit and resets after the window", () => {
    const hit = createRateLimiter(2, 1000);
    expect(hit("ip", 0).allowed).toBe(true);
    expect(hit("ip", 1).allowed).toBe(true);
    const blocked = hit("ip", 2);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBe(1);
    expect(hit("ip", 1001).allowed).toBe(true);
    expect(hit("other", 2).allowed).toBe(true);
  });
});
