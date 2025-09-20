import yf from 'yahoo-finance2';
import { Tool } from "./Tool.js";

import { getCache } from '../util/cache.js';

const cache = getCache({ ttlMs: 24 * 60 * 60 * 1000 }); // 24h

export class SymbolResolveTool implements Tool<{ query: string }, any> {
  name = "symbol.resolve" as const;
  normalizeArgs(args: { query: string }) { return args; }
  async execute(args: { query: string }) {
    const query = args.query;
    const k = `sym:${query.toLowerCase()}`;
    const hit = cache.get(k);
    if (hit) return hit;
    if (/^[A-Za-z0-9.:-]{1,12}$/.test(query)) {
      const out = { symbol: query, companyName: undefined };
      cache.set(k, out);
      return out;
    }
    const results = await yf.search(query);
    const first = (results?.quotes || [])[0];
    const out =
      first && 'symbol' in first
        ? { symbol: first.symbol, companyName: first.shortname || first.longname }
        : { symbol: query, companyName: undefined };
    cache.set(k, out);
    return out;
  }
}
