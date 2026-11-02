import { cookies } from "next/headers";
import { checkPassword, createSessionToken, getTeacherPassword, SESSION_COOKIE, SESSION_TTL_MS } from "@/lib/auth";
import { fail, ok, readJson, serverError } from "@/lib/http";
import { clientIp, createRateLimiter } from "@/lib/rateLimit";
import { firstIssue, loginSchema } from "@/lib/schemas";

const LOGIN_ATTEMPTS_PER_WINDOW = 8;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const limiter = createRateLimiter(LOGIN_ATTEMPTS_PER_WINDOW, LOGIN_WINDOW_MS);

export async function POST(request: Request) {
  const limit = limiter(clientIp(request));
  if (!limit.allowed) {
    return fail(`Muitas tentativas. Aguarde ${Math.ceil(limit.retryAfterSec / 60)} min.`, 429, {
      "Retry-After": String(limit.retryAfterSec),
    });
  }

  const parsed = loginSchema.safeParse(await readJson(request));
  if (!parsed.success) return fail(firstIssue(parsed.error));

  if (!getTeacherPassword()) return fail("Senha do professor não configurada no servidor (TEACHER_PASSWORD).", 503);
  if (!checkPassword(parsed.data.password)) return fail("Senha incorreta.", 401);

  try {
    const store = await cookies();
    store.set(SESSION_COOKIE, createSessionToken(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: Math.floor(SESSION_TTL_MS / 1000),
    });
    return ok({ loggedIn: true });
  } catch (error) {
    return serverError("login", error);
  }
}
