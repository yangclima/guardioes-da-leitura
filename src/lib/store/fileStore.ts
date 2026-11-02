import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Phase, ScoreEntry } from "../types";
import { MAX_SCORES_PER_PHASE, type Store } from "./types";

interface DbShape {
  phases: Record<string, Phase>;
  scores: Record<string, ScoreEntry[]>;
  runs: Record<string, number>;
}

const emptyDb = (): DbShape => ({ phases: {}, scores: {}, runs: {} });

/**
 * JSON-file store for local use and single-server installs
 * (a school computer, for example). Writes are serialized and atomic.
 */
export class FileStore implements Store {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  private async read(): Promise<DbShape> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<DbShape>;
      return { phases: parsed.phases ?? {}, scores: parsed.scores ?? {}, runs: parsed.runs ?? {} };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyDb();
      throw error;
    }
  }

  private async write(db: DbShape): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
    await rename(tmp, this.filePath);
  }

  /** Runs read-modify-write cycles one at a time. */
  private mutate<T>(fn: (db: DbShape) => { db: DbShape; result: T }): Promise<T> {
    const next = this.queue.then(async () => {
      const { db, result } = fn(await this.read());
      await this.write(db);
      return result;
    });
    this.queue = next.catch(() => undefined);
    return next;
  }

  async listPhases(): Promise<Phase[]> {
    const db = await this.read();
    return Object.values(db.phases);
  }

  async getPhase(slug: string): Promise<Phase | null> {
    const db = await this.read();
    return db.phases[slug] ?? null;
  }

  savePhase(phase: Phase): Promise<void> {
    return this.mutate((db) => ({ db: { ...db, phases: { ...db.phases, [phase.slug]: phase } }, result: undefined }));
  }

  deletePhase(slug: string): Promise<void> {
    return this.mutate((db) => {
      const phases = Object.fromEntries(Object.entries(db.phases).filter(([key]) => key !== slug));
      const scores = Object.fromEntries(Object.entries(db.scores).filter(([key]) => key !== slug));
      return { db: { ...db, phases, scores }, result: undefined };
    });
  }

  async listScores(slug: string): Promise<ScoreEntry[]> {
    const db = await this.read();
    return db.scores[slug] ?? [];
  }

  addScore(entry: ScoreEntry): Promise<void> {
    return this.mutate((db) => {
      const list = [...(db.scores[entry.slug] ?? []), entry].slice(-MAX_SCORES_PER_PHASE);
      return { db: { ...db, scores: { ...db.scores, [entry.slug]: list } }, result: undefined };
    });
  }

  deleteScore(slug: string, id: string): Promise<boolean> {
    return this.mutate((db) => {
      const list = db.scores[slug] ?? [];
      const filtered = list.filter((e) => e.id !== id);
      return { db: { ...db, scores: { ...db.scores, [slug]: filtered } }, result: filtered.length !== list.length };
    });
  }

  claimRun(nonce: string, ttlMs: number): Promise<boolean> {
    return this.mutate((db) => {
      const now = Date.now();
      const runs = Object.fromEntries(Object.entries(db.runs).filter(([, exp]) => exp > now));
      if (runs[nonce]) return { db: { ...db, runs }, result: false };
      return { db: { ...db, runs: { ...runs, [nonce]: now + ttlMs } }, result: true };
    });
  }
}
