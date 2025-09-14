import { Tool } from "./Tool";

type NewsArgs = {
  q?: string;
  query?: string;
  lookback?: number; // days
  pageSize?: number;
  language?: string;
  sortBy?: string;
  searchIn?: string;
  date_range?: string; // e.g. "14d"
  from?: string;
  to?: string;
  symbols?: string[];
};

export class NewsSearchTool implements Tool<NewsArgs, any> {
  name = "news.search" as const;
  normalizeArgs(args: NewsArgs): NewsArgs {
    const a: NewsArgs = { ...(args || {}) };
    if (a.query && !a.q) a.q = a.query;
    if (typeof a.q === "string") a.q = a.q.replace(/\s+news$/i, "").trim();
    if (!a.searchIn) a.searchIn = "title,description";
    if (!a.pageSize) a.pageSize = 8;
    if (!a.language) a.language = "en";
    if (!a.sortBy) a.sortBy = "publishedAt";
    if (typeof a.date_range === "string" && /^\d+d$/.test(a.date_range)) {
      const days = parseInt(a.date_range, 10);
      const to = new Date();
      const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      a.from = from.toISOString().slice(0, 10);
      a.to = to.toISOString().slice(0, 10);
      delete a.date_range;
    }
    return a;
  }
  async execute(args: NewsArgs) {
    const a = this.normalizeArgs(args);
    if (!process.env.NEWSAPI_KEY) throw new Error('NEWSAPI_KEY missing');
    const url = new URL('https://newsapi.org/v2/everything');
    url.searchParams.set('q', a.q ?? '');
    url.searchParams.set('language', a.language ?? 'en');
    url.searchParams.set('sortBy', a.sortBy ?? 'publishedAt');
    url.searchParams.set('pageSize', String(a.pageSize ?? 8));
    const resp = await fetch(url.toString(), {
      headers: { 'X-Api-Key': process.env.NEWSAPI_KEY! }
    });
    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`NewsAPI error: ${resp.status} ${txt}`);
    }
    const data = await resp.json();
    const results = (data.articles || []).map((article: any) => ({
      title: article.title,
      description: article.description,
      source: article.source?.name,
      url: article.url,
      publishedAt: article.publishedAt
    }));
    return { results };
  }
}
