import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { buildPhase, sortPhases, toPublicPhase } from "@/lib/phases";
import { SAMPLE_PHASE_INPUT } from "@/lib/samplePhase";
import { phaseInputSchema, scoreSubmissionSchema } from "@/lib/schemas";
import { nicknameKey, slugify } from "@/lib/slug";
import { FileStore } from "@/lib/store/fileStore";
import type { ScoreEntry } from "@/lib/types";

describe("slug helpers", () => {
  it("slugifies portuguese titles", () => {
    expect(slugify("Fase 1 – Trilha das Pistas!")).toBe("fase-1-trilha-das-pistas");
    expect(slugify("  Ação & Reação ")).toBe("acao-reacao");
    expect(nicknameKey("  JoÃo   Pé ")).toBe(nicknameKey("joao pe"));
  });
});

describe("phase validation and building", () => {
  it("accepts the sample phase", () => {
    expect(phaseInputSchema.safeParse(SAMPLE_PHASE_INPUT).success).toBe(true);
  });

  it("rejects bad slugs and a correct index outside the options", () => {
    expect(phaseInputSchema.safeParse({ ...SAMPLE_PHASE_INPUT, slug: "Fase 1" }).success).toBe(false);
    const badQuestion = { ...SAMPLE_PHASE_INPUT.questions[0], correctIndex: 7 };
    expect(phaseInputSchema.safeParse({ ...SAMPLE_PHASE_INPUT, questions: [badQuestion] }).success).toBe(false);
  });

  it("gives unique ids, keeps createdAt on edit and hides the key publicly", () => {
    const input = phaseInputSchema.parse(SAMPLE_PHASE_INPUT);
    const created = buildPhase(input, null, new Date("2026-01-01T00:00:00Z"));
    const ids = created.questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);

    const dup = { ...input, questions: input.questions.map((q) => ({ ...q, id: "same" })) };
    const edited = buildPhase(dup, created, new Date("2026-02-01T00:00:00Z"));
    expect(new Set(edited.questions.map((q) => q.id)).size).toBe(3);
    expect(edited.createdAt).toBe(created.createdAt);
    expect(edited.updatedAt).toBe("2026-02-01T00:00:00.000Z");

    const pub = toPublicPhase(created);
    expect(pub.questions[0]).not.toHaveProperty("correctIndex");
    expect(pub.questions[0]).not.toHaveProperty("explanation");
  });

  it("sorts phases by creation date", () => {
    const a = buildPhase(phaseInputSchema.parse(SAMPLE_PHASE_INPUT), null, new Date("2026-03-01"));
    const b = { ...a, slug: "b", createdAt: "2026-01-01T00:00:00.000Z" };
    expect(sortPhases([a, b]).map((p) => p.slug)).toEqual(["b", a.slug]);
  });
});

describe("score submission validation", () => {
  const base = { runToken: "x".repeat(20), fullName: "Maria Silva", nickname: "Mari_9", stars: 1, heartsLeft: 2, answers: [] };
  it("requires first and last name and a clean nickname", () => {
    expect(scoreSubmissionSchema.safeParse(base).success).toBe(true);
    expect(scoreSubmissionSchema.safeParse({ ...base, fullName: "Maria" }).success).toBe(false);
    expect(scoreSubmissionSchema.safeParse({ ...base, nickname: "<script>" }).success).toBe(false);
  });
});

describe("FileStore", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "jogo-"));
  const store = new FileStore(path.join(dir, "db.json"));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  const score = (id: string): ScoreEntry => ({
    id,
    slug: SAMPLE_PHASE_INPUT.slug,
    nickname: "n",
    fullName: "N N",
    score: 1,
    correct: 0,
    total: 3,
    stars: 0,
    durationMs: 1,
    completed: false,
    hero: "",
    createdAt: "2026-01-01",
  });

  it("stores phases and scores, handles concurrent writes and deletes", async () => {
    expect(await store.listPhases()).toEqual([]);
    const phase = buildPhase(phaseInputSchema.parse(SAMPLE_PHASE_INPUT), null);
    await store.savePhase(phase);
    expect((await store.getPhase(phase.slug))?.title).toBe(phase.title);

    await Promise.all(["a", "b", "c", "d"].map((id) => store.addScore(score(id))));
    expect((await store.listScores(phase.slug)).map((s) => s.id).sort()).toEqual(["a", "b", "c", "d"]);

    expect(await store.deleteScore(phase.slug, "b")).toBe(true);
    expect(await store.deleteScore(phase.slug, "zz")).toBe(false);

    await store.deletePhase(phase.slug);
    expect(await store.getPhase(phase.slug)).toBeNull();
    expect(await store.listScores(phase.slug)).toEqual([]);
  });

  it("claims each run only once", async () => {
    expect(await store.claimRun("n1", 60_000)).toBe(true);
    expect(await store.claimRun("n1", 60_000)).toBe(false);
    expect(await store.claimRun("n2", 60_000)).toBe(true);
  });
});
