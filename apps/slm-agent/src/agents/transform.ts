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
    risks: [],
    asOf: new Date().toISOString(),
    ...(parsed?.targetPrice ? { targetPrice: parsed.targetPrice } : {}),
    ...(parsed?.stopLoss ? { stopLoss: parsed.stopLoss } : {}),
    ...(parsed?.headlines?.length ? { headlines: parsed.headlines } : {}),
    ...(parsed?.sources?.length ? { sources: parsed.sources } : {}),
  };

  return [base];
}
