export type ParsedHeadline = { date?: string; title: string; source?: string; url?: string };
export type ParsedAssessment = {
  stance: "BUY" | "SELL" | "HOLD";
  confidence: number;              // 0..1
  targetPrice?: number;
  stopLoss?: number;
  rationale: string;               // short summary
  headlines: ParsedHeadline[];
  sources: string[];
  ticker?: string;
  companyName?: string;
  timestamp?: string;
  lookback?: string;
  about?: string;
  vision?: string;
  currentNews?: ParsedHeadline[];
  recentNews?: ParsedHeadline[];
  whatChanged?: string;
  setbacks?: string;
  growth?: string;
  evidence?: string;
  risks?: string[];
  catalysts?: string;
  assessment?: string;
};

const num = (s: string | undefined | null) => {
  if (!s) return undefined;
  const m = s.match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : undefined;
};

function sliceSection(text: string, section: string): string | undefined {
  const re = new RegExp(`^\\s*${section}:\\s*\\n([\\s\\S]*?)(?=\\n[A-Z_]+:|\\n\\Z)`, "im");
  return text.match(re)?.[1]?.trim();
}

function parseHeadlinesBlock(block?: string): ParsedHeadline[] {
  if (!block) return [];
  const lines = block.split(/\n+/).map(l => l.trim()).filter(Boolean);
  const items: ParsedHeadline[] = [];
  for (const line of lines) {
    // Formats like: "- 2025-09-13 | Title — Source. URL"
    const m = line.match(/^-?\s*(\d{4}-\d{2}-\d{2})?\s*\|?\s*(.*?)(?:\s*—\s*([^.]*)\.)?\s*(https?:\/\/\S+)?$/);
    if (m) {
      const [, date, title, source, url] = m;
      if (title) items.push({ date, title: title.trim(), source: source?.trim(), url });
    }
  }
  return items;
}

export function parseFinalBlock(finalText: string): ParsedAssessment {
  const text = finalText ?? "";

  // 1) DIRECTION -> stance
  const dir = text.match(/^\s*DIRECTION:\s*(Bullish|Bearish|Neutral)/im)?.[1] ?? "Neutral";
  const stance: ParsedAssessment["stance"] = dir === "Bullish" ? "BUY" : dir === "Bearish" ? "SELL" : "HOLD";

  // 2) CONFIDENCE (0..1 or 0..100)
  let confidence = Number(text.match(/^\s*CONFIDENCE:\s*([0-9]+(\.[0-9]+)?)/im)?.[1] ?? 0.5);
  if (confidence > 1 && confidence <= 100) confidence /= 100;
  if (!Number.isFinite(confidence)) confidence = 0.5;
  confidence = Math.max(0, Math.min(1, confidence));

  // 3) TP/SL (optional)
  const tp = num((text.match(/target\s*price\s*[:=]\s*([^\n]+)/i) || text.match(/\bTP[:=]\s*([^\n]+)/i))?.[1]);
  const sl = num((text.match(/stop\s*loss\s*[:=]\s*([^\n]+)/i) || text.match(/\bSL[:=]\s*([^\n]+)/i))?.[1]);

  // Extract all requested sections
  const ticker = text.match(/^\s*TICKER:\s*(.+)$/im)?.[1]?.trim();
  const companyName = text.match(/^\s*COMPANY_NAME:\s*(.+)$/im)?.[1]?.trim();
  const timestamp = text.match(/^\s*TIMESTAMP:\s*(.+)$/im)?.[1]?.trim();
  const lookback = text.match(/^\s*LOOKBACK:\s*(.+)$/im)?.[1]?.trim();
  const about = sliceSection(text, "ABOUT_COMPANY");
  const vision = sliceSection(text, "VISION");
  const currentNews = parseHeadlinesBlock(sliceSection(text, "CURRENT_NEWS"));
  const recentNews = parseHeadlinesBlock(sliceSection(text, "RECENT_NEWS"));
  const whatChanged = sliceSection(text, "WHAT_CHANGED");
  const setbacks = sliceSection(text, "SETBACKS");
  const growth = sliceSection(text, "GROWTH_POSSIBILITY");
  const evidence = sliceSection(text, "EVIDENCE");
  const risksBlock = sliceSection(text, "RISKS");
  const risks = risksBlock ? risksBlock.split(/\n+/).map(l => l.trim()).filter(Boolean) : [];
  const catalysts = sliceSection(text, "CATALYSTS");
  const assessment = sliceSection(text, "ASSESSMENT");

  // Headlines for legacy compatibility
  const headlines = [...currentNews, ...recentNews].slice(0, 3);

  // Sources URLs
  const sourcesBlock = sliceSection(text, "SOURCES");
  const sources = sourcesBlock
    ? sourcesBlock.split(/\n+/).map(l => (l.match(/https?:\/\/\S+/)?.[0] || "")).filter(Boolean)
    : [];

  return {
    stance,
    confidence,
    targetPrice: tp,
    stopLoss: sl,
    rationale: whatChanged?.split(/\n/).slice(0, 3).join("\n") || about || "",
    headlines,
    sources,
    ticker,
    companyName,
    timestamp,
    lookback,
    about,
    vision,
    currentNews,
    recentNews,
    whatChanged,
    setbacks,
    growth,
    evidence,
    risks,
    catalysts,
    assessment,
  };
}
