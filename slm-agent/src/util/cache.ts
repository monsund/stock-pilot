import { LRUCache } from 'lru-cache';

type Opts = { ttlMs?: number; max?: number };
let singleton: LRUCache<string, any> | null = null;

export function getCache(opts: Opts = {}) {
  if (!singleton) {
    singleton = new LRUCache<string, any>({ max: opts.max ?? 500, ttl: opts.ttlMs ?? 60_000 });
  }
  return singleton;
}
