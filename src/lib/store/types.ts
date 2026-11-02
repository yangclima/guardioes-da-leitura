import type { Phase, ScoreEntry } from "../types";

/** Max score entries kept per phase (oldest are dropped). */
export const MAX_SCORES_PER_PHASE = 5000;

export interface Store {
  listPhases(): Promise<Phase[]>;
  getPhase(slug: string): Promise<Phase | null>;
  savePhase(phase: Phase): Promise<void>;
  /** Removes the phase and all its scores. */
  deletePhase(slug: string): Promise<void>;
  listScores(slug: string): Promise<ScoreEntry[]>;
  addScore(entry: ScoreEntry): Promise<void>;
  deleteScore(slug: string, id: string): Promise<boolean>;
  /** Marks a run as used. Returns false when it was already claimed. */
  claimRun(nonce: string, ttlMs: number): Promise<boolean>;
}
