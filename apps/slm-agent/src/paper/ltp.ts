import type { SymbolT } from "../agents/transform.js";

/**
 * If ANGEL_BASE is set (e.g., http://localhost:5001), we try:
 *   GET {ANGEL_BASE}/ltp?exchange=NSE&symbol=RELIANCE
 * Expected response: { ltp } OR { price } OR a raw number.
 * Otherwise return a demo price (100–150).
 */
export async function getLtp(symbol: SymbolT): Promise<number> {
  const base = process.env.ANGEL_BASE;
  if (base) {
    try {
      const url = new URL("/ltp", base);
      url.searchParams.set("exchange", symbol.exchange);
      url.searchParams.set("symbol", symbol.symbol);
      const r = await fetch(url);
      const data = await r.json().catch(() => null);
      const n = Number(data?.ltp ?? data?.price ?? data);
      if (Number.isFinite(n)) return n;
    } catch {
      /* fall through */
    }
  }
  return 100 + Math.round(Math.random() * 50);
}
