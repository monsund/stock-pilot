import { z } from "zod";
export declare const SymbolZ: z.ZodObject<{
    exchange: z.ZodEnum<["NSE", "BSE"]>;
    symbol: z.ZodString;
    token: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    exchange: "NSE" | "BSE";
    token?: string | undefined;
}, {
    symbol: string;
    exchange: "NSE" | "BSE";
    token?: string | undefined;
}>;
export type SymbolT = z.infer<typeof SymbolZ>;
export declare const NewsArticleZ: z.ZodObject<{
    id: z.ZodString;
    source: z.ZodString;
    title: z.ZodString;
    url: z.ZodString;
    publishedAt: z.ZodString;
    summary: z.ZodOptional<z.ZodString>;
    tickers: z.ZodDefault<z.ZodArray<z.ZodObject<{
        exchange: z.ZodEnum<["NSE", "BSE"]>;
        symbol: z.ZodString;
        token: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        symbol: string;
        exchange: "NSE" | "BSE";
        token?: string | undefined;
    }, {
        symbol: string;
        exchange: "NSE" | "BSE";
        token?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    source: string;
    title: string;
    url: string;
    publishedAt: string;
    tickers: {
        symbol: string;
        exchange: "NSE" | "BSE";
        token?: string | undefined;
    }[];
    summary?: string | undefined;
}, {
    id: string;
    source: string;
    title: string;
    url: string;
    publishedAt: string;
    summary?: string | undefined;
    tickers?: {
        symbol: string;
        exchange: "NSE" | "BSE";
        token?: string | undefined;
    }[] | undefined;
}>;
export type NewsArticleT = z.infer<typeof NewsArticleZ>;
export declare const AnalysisZ: z.ZodObject<{
    id: z.ZodString;
    symbol: z.ZodObject<{
        exchange: z.ZodEnum<["NSE", "BSE"]>;
        symbol: z.ZodString;
        token: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        symbol: string;
        exchange: "NSE" | "BSE";
        token?: string | undefined;
    }, {
        symbol: string;
        exchange: "NSE" | "BSE";
        token?: string | undefined;
    }>;
    articleId: z.ZodString;
    stance: z.ZodEnum<["BUY", "SELL", "HOLD"]>;
    confidence: z.ZodNumber;
    targetPrice: z.ZodOptional<z.ZodNumber>;
    stopLoss: z.ZodOptional<z.ZodNumber>;
    rationale: z.ZodString;
    risks: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    asOf: z.ZodString;
}, "strip", z.ZodTypeAny, {
    symbol: {
        symbol: string;
        exchange: "NSE" | "BSE";
        token?: string | undefined;
    };
    id: string;
    articleId: string;
    stance: "BUY" | "SELL" | "HOLD";
    confidence: number;
    rationale: string;
    risks: string[];
    asOf: string;
    targetPrice?: number | undefined;
    stopLoss?: number | undefined;
}, {
    symbol: {
        symbol: string;
        exchange: "NSE" | "BSE";
        token?: string | undefined;
    };
    id: string;
    articleId: string;
    stance: "BUY" | "SELL" | "HOLD";
    confidence: number;
    rationale: string;
    asOf: string;
    targetPrice?: number | undefined;
    stopLoss?: number | undefined;
    risks?: string[] | undefined;
}>;
export type AnalysisT = z.infer<typeof AnalysisZ>;
