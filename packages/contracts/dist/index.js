import { z } from "zod";
export const SymbolZ = z.object({
    exchange: z.enum(["NSE", "BSE"]),
    symbol: z.string(), // e.g., "RELIANCE"
    token: z.string().optional() // Angel scrip token if known
});
export const NewsArticleZ = z.object({
    id: z.string(), // stable hash of source+url
    source: z.string(),
    title: z.string(),
    url: z.string().url(),
    publishedAt: z.string(), // ISO
    summary: z.string().optional(),
    tickers: z.array(SymbolZ).default([])
});
export const AnalysisZ = z.object({
    id: z.string(),
    symbol: SymbolZ,
    articleId: z.string(),
    stance: z.enum(["BUY", "SELL", "HOLD"]),
    confidence: z.number().min(0).max(1),
    targetPrice: z.number().optional(),
    stopLoss: z.number().optional(),
    rationale: z.string(),
    risks: z.array(z.string()).default([]),
    asOf: z.string() // ISO
});
