import { generalRanking } from "./ranking";
import { getStore } from "./store";
import type { GeneralRankingRow, ScoreEntry } from "./types";

/** General ranking over all active phases. */
export async function loadGeneralRanking(limit = 100): Promise<GeneralRankingRow[]> {
  const store = getStore();
  const phases = (await store.listPhases()).filter((p) => p.active);
  const lists = await Promise.all(phases.map((p) => store.listScores(p.slug)));
  const bySlug = new Map<string, ScoreEntry[]>(phases.map((p, i) => [p.slug, lists[i]]));
  return generalRanking(bySlug, limit);
}
