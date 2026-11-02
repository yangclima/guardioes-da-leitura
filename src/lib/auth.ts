import { cookies } from "next/headers";
import { safeEqual, signPayload, verifyPayload } from "./crypto";

export const SESSION_COOKIE = "prof_session";
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const DEV_PASSWORD = "professor";

interface SessionPayload {
  role: "teacher";
  exp: number;
}

/** Teacher password from env. In development falls back to "professor". */
export function getTeacherPassword(): string | null {
  const password = process.env.TEACHER_PASSWORD;
  if (password && password.length > 0) return password;
  return process.env.NODE_ENV === "production" ? null : DEV_PASSWORD;
}

export function checkPassword(attempt: string, expected: string | null = getTeacherPassword()): boolean {
  if (!expected) return false;
  return safeEqual(attempt, expected);
}

export function createSessionToken(now: number = Date.now(), secret?: string): string {
  const payload: SessionPayload = { role: "teacher", exp: now + SESSION_TTL_MS };
  return signPayload(payload, secret);
}

export function isValidSessionToken(token: string | undefined, now: number = Date.now(), secret?: string): boolean {
  if (!token) return false;
  const payload = verifyPayload<SessionPayload>(token, secret);
  return payload?.role === "teacher" && typeof payload.exp === "number" && payload.exp > now;
}

/** For server components and route handlers. */
export async function isTeacher(): Promise<boolean> {
  const store = await cookies();
  return isValidSessionToken(store.get(SESSION_COOKIE)?.value);
}
