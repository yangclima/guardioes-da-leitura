import { isTeacher } from "@/lib/auth";
import { fail, ok, readJson, requireTeacher, serverError } from "@/lib/http";
import { buildPhase, sortPhases } from "@/lib/phases";
import { firstIssue, phaseInputSchema } from "@/lib/schemas";
import { getStore } from "@/lib/store";

export async function GET() {
  try {
    const phases = sortPhases(await getStore().listPhases());
    if (await isTeacher()) return ok(phases);
    const visible = phases
      .filter((p) => p.active)
      .map(({ slug, title, description, theme, mode, difficulty, questions }) => ({
        slug,
        title,
        description,
        theme,
        mode,
        difficulty,
        questionCount: questions.length,
      }));
    return ok(visible);
  } catch (error) {
    return serverError("list phases", error);
  }
}

export async function POST(request: Request) {
  const denied = await requireTeacher();
  if (denied) return denied;

  const parsed = phaseInputSchema.safeParse(await readJson(request));
  if (!parsed.success) return fail(firstIssue(parsed.error));

  try {
    const store = getStore();
    if (await store.getPhase(parsed.data.slug)) {
      return fail(`Já existe uma fase com o endereço “${parsed.data.slug}”.`, 409);
    }
    const phase = buildPhase(parsed.data, null);
    await store.savePhase(phase);
    return ok(phase, 201);
  } catch (error) {
    return serverError("create phase", error);
  }
}
