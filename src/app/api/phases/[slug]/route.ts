import { isTeacher } from "@/lib/auth";
import { fail, ok, readJson, requireTeacher, serverError } from "@/lib/http";
import { buildPhase, toPublicPhase } from "@/lib/phases";
import { firstIssue, phaseInputSchema } from "@/lib/schemas";
import { getStore } from "@/lib/store";

const NOT_FOUND = "Fase não encontrada.";

export async function GET(_request: Request, ctx: RouteContext<"/api/phases/[slug]">) {
  const { slug } = await ctx.params;
  try {
    const phase = await getStore().getPhase(slug);
    const teacher = await isTeacher();
    if (!phase || (!phase.active && !teacher)) return fail(NOT_FOUND, 404);
    return ok(teacher ? phase : toPublicPhase(phase));
  } catch (error) {
    return serverError("get phase", error);
  }
}

export async function PUT(request: Request, ctx: RouteContext<"/api/phases/[slug]">) {
  const denied = await requireTeacher();
  if (denied) return denied;
  const { slug } = await ctx.params;

  const parsed = phaseInputSchema.safeParse(await readJson(request));
  if (!parsed.success) return fail(firstIssue(parsed.error));

  try {
    const store = getStore();
    const existing = await store.getPhase(slug);
    if (!existing) return fail(NOT_FOUND, 404);
    if (parsed.data.slug !== slug) {
      if (await store.getPhase(parsed.data.slug)) {
        return fail(`Já existe uma fase com o endereço “${parsed.data.slug}”.`, 409);
      }
      if ((await store.listScores(slug)).length > 0) {
        return fail("Esta fase já tem pontuações; o endereço não pode mudar.", 409);
      }
    }
    const phase = buildPhase(parsed.data, existing);
    await store.savePhase(phase);
    if (phase.slug !== slug) await store.deletePhase(slug);
    return ok(phase);
  } catch (error) {
    return serverError("update phase", error);
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/phases/[slug]">) {
  const denied = await requireTeacher();
  if (denied) return denied;
  const { slug } = await ctx.params;
  try {
    const store = getStore();
    if (!(await store.getPhase(slug))) return fail(NOT_FOUND, 404);
    await store.deletePhase(slug);
    return ok({ deleted: slug });
  } catch (error) {
    return serverError("delete phase", error);
  }
}
