import { fail, ok, requireTeacher, serverError } from "@/lib/http";
import { getStore } from "@/lib/store";

/** Lets the teacher remove an inappropriate nickname or a bad entry. */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/phases/[slug]/scores/[id]">) {
  const denied = await requireTeacher();
  if (denied) return denied;
  const { slug, id } = await ctx.params;
  try {
    const removed = await getStore().deleteScore(slug, id);
    return removed ? ok({ deleted: id }) : fail("Pontuação não encontrada.", 404);
  } catch (error) {
    return serverError("delete score", error);
  }
}
