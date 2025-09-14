// types are optional but handy
type NewsItem = { date?: string; title: string; source?: string; url?: string; };
type EvidenceItem = {
  date?: string;
  category?: "Earnings"|"Industry"|"Regulatory"|"Macro"|"Other"|string;
  impact?: string;              // e.g., "+2%" | "n.a."
  materiality?: number;         // Mat:1..5
  text: string;
  url?: string;
};
type Assessment = { direction: "Bullish"|"Bearish"|"Neutral"|string; net_score: number; confidence: number; };

export function parseFinalToJSON(finalStr: string) {
  const text = finalStr.replace(/\r\n?/g, "\n").trim();

  // -------- simple KV lines at the top ----------
  const getKV = (key: string) => {
    const m = text.match(new RegExp(`^${key}\\s*:\\s*(.*)$`, "mi"));
    return m ? m[1].replace(/\s+#.*$/, "").trim() : undefined; // strip inline comments like "# from time.now"
  };

  const out: any = {
    ticker: getKV("TICKER"),
    company: getKV("COMPANY"),
    as_of: getKV("AS_OF"),
    lookback: getKV("LOOKBACK"),
    about_company: {},
    vision: {},
    current_news: [] as NewsItem[],
    recent_news: [] as NewsItem[],
    what_changed: [] as string[],
    setbacks: [] as NewsItem[],
    growth_possibility: [] as { text: string; timing?: string; url?: string }[],
    evidence: [] as EvidenceItem[],
    risks: [] as string[],
    catalysts: [] as string[],
    assessment: {} as Assessment,
    sources: [] as string[],
  };

  // -------- section collector ----------
  const SECTION_RE = /^([A-Z_]+):\s*$/;
  const lines = text.split("\n");
  let current: string | null = null;
  const buckets: Record<string, string[]> = {};

  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = line.match(SECTION_RE);
    if (h) {
      current = h[1];
      buckets[current] = [];
      continue;
    }
    if (current) buckets[current].push(line);
  }

  // helpers
  const isNA = (arr: string[]) => arr.join("\n").trim().toUpperCase() === "N/A";
  const bulletLines = (arr: string[]) =>
    arr.filter(l => /^\- /.test(l)).map(l => l.replace(/^\- /, "").trim());

  // -------- ABOUT_COMPANY --------
  if (buckets.ABOUT_COMPANY && !isNA(buckets.ABOUT_COMPANY)) {
    const grab = (label: string) => {
      const m = buckets.ABOUT_COMPANY.find(l => l.startsWith(`- ${label}:`));
      if (!m) return undefined;
      const v = m.split(":").slice(1).join(":").trim();
      return v;
    };
    const asList = (v?: string) => v ? v.split(";").map(s => s.trim()).filter(Boolean) : undefined;

    out.about_company.summary    = grab("Summary");
    out.about_company.segments   = asList(grab("Segments"));
    out.about_company.geographies= asList(grab("Geographies"));
    out.about_company.products   = asList(grab("Products"));
  }

  // -------- VISION --------
  if (buckets.VISION && !isNA(buckets.VISION)) {
    const grab = (label: string) => {
      const m = buckets.VISION.find(l => l.startsWith(`- ${label}:`));
      if (!m) return undefined;
      return m.split(":").slice(1).join(":").trim();
    };
    const asList = (v?: string) => v ? v.split(";").map(s => s.trim()).filter(Boolean) : undefined;
    out.vision.mission = grab("Mission");
    out.vision.strategy_pillars = asList(grab("Strategy_Pillars"));
  }

  // -------- CURRENT_NEWS / RECENT_NEWS --------
  const parseNewsLine = (s: string): NewsItem | null => {
    // "YYYY-MM-DD | Title — Source. URL"
    const m = s.match(/^(\d{4}-\d{2}-\d{2})\s*\|\s*(.*?)\s+—\s*(.*?)\.\s+(https?:\S+)/);
    if (m) return { date: m[1], title: m[2], source: m[3], url: m[4] };
    // fallback: just Title … URL
    const f = s.match(/^(.*?)\s+(https?:\S+)$/);
    if (f) return { title: f[1].trim(), url: f[2] };
    return { title: s };
  };
  if (buckets.CURRENT_NEWS && !isNA(buckets.CURRENT_NEWS))
    out.current_news = bulletLines(buckets.CURRENT_NEWS).map(parseNewsLine).filter(Boolean) as NewsItem[];
  if (buckets.RECENT_NEWS && !isNA(buckets.RECENT_NEWS))
    out.recent_news = bulletLines(buckets.RECENT_NEWS).map(parseNewsLine).filter(Boolean) as NewsItem[];

  // -------- WHAT_CHANGED --------
  if (buckets.WHAT_CHANGED && !isNA(buckets.WHAT_CHANGED))
    out.what_changed = bulletLines(buckets.WHAT_CHANGED);

  // -------- SETBACKS --------
  const parseSetback = (s: string): NewsItem => {
    // "YYYY-MM-DD | text. URL"
    const m = s.match(/^(\d{4}-\d{2}-\d{2})\s*\|\s*(.*?)\.\s+(https?:\S+)/);
    if (m) return { date: m[1], title: m[2], url: m[3] };
    return { title: s };
    };
  if (buckets.SETBACKS && !isNA(buckets.SETBACKS))
    out.setbacks = bulletLines(buckets.SETBACKS).map(parseSetback);

  // -------- GROWTH_POSSIBILITY --------
  const parseGrowth = (s: string) => {
    // "Driver — timeframe. URL"
    const m = s.match(/^(.*?)\s+—\s*(.*?)\.\s+(https?:\S+)/);
    if (m) return { text: m[1].trim(), timing: m[2].trim(), url: m[3] };
    return { text: s };
  };
  if (buckets.GROWTH_POSSIBILITY && !isNA(buckets.GROWTH_POSSIBILITY))
    out.growth_possibility = bulletLines(buckets.GROWTH_POSSIBILITY).map(parseGrowth);

  // -------- EVIDENCE --------
  const parseEvidence = (s: string): EvidenceItem => {
    // "YYYY-MM-DD | Category | Impact ... Mat:5 — text. URL"
    const m = s.match(
      /^(\d{4}-\d{2}-\d{2})\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*Mat:?\s*(\d)\s*—\s*(.*?)\.\s+(https?:\S+)\s*$/i
    );
    if (m) {
      return {
        date: m[1],
        category: m[2].trim(),
        impact: m[3].trim(),
        materiality: Number(m[4]),
        text: m[5].trim(),
        url: m[6]
      };
    }
    return { text: s };
  };
  if (buckets.EVIDENCE && !isNA(buckets.EVIDENCE))
    out.evidence = bulletLines(buckets.EVIDENCE).map(parseEvidence);

  // -------- RISKS / CATALYSTS --------
  if (buckets.RISKS && !isNA(buckets.RISKS)) out.risks = bulletLines(buckets.RISKS);
  if (buckets.CATALYSTS && !isNA(buckets.CATALYSTS)) out.catalysts = bulletLines(buckets.CATALYSTS);

  // -------- ASSESSMENT --------
  if (buckets.ASSESSMENT) {
    const grab = (label: string) => {
      const m = buckets.ASSESSMENT.find(l => l.toUpperCase().startsWith(`${label}:`));
      if (!m) return undefined;
      return m.split(":").slice(1).join(":").trim();
    };
    out.assessment.direction  = (grab("DIRECTION") as any) ?? "Neutral";
    out.assessment.net_score  = Number(grab("NET_SCORE") ?? 0);
    out.assessment.confidence = Number(grab("CONFIDENCE") ?? 0);
  }

  // -------- SOURCES --------
  if (buckets.SOURCES)
    out.sources = bulletLines(buckets.SOURCES).map(s => s.replace(/^- /, "").trim());

  // normalize empties to []
  (["current_news","recent_news","what_changed","setbacks","growth_possibility","evidence","risks","catalysts","sources"] as const)
    .forEach(k => { if (!out[k] || (Array.isArray(out[k]) && out[k].length === 0)) out[k] = []; });

  return out;
}
