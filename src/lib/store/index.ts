import path from "node:path";
import { Redis } from "@upstash/redis";
import { FileStore } from "./fileStore";
import { RedisStore } from "./redisStore";
import type { Store } from "./types";

export type { Store } from "./types";

let instance: Store | null = null;

/**
 * Upstash Redis when its env vars exist (Vercel Marketplace sets the KV_* ones),
 * otherwise a JSON file in ./data — good for local use.
 */
export function getStore(): Store {
  if (instance) return instance;
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    instance = new RedisStore(new Redis({ url, token }));
  } else {
    if (process.env.VERCEL) {
      throw new Error("Banco de dados não configurado: conecte o Upstash Redis ao projeto na Vercel.");
    }
    const file = process.env.DATA_FILE ?? path.join(process.cwd(), "data", "db.json");
    instance = new FileStore(file);
  }
  return instance;
}
