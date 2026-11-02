import { nicknameKey } from "./slug";
import type { GeneralRankingRow, RankingRow, ScoreEntry } from "./types";

/** Higher score wins; ties go to the faster run, then the earlier one. */
export function compareEntries(a: ScoreEntry, b: ScoreEntry): number {
  if (b.score !== a.score) return b.score - a.score;
  if (a.durationMs !== b.durationMs) return a.durationMs - b.durationMs;
  return a.createdAt.localeCompare(b.createdAt);
}

/** Keeps only the best entry of each nickname. */
export function bestPerNickname(entries: readonly ScoreEntry[]): ScoreEntry[] {
  const best = new Map<string, ScoreEntry>();
  for (const entry of entries) {
    const key = nicknameKey(entry.nickname);
    const current = best.get(key);
    if (!current || compareEntries(entry, current) < 0) best.set(key, entry);
  }
  return [...best.values()].sort(compareEntries);
}

export function phaseRanking(entries: readonly ScoreEntry[], limit = 100): RankingRow[] {
  return bestPerNickname(entries)
    .slice(0, limit)
    .map((e, i) => ({
      position: i + 1,
      nickname: e.nickname,
      score: e.score,
      correct: e.correct,
      total: e.total,
      completed: e.completed,
      durationMs: e.durationMs,
      createdAt: e.createdAt,
    }));
}

/** Sums each nickname's best score across all phases. */
export function generalRanking(entriesBySlug: ReadonlyMap<string, readonly ScoreEntry[]>, limit = 100): GeneralRankingRow[] {
  const totals = new Map<string, Omit<GeneralRankingRow, "position">>();
  for (const entries of entriesBySlug.values()) {
    for (const best of bestPerNickname(entries)) {
      const key = nicknameKey(best.nickname);
      const prev = totals.get(key);
      totals.set(key, {
        nickname: prev?.nickname ?? best.nickname,
        totalScore: (prev?.totalScore ?? 0) + best.score,
        phasesPlayed: (prev?.phasesPlayed ?? 0) + 1,
        phasesCompleted: (prev?.phasesCompleted ?? 0) + (best.completed ? 1 : 0),
      });
    }
  }
  return [...totals.values()]
    .sort((a, b) => b.totalScore - a.totalScore || b.phasesCompleted - a.phasesCompleted || a.nickname.localeCompare(b.nickname))
    .slice(0, limit)
    .map((row, i) => ({ position: i + 1, ...row }));
}

/** 1-based position of a nickname's best run inside a phase ranking. */
export function positionOfNickname(entries: readonly ScoreEntry[], nickname: string): number | null {
  const key = nicknameKey(nickname);
  const index = bestPerNickname(entries).findIndex((e) => nicknameKey(e.nickname) === key);
  return index === -1 ? null : index + 1;
}
