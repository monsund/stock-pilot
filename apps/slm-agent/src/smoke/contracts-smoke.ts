import { SymbolZ, AnalysisZ, type SymbolT, type AnalysisT } from "@stockpilot/contracts";

// a micro sanity check so we know imports/types work:
const demoSymbol: SymbolT = { exchange: "NSE", symbol: "RELIANCE" };
const parsedSymbol = SymbolZ.parse(demoSymbol);

const demoAnalysis: AnalysisT = {
  id: "test-1",
  symbol: parsedSymbol,
  articleId: "news-123",
  stance: "HOLD",
  confidence: 0.55,
  rationale: "Initial wiring test",
  risks: [],
  asOf: new Date().toISOString()
};
const parsedAnalysis = AnalysisZ.parse(demoAnalysis);

console.log("Contracts OK:", parsedSymbol, parsedAnalysis.stance, parsedAnalysis.confidence);
