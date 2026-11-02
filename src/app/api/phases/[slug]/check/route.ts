import { fail, ok, readJson, serverError } from "@/lib/http";
import { readRunToken } from "@/lib/runToken";
import { answerCheckSchema, firstIssue } from "@/lib/schemas";
import { getStore } from "@/lib/store";

/** Tells the player if an answer is right, so the key never ships to the browser. */
export async function POST(request: Request, ctx: RouteContext<"/api/phases/[slug]/check">) {
  const { slug } = await ctx.params;
  const parsed = answerCheckSchema.safeParse(await readJson(request));
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const run = readRunToken(parsed.data.runToken, slug);
  if (!run.ok) return fail(run.error, 403);

  try {
    const phase = await getStore().getPhase(slug);
    if (!phase) return fail("Fase não encontrada.", 404);
    const question = phase.questions.find((q) => q.id === parsed.data.questionId);
    if (!question) return fail("Questão não encontrada. A fase pode ter sido alterada.", 404);
    return ok({
      correct: parsed.data.choice === question.correctIndex,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
    });
  } catch (error) {
    return serverError("check answer", error);
  }
}
