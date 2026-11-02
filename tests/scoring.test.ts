import { describe, expect, it } from "vitest";
import { computeScore } from "@/lib/scoring";
import type { Question } from "@/lib/types";

const q = (id: string, correctIndex: number): Question => ({
  id,
  descriptor: "D1",
  supportText: "",
  prompt: "?",
  options: ["a", "b", "c"],
  correctIndex,
  explanation: "",
});

const phase = { questions: [q("q1", 0), q("q2", 1), q("q3", 2)], difficulty: 1 as const, hearts: 3 };

describe("computeScore", () => {
  it("adds correct answers, stars, completion, hearts and time bonus for a full run", () => {
    const result = computeScore(phase, {
      answers: [
        { questionId: "q1", choice: 0 },
        { questionId: "q2", choice: 1 },
        { questionId: "q3", choice: 0 },
      ],
      stars: 5,
      heartsLeft: 2,
      durationMs: 60_000,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const b = result.breakdown;
    expect(b.correct).toBe(2);
    expect(b.completed).toBe(true);
    expect(b.correctPoints).toBe(200);
    expect(b.starPoints).toBe(50);
    expect(b.completionBonus).toBe(200);
    expect(b.heartBonus).toBe(100);
    // par 135s - 60s = 75s * 2 = 150
    expect(b.timeBonus).toBe(150);
    expect(b.score).toBe(700);
  });

  it("caps stars to the amount that exists in the level and hearts to the phase max", () => {
    const result = computeScore(phase, {
      answers: phase.questions.map((x) => ({ questionId: x.id, choice: x.correctIndex })),
      stars: 9999,
      heartsLeft: 9,
      durationMs: 1_000_000,
    });
    if (!result.ok) throw new Error(result.error);
    expect(result.breakdown.stars).toBe(18);
    expect(result.breakdown.heartBonus).toBe(150);
    expect(result.breakdown.timeBonus).toBe(0);
  });

  it("gives no bonuses when the player ran out of hearts", () => {
    const result = computeScore(phase, {
      answers: [{ questionId: "q1", choice: 0 }],
      stars: 2,
      heartsLeft: 0,
      durationMs: 30_000,
    });
    if (!result.ok) throw new Error(result.error);
    expect(result.breakdown.completed).toBe(false);
    expect(result.breakdown.score).toBe(120);
  });

  it("applies the difficulty multiplier", () => {
    const result = computeScore(
      { ...phase, difficulty: 3 },
      { answers: [{ questionId: "q1", choice: 0 }], stars: 0, heartsLeft: 0, durationMs: 10_000 },
    );
    if (!result.ok) throw new Error(result.error);
    expect(result.breakdown.correctPoints).toBe(150);
  });

  it("rejects answers out of order, too many answers and impossibly fast runs", () => {
    expect(computeScore(phase, { answers: [{ questionId: "q2", choice: 1 }], stars: 0, heartsLeft: 1, durationMs: 50_000 }).ok).toBe(false);
    const four = [...phase.questions, q("q4", 0)].map((x) => ({ questionId: x.id, choice: 0 }));
    expect(computeScore(phase, { answers: four, stars: 0, heartsLeft: 1, durationMs: 50_000 }).ok).toBe(false);
    expect(
      computeScore(phase, {
        answers: phase.questions.map((x) => ({ questionId: x.id, choice: x.correctIndex })),
        stars: 0,
        heartsLeft: 1,
        durationMs: 2_000,
      }).ok,
    ).toBe(false);
  });
});
