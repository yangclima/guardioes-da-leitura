import { randomId, signPayload, verifyPayload } from "./crypto";

/** A run can last at most this long before its score is refused. */
export const MAX_RUN_MS = 3 * 60 * 60 * 1000;

export interface RunPayload {
  slug: string;
  startedAt: number;
  nonce: string;
}

export function createRunToken(slug: string, now: number = Date.now(), secret?: string): string {
  const payload: RunPayload = { slug, startedAt: now, nonce: randomId(12) };
  return signPayload(payload, secret);
}

export type RunCheck = { ok: true; run: RunPayload } | { ok: false; error: string };

export function readRunToken(token: string, slug: string, now: number = Date.now(), secret?: string): RunCheck {
  const run = verifyPayload<RunPayload>(token, secret);
  if (!run || typeof run.startedAt !== "number" || typeof run.nonce !== "string") {
    return { ok: false, error: "Partida inválida. Recarregue a página e jogue de novo." };
  }
  if (run.slug !== slug) return { ok: false, error: "Esta partida pertence a outra fase." };
  if (run.startedAt > now + 5_000 || now - run.startedAt > MAX_RUN_MS) {
    return { ok: false, error: "Partida expirada. Jogue de novo para registrar a pontuação." };
  }
  return { ok: true, run };
}
