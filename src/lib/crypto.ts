import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const DEV_SECRET = randomBytes(32).toString("hex");
let warnedAboutSecret = false;

/** HMAC secret for sessions and run tokens. Required in production. */
export function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && (secret.length >= 16 || process.env.NODE_ENV !== "production")) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET (16+ caracteres) não configurado.");
  }
  if (!warnedAboutSecret) {
    warnedAboutSecret = true;
    console.warn("[auth] SESSION_SECRET ausente: usando segredo temporário de desenvolvimento.");
  }
  return DEV_SECRET;
}

function hmac(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Compare against itself to keep timing similar, then fail.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/** Encodes a payload as `base64url(json).signature`. */
export function signPayload(payload: object, secret: string = getSecret()): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${hmac(body, secret)}`;
}

/** Returns the decoded payload, or null when the signature does not match. */
export function verifyPayload<T>(token: string, secret: string = getSecret()): T | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!safeEqual(signature, hmac(body, secret))) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export function randomId(bytes = 9): string {
  return randomBytes(bytes).toString("base64url");
}
