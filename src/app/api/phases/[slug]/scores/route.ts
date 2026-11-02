import { isTeacher } from "@/lib/auth";
import { randomId } from "@/lib/crypto";
import { fail, ok, readJson, serverError } from "@/lib/http";
import { phaseRanking, positionOfNickname } from "@/lib/ranking";
import { clientIp, createRateLimiter } from "@/lib/rateLimit";
import { MAX_RUN_MS, readRunToken } from "@/lib/runToken";
import { firstIssue, scoreSubmissionSchema } from "@/lib/schemas";
import { computeScore } from "@/lib/scoring";
import { getStore } from "@/lib/store";
import type { ScoreEntry } from "@/lib/types";

const SUBMISSIONS_PER_WINDOW = 20;
const limiter = createRateLimiter(SUBMISSIONS_PER_WINDOW, 60 * 1000);

/** Public ranking (nicknames only). The teacher also gets every entry with full names. */
export async function GET(_request: Request, ctx: RouteContext<"/api/phases/[slug]/scores">) {
  const { slug } = await ctx.params;
  try {
    const store = getStore();
    const phase = await store.getPhase(slug);
    const teacher = await isTeacher();
    if (!phase || (!phase.active && !teacher)) return fail("Fase não encontrada.", 404);
    const entries = await store.listScores(slug);
    return ok({ ranking: phaseRanking(entries), entries: teacher ? entries : undefined });
  } catch (error) {
    return serverError("list scores", error);
  }
}

export async function POST(request: Request, ctx: RouteContext<"/api/phases/[slug]/scores">) {
  const { slug } = await ctx.params;
  if (!limiter(clientIp(request)).allowed) return fail("Muitos envios seguidos. Aguarde um minuto.", 429);

  const parsed = scoreSubmissionSchema.safeParse(await readJson(request));
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const body = parsed.data;

  const now = Date.now();
  const run = readRunToken(body.runToken, slug, now);
  if (!run.ok) return fail(run.error, 403);

  try {
    const store = getStore();
    const phase = await store.getPhase(slug);
    if (!phase || !phase.active) return fail("Fase não encontrada.", 404);

    const durationMs = now - run.run.startedAt;
    const result = computeScore(phase, { answers: body.answers, stars: body.stars, heartsLeft: body.heartsLeft, durationMs });
    if (!result.ok) return fail(result.error, 422);

    if (!(await store.claimRun(run.run.nonce, MAX_RUN_MS))) {
      return fail("Esta partida já foi registrada.", 409);
    }

    const entry: ScoreEntry = {
      id: randomId(),
      slug,
      nickname: body.nickname,
      fullName: body.fullName.replace(/\s+/g, " "),
      score: result.breakdown.score,
      correct: result.breakdown.correct,
      total: result.breakdown.total,
      stars: result.breakdown.stars,
      durationMs,
      completed: result.breakdown.completed,
      hero: body.hero,
      createdAt: new Date(now).toISOString(),
    };
    await store.addScore(entry);
    const position = positionOfNickname(await store.listScores(slug), entry.nickname);
    return ok({ breakdown: result.breakdown, position }, 201);
  } catch (error) {
    return serverError("submit score", error);
  }
}
