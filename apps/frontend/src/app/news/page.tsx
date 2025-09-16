'use client';

import { useState } from "react";
import axios from "axios";

type SymbolT = { exchange: "NSE" | "BSE"; symbol: string; token?: string };
type AnalysisT = {
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

export default function NewsAnalyzePage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyses, setAnalyses] = useState<AnalysisT[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    setAnalyses(null);

    try {
      const { data } = await axios.post("/api/analyze", { query: q.trim() });
      setAnalyses(data?.analyses ?? []);
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null) {
        const errorObj = err as { response?: { data?: { error?: string } }, message?: string };
        setError(
          errorObj.response?.data?.error ||
          errorObj.message ||
          "Failed to analyze. Please try again."
        );
      } else {
        setError("Failed to analyze. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <div className="flex flex-1 max-w-7xl mx-auto px-4 py-6 gap-6">
        <div className="flex-1 space-y-6">
          <header className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight">
              🔎 News → Insight → <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-fuchsia-600">Paper Trade</span>
            </h1>
            <p className="text-slate-600">
              Try <span className="font-mono">TATA POWER</span>, <span className="font-mono">RELIANCE</span>, etc.
            </p>
          </header>
          <form onSubmit={onSubmit} className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a stock…"
              className="flex-1 rounded-2xl border px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !q.trim()}
              className="rounded-2xl px-5 py-3 font-medium text-white bg-gradient-to-r from-indigo-600 to-fuchsia-600 shadow disabled:opacity-50"
            >
              {loading ? (
                "Analyzing..."
              ) : "Analyze"}
            </button>
          </form>
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}
          <div className="grid gap-4">
            {loading ? (
              <div className="border rounded-lg bg-white p-4 shadow-sm">
                <div className="h-6 w-1/2 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded mb-2"></div>
                <div className="h-4 w-1/3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded"></div>
                <div className="h-4 w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded mt-4"></div>
              </div>
            ) : (
              analyses?.map((analysis) => <AnalysisCard key={analysis.id} analysis={analysis} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function badgeColor(stance: AnalysisT["stance"]) {
  return stance === "BUY"
    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : stance === "SELL"
    ? "bg-rose-100 text-rose-700 border-rose-200"
    : "bg-amber-100 text-amber-700 border-amber-200";
}

import { useRouter } from "next/navigation";

function AnalysisCard({ analysis }: { analysis: AnalysisT }) {
  console.log('qaz---analysis', analysis);
  const [placing, setPlacing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  const onTrade = async () => {
    setPlacing(true);
    setMsg(null);
    try {
      const side = analysis.stance === "SELL" ? "SELL" : "BUY";
      const { data } = await axios.post("/api/paper/orders", {
        symbol: analysis.symbol, side, qty: 1, type: "MARKET"
      });
  const order = data?.order;
  setMsg(order ? `Filled: ${order.side} ${order.qty} ${order.symbol?.symbol} @ ${order.price}` : "Order placed.");
      // quick redirect to paper dashboard
      setTimeout(() => router.push("/paper"), 900);
    } catch (e: unknown) {
      if (typeof e === "object" && e !== null) {
        const errObj = e as { response?: { data?: { error?: string } }, message?: string };
        setMsg(errObj.response?.data?.error || errObj.message || "Trade failed");
      } else {
        setMsg("Trade failed");
      }
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="rounded-3xl border bg-white/70 backdrop-blur shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border ${badgeColor(analysis.stance)}`}>
            {analysis?.stance}
            <span className="opacity-70">({Math.round(analysis.confidence * 100)}%)</span>
          </div>
          <h3 className="mt-3 text-xl font-bold tracking-tight">
            {analysis?.symbol?.exchange}:{analysis?.symbol?.symbol}
          </h3>
          <p className="mt-2 text-slate-700 leading-relaxed whitespace-pre-line">
            {analysis?.rationale}
          </p>
        </div>
        <div className="text-right text-sm text-slate-500">
          <div>{new Date(analysis.asOf).toLocaleString()}</div>
          {analysis?.targetPrice && (
            <div className="mt-1">
              TP: <span className="font-semibold">{analysis?.targetPrice}</span>
            </div>
          )}
          {analysis?.stopLoss && (
            <div>
              SL: <span className="font-semibold">{analysis?.stopLoss}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        {msg && <div className="text-sm text-slate-600">{msg}</div>}
        <button
          onClick={onTrade}
          disabled={placing}
          className="ml-auto rounded-xl border px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
        >
          {placing ? "Placing…" : "Paper Trade →"}
        </button>
      </div>
    </div>
  );
}
