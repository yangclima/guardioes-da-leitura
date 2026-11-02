import type { Redis } from "@upstash/redis";
import type { Phase, ScoreEntry } from "../types";
import { MAX_SCORES_PER_PHASE, type Store } from "./types";

const PHASES_SET = "phases";
const phaseKey = (slug: string) => `phase:${slug}`;
const scoresKey = (slug: string) => `scores:${slug}`;
const runKey = (nonce: string) => `run:${nonce}`;

/** Upstash Redis store, used when deployed (e.g. on Vercel). */
export class RedisStore implements Store {
  constructor(private readonly redis: Redis) {}

  async listPhases(): Promise<Phase[]> {
    const slugs = await this.redis.smembers(PHASES_SET);
    if (slugs.length === 0) return [];
    const phases = await this.redis.mget<(Phase | null)[]>(...slugs.map(phaseKey));
    return phases.filter((p): p is Phase => p !== null);
  }

  getPhase(slug: string): Promise<Phase | null> {
    return this.redis.get<Phase>(phaseKey(slug));
  }

  async savePhase(phase: Phase): Promise<void> {
    await this.redis.multi().set(phaseKey(phase.slug), phase).sadd(PHASES_SET, phase.slug).exec();
  }

  async deletePhase(slug: string): Promise<void> {
    await this.redis.multi().del(phaseKey(slug), scoresKey(slug)).srem(PHASES_SET, slug).exec();
  }

  async listScores(slug: string): Promise<ScoreEntry[]> {
    return this.redis.lrange<ScoreEntry>(scoresKey(slug), 0, -1);
  }

  async addScore(entry: ScoreEntry): Promise<void> {
    const key = scoresKey(entry.slug);
    await this.redis.multi().lpush(key, entry).ltrim(key, 0, MAX_SCORES_PER_PHASE - 1).exec();
  }

  async deleteScore(slug: string, id: string): Promise<boolean> {
    const entries = await this.listScores(slug);
    const target = entries.find((e) => e.id === id);
    if (!target) return false;
    const removed = await this.redis.lrem(scoresKey(slug), 1, target);
    return removed > 0;
  }

  async claimRun(nonce: string, ttlMs: number): Promise<boolean> {
    const result = await this.redis.set(runKey(nonce), 1, { nx: true, px: ttlMs });
    return result === "OK";
  }
}
