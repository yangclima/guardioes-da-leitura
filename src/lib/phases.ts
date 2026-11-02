import { randomId } from "./crypto";
import type { PhaseInput } from "./schemas";
import type { Phase, PublicPhase, Question } from "./types";

/** Builds a stored phase from validated input, keeping ids and creation date of an existing one. */
export function buildPhase(input: PhaseInput, existing: Phase | null, now: Date = new Date()): Phase {
  const usedIds = new Set<string>();
  const questions: Question[] = input.questions.map((q) => {
    let id = q.id && !usedIds.has(q.id) ? q.id : randomId(6);
    while (usedIds.has(id)) id = randomId(6);
    usedIds.add(id);
    return {
      id,
      descriptor: q.descriptor,
      supportText: q.supportText,
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
    };
  });
  return {
    slug: input.slug,
    title: input.title,
    description: input.description,
    theme: input.theme,
    mode: input.mode,
    difficulty: input.difficulty,
    hearts: input.hearts,
    active: input.active,
    questions,
    createdAt: existing?.createdAt ?? now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

/** Strips the answer key before sending a phase to players. */
export function toPublicPhase(phase: Phase): PublicPhase {
  return {
    ...phase,
    questions: phase.questions.map(({ id, descriptor, supportText, prompt, options }) => ({
      id,
      descriptor,
      supportText,
      prompt,
      options,
    })),
  };
}

export function sortPhases(phases: readonly Phase[]): Phase[] {
  return [...phases].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
