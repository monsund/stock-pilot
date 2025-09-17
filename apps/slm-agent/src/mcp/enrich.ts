import { callTool } from "./client.js";

type Headline = { title: string; url?: string; source?: string; date?: string };
type NewsArticle = { title: string; url: string; source?: string; publishedAt?: string };

const DAY = 24 * 60 * 60 * 1000;

function isBadTitle(t?: string) {
  if (!t) return true;
  const s = t.trim();
  if (!s) return true;
  if (/^n\/a$/i.test(s)) return true;
  if (/^na$/i.test(s)) return true;
  return false;
}

function sanitize(items?: Headline[]): Headline[] {
  return (items ?? [])
    .filter(h => !isBadTitle(h.title))
    .map(h => ({
      title: h.title!.trim(),
      url: h.url,
      source: h.source,
      date: h.date?.slice(0, 10)
    }));
}

function normalizeMcp(arts: NewsArticle[]): Headline[] {
  return (arts ?? []).map(a => ({
    title: (a.title || "").trim(),
    url: a.url,
    source: a.source,
    date: a.publishedAt?.slice(0, 10),
  })).filter(h => !isBadTitle(h.title) && !!h.url);
}

function parseISO(d?: string): number {
  if (!d) return 0;
  const t = Date.parse(d);
  return Number.isFinite(t) ? t : 0;
}

export async function enrichWithHeadlines(query: string, analyses: any[]) {
  if (!analyses?.length) return analyses;

  const first = analyses[0];
  const base = process.env.NEWS_MCP_BASE;
  if (!base) return analyses;

  // 1) Clean existing headlines (remove "N/A", blanks, etc.)
  const existing: Headline[] = sanitize(first.headlines);

  // 2) Decide if we should call MCP:
  //    - fewer than 3 items, OR
  //    - newest item older than 30 days
  let need = existing.length < 3;
  if (!need && existing.length > 0) {
    const newest = Math.max(...existing.map(h => parseISO(h.date)));
    need = (Date.now() - newest) > (30 * DAY);
  }

  try {
    // 3) Always fetch MCP if we "need" fresher/more items
    const arts = need
      ? await callTool<any, NewsArticle[]>(base, "news.search", { query, lookback: "14d", locale: "en-IN" })
      : [];

    const mcp = normalizeMcp(arts);

    // 4) Merge (prefer MCP freshness). Dedup by URL, then title.
    const byKey = new Map<string, Headline>();
    const push = (h: Headline) => {
      const key = (h.url || "").toLowerCase() || h.title.toLowerCase();
      if (!byKey.has(key)) byKey.set(key, h);
    };

    // MCP first = higher priority
    mcp.forEach(push);
    existing.forEach(push);

    // 5) Sort by date desc (unknown dates last), take top 3
    const merged = Array.from(byKey.values())
      .sort((a, b) => parseISO(b.date) - parseISO(a.date))
      .slice(0, 3);

    // 6) Apply
    if (merged.length) {
      first.headlines = merged;
      // Grow sources set with any new URLs
      const extra = merged.map(h => h.url).filter(Boolean) as string[];
      first.sources = Array.from(new Set([...(first.sources ?? []), ...extra]));
    }
  } catch {
    // non-fatal; keep whatever we had
    first.headlines = existing;
  }

  return analyses;
}
