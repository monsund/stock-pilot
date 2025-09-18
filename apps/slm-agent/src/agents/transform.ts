import { parseFinalBlock } from "./parseFinal.js";

export type SymbolT = { exchange: "NSE" | "BSE"; symbol: string; token?: string };
export type AnalysisHeadline = { date?: string; title: string; source?: string; url?: string };
export type AnalysisT = {
  id: string;
  symbol: SymbolT;
  articleId: string;
  stance: "BUY" | "SELL" | "HOLD";
  confidence: number;
  rationale: string;
  risks: string[];
  asOf: string;
  targetPrice?: number;
  stopLoss?: number;
  headlines?: AnalysisHeadline[];
  sources?: string[];
  ticker?: string;
  companyName?: string;
  timestamp?: string;
  lookback?: string;
  about?: string;
  vision?: string;
  currentNews?: AnalysisHeadline[];
  recentNews?: AnalysisHeadline[];
  whatChanged?: string;
  setbacks?: string;
  growth?: string;
  evidence?: string;
  catalysts?: string;
  assessment?: string;
};

export function toAnalyses(query: string, raw: any): AnalysisT[] {
  const finalText: string | undefined = typeof raw?.final === "string" ? raw.final : undefined;
  const parsed = finalText ? parseFinalBlock(finalText) : null;

  const base: AnalysisT = {
    id: `ana-${Date.now()}`,
    symbol: { exchange: "NSE", symbol: query.toUpperCase() },
    articleId: "n/a",
    stance: parsed?.stance ?? "HOLD",
    confidence: parsed?.confidence ?? 0.55,
    rationale: parsed?.rationale ?? "Initial analysis stub.",
    risks: parsed?.risks ?? [],
    asOf: parsed?.timestamp ?? new Date().toISOString(),
    targetPrice: parsed?.targetPrice,
    stopLoss: parsed?.stopLoss,
    headlines: parsed?.headlines,
    sources: parsed?.sources,
    ticker: parsed?.ticker,
    companyName: parsed?.companyName,
    timestamp: parsed?.timestamp,
    lookback: parsed?.lookback,
    about: parsed?.about,
    vision: parsed?.vision,
    currentNews: parsed?.currentNews,
    recentNews: parsed?.recentNews,
    whatChanged: parsed?.whatChanged,
    setbacks: parsed?.setbacks,
    growth: parsed?.growth,
    evidence: parsed?.evidence,
    catalysts: parsed?.catalysts,
    assessment: parsed?.assessment,
  };

  return [base];
}
