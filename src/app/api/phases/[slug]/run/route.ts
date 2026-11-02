import { fail, ok, serverError } from "@/lib/http";
import { createRunToken } from "@/lib/runToken";
import { getStore } from "@/lib/store";

/** Starts a run: the signed token carries the server-side start time. */
export async function POST(_request: Request, ctx: RouteContext<"/api/phases/[slug]/run">) {
  const { slug } = await ctx.params;
  try {
    const phase = await getStore().getPhase(slug);
    if (!phase || !phase.active) return fail("Fase não encontrada.", 404);
    return ok({ runToken: createRunToken(slug) });
  } catch (error) {
    return serverError("start run", error);
  }
}
