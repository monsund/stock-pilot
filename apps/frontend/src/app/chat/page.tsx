"use client";

import { useState, useRef, useCallback } from 'react';
import axios from 'axios';

type Headline = {
  title: string;
  url: string;
  source?: string;
  date?: string;
};

type Analysis = {
  id: string;
  symbol: {
    exchange: string;
    symbol: string;
  };
  articleId?: string;
  stance: string;            // e.g., BUY | SELL | HOLD
  confidence: number;        // 0..1 (fallbacks handled)
  rationale: string;
  risks: string[];
  asOf: string;              // ISO
  headlines: Headline[];
  sources: string[];
  about?: string;
  catalysts?: string;
};

export default function NewsSearchPage() {
  // Trade modal state (must be inside component)
  const [tradeOpen, setTradeOpen] = useState(false);
  const [tradeAction, setTradeAction] = useState<'BUY' | 'SELL' | 'HOLD'>('BUY');
  const [tradeQty, setTradeQty] = useState(1);
  const [tradeStatus, setTradeStatus] = useState<string | null>(null);
  const [topic, setTopic] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatDate = (d?: string) => {
    if (!d) return '';
    const date = new Date(d);
    return isNaN(date.getTime()) ? d : date.toLocaleString();
  };

  const stanceStyle = (stance?: string) => {
    const s = (stance || '').toUpperCase();
    if (s === 'BUY')  return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (s === 'SELL') return 'bg-rose-100 text-rose-800 border-rose-200';
    return 'bg-amber-100 text-amber-800 border-amber-200'; // HOLD / default
  };

  const confidencePct = (v?: number) => {
    const n = typeof v === 'number' ? v : 0;
    // if API returns 0..1, scale; if already 0..100, clamp.
    const pct = n <= 1 ? Math.round(n * 100) : Math.round(n);
    return Math.min(100, Math.max(0, pct));
  };

  const clearAll = useCallback(() => {
    setTopic('');
    setAnalysis(null);
    setError(null);
    inputRef.current?.focus();
  }, []);

  const searchNews = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const query = topic.trim();
    if (!query) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const { data } = await axios.post('/api/analyze', { query });
      setAnalysis(data?.analyses?.[0] || null);
    } catch (err: unknown) {
      setError(
        (axios.isAxiosError(err) && (err.response?.data?.error || err.message)) ||
        (err as Error).message ||
        'Failed to fetch news'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Sticky search bar */}
      <div className="sticky top-0 z-10 bg-gray-100/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto w-full px-4 py-4">
          <form onSubmit={searchNews} className="flex gap-2 items-center">
            <label htmlFor="news-topic" className="sr-only">Search topic</label>
            <input
              id="news-topic"
              ref={inputRef}
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) searchNews(); }}
              className="flex-1 rounded-2xl px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              placeholder="Search a stock, company, or topic… e.g., Tata Motors, Reliance, EV policy"
              disabled={loading}
              autoFocus
            />
            {topic && (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center justify-center h-10 px-3 rounded-2xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="inline-flex items-center justify-center h-10 px-5 rounded-2xl font-medium text-white bg-gradient-to-r from-indigo-600 to-fuchsia-600 shadow disabled:opacity-50"
            >
              {loading ? 'Searching…' : 'Search'}
            </button>
          </form>
          {error && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 w-full">
        <div className="max-w-6xl mx-auto w-full px-4 py-8">
          {!analysis && !loading && !error && (
            <div className="text-gray-400 text-center">
              Type a topic above to analyze news & get a trading stance.
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="animate-pulse space-y-6">
              <div className="h-24 rounded-xl bg-white shadow">
                <div className="h-full w-full rounded-xl bg-gray-200/60" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-40 rounded-xl bg-white shadow">
                    <div className="h-full w-full rounded-xl bg-gray-200/60" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analysis */}
          {analysis && !loading && (
            <div className="space-y-6">

              {/* Summary header */}
              <div className="p-6 rounded-xl bg-white shadow">
                <div className="flex flex-wrap items-center gap-3 mb-3 relative">
                  <div className="text-lg font-semibold">
                    {analysis.symbol.exchange}: {analysis.symbol.symbol}
                  </div>
                  <span className={`px-3 py-1 text-sm rounded-full border ${stanceStyle(analysis.stance)}`}>
                    {analysis.stance}
                  </span>
                  <div className="text-sm text-slate-500">
                    As of: {formatDate(analysis.asOf)}
                  </div>
                  {/* Trade Button - top right */}
                  <div className="absolute right-0 top-0">
                    <button
                      className="px-4 py-2 rounded bg-indigo-600 text-white font-medium shadow hover:bg-indigo-700"
                      onClick={() => setTradeOpen(true)}
                    >
                      Trade
                    </button>
                  </div>
                </div>

                {/* Confidence bar */}
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-700">Confidence</span>
                    <span className="font-medium">{confidencePct(analysis.confidence)}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-indigo-600"
                      style={{ width: `${confidencePct(analysis.confidence)}%` }}
                    />
                  </div>
                </div>
                
                {/* About Section */}
                {analysis.about && (
                  <div className="mt-4">
                    <span className="font-semibold">About:</span>
                    <div className="whitespace-pre-line text-slate-700 mt-1">{analysis.about}</div>
                  </div>
                )}

                {/* Rationale / Risks */}
                <div className="mt-4 space-y-2">
                  <div><span className="font-semibold">Rationale:</span> {analysis.rationale || '—'}</div>
                  {analysis.risks?.length > 0 && (
                    <div><span className="font-semibold">Risks:</span> {analysis.risks.join(', ')}</div>
                  )}
                </div>

                {/* Trade Button moved to header */}

                {/* Trade Modal */}
                {tradeOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
                      <div className="text-lg font-semibold mb-2">Trade {analysis.symbol.symbol}</div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Action</label>
                        <select
                          value={tradeAction}
                          onChange={e => setTradeAction(e.target.value as 'BUY' | 'SELL' | 'HOLD')}
                          className="w-full rounded border px-3 py-2"
                        >
                          <option value="BUY">Buy</option>
                          <option value="SELL">Sell</option>
                          <option value="HOLD">Hold</option>
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Quantity</label>
                        <input
                          type="number"
                          min={1}
                          value={tradeQty}
                          onChange={e => setTradeQty(Number(e.target.value))}
                          className="w-full rounded border px-3 py-2"
                        />
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          className="px-4 py-2 rounded bg-indigo-600 text-white font-medium shadow hover:bg-indigo-700"
                          onClick={async () => {
                            setTradeStatus(null);
                            // TODO: Call backend API here
                            setTradeStatus(`Trade placed: ${tradeAction} ${tradeQty} ${analysis.symbol.symbol}`);
                            setTimeout(() => setTradeOpen(false), 1200);
                          }}
                        >
                          Confirm
                        </button>
                        <button
                          className="px-4 py-2 rounded bg-gray-200 text-gray-800 font-medium shadow hover:bg-gray-300"
                          onClick={() => { setTradeOpen(false); setTradeStatus(null); }}
                        >
                          Cancel
                        </button>
                      </div>
                      {tradeStatus && (
                        <div className="mt-3 text-green-700 text-sm font-medium">{tradeStatus}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Catalyst Section */}
                {analysis.catalysts && (
                  <div className="mt-4">
                    <span className="font-semibold">Catalyst:</span>
                    <div className="whitespace-pre-line text-slate-700 mt-1">{analysis.catalysts}</div>
                  </div>
                )}
              </div>

              {/* Headlines grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(analysis.headlines?.length ? analysis.headlines : []).map((h, idx) => (
                  <article
                    key={`${h.url}-${idx}`}
                    className="border rounded-xl bg-white p-5 shadow hover:shadow-md transition-shadow min-h-40 flex flex-col justify-between"
                  >
                    <div>
                      <a
                        href={h.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-lg font-semibold text-indigo-700 hover:underline"
                      >
                        {h.title}
                      </a>
                      {(h.source || h.date) && (
                        <div className="mt-1 text-sm text-slate-500 space-x-2">
                          {h.source && <span>{h.source}</span>}
                          {h.date && <span className="text-slate-400">· {h.date}</span>}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
