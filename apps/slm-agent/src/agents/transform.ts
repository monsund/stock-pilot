// Minimal schema (avoid blocking on @stockpilot/contracts right now)
export type SymbolT = { exchange: "NSE" | "BSE"; symbol: string; token?: string };
export type AnalysisT = {
  id: string;
  symbol: SymbolT;
  articleId: string;
  stance: "BUY" | "SELL" | "HOLD";
  confidence: number; // 0..1
  rationale: string;
  risks: string[];
  asOf: string; // ISO
  targetPrice?: number;
  stopLoss?: number;
};

// Convert your current agent output to AnalysisT[]
export function toAnalyses(query: string, raw: any): AnalysisT[] {
  // Heuristic fallback if raw isn’t structured yet:
  const base: AnalysisT = {
    id: `ana-${Date.now()}`,
    symbol: { exchange: "NSE", symbol: query.toUpperCase() },
    articleId: "n/a",
    stance: "HOLD",
    confidence: 0.55,
    rationale: typeof raw?.final === "string" ? raw.final.slice(0, 400) : "Initial analysis stub.",
    risks: [],
    asOf: new Date().toISOString()
  };
  return [base];
}
