import { describe, expect, it } from "vitest";
import { bestPerNickname, generalRanking, phaseRanking, positionOfNickname } from "@/lib/ranking";
import type { ScoreEntry } from "@/lib/types";

let seq = 0;
const entry = (over: Partial<ScoreEntry>): ScoreEntry => ({
  id: `e${seq++}`,
  slug: "f1",
  nickname: "Ana",
  fullName: "Ana Souza",
  score: 100,
  correct: 1,
  total: 3,
  stars: 0,
  durationMs: 60_000,
  completed: false,
  hero: "lia",
  createdAt: `2026-10-0${(seq % 9) + 1}T10:00:00.000Z`,
  ...over,
});

describe("ranking", () => {
  it("keeps the best run per nickname ignoring case and accents", () => {
    const list = [entry({ nickname: "Zé", score: 50 }), entry({ nickname: "ze", score: 90 }), entry({ nickname: "Bia", score: 70 })];
    const best = bestPerNickname(list);
    expect(best.map((e) => e.score)).toEqual([90, 70]);
  });

  it("breaks score ties by the faster run", () => {
    const rows = phaseRanking([entry({ nickname: "A", score: 100, durationMs: 90_000 }), entry({ nickname: "B", score: 100, durationMs: 30_000 })]);
    expect(rows.map((r) => r.nickname)).toEqual(["B", "A"]);
    expect(rows[0].position).toBe(1);
    expect(rows[0]).not.toHaveProperty("fullName");
  });

  it("sums the best score of each phase in the general ranking", () => {
    const bySlug = new Map([
      ["f1", [entry({ nickname: "Ana", score: 100, completed: true }), entry({ nickname: "Ana", score: 300 }), entry({ nickname: "Leo", score: 350 })]],
      ["f2", [entry({ slug: "f2", nickname: "ANA", score: 200, completed: true })]],
    ]);
    const rows = generalRanking(bySlug);
    expect(rows[0]).toMatchObject({ position: 1, nickname: "Ana", totalScore: 500, phasesPlayed: 2, phasesCompleted: 1 });
    expect(rows[1]).toMatchObject({ nickname: "Leo", totalScore: 350 });
  });

  it("finds the position of a nickname", () => {
    const list = [entry({ nickname: "A", score: 10 }), entry({ nickname: "B", score: 20 })];
    expect(positionOfNickname(list, "a")).toBe(2);
    expect(positionOfNickname(list, "c")).toBeNull();
  });
});
