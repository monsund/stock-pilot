'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios, { CancelTokenSource } from 'axios';

type Headline = {
  title: string;
  url: string;
  source?: string;
  date?: string;
};

type Analysis = {
  id: string;
  symbol: { exchange: string; symbol: string };
  articleId?: string;
  stance: string;      // BUY | SELL | HOLD
  confidence: number;  // 0..1 or 0..100
  rationale: string;
  risks: string[];
  asOf: string;        // ISO
  headlines: Headline[];
  sources: string[];
  about?: string;
  catalysts?: string;
};

// ---------- tiny UI helpers ----------
const stanceBadge = (s?: string) => {
  const v = (s || '').toUpperCase();
  if (v === 'BUY') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (v === 'SELL') return 'bg-rose-100 text-rose-800 border-rose-200';
  return 'bg-amber-100 text-amber-800 border-amber-200';
};
const toPct = (n?: number) => {
  const v = typeof n === 'number' ? n : 0;
  const p = v <= 1 ? Math.round(v * 100) : Math.round(v);
  return Math.min(100, Math.max(0, p));
};
const fmtDate = (d?: string) => {
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleString();
};

// ---------- localStorage recent searches ----------
const RECENT_KEY = 'sp_recent_searches';
const getRecent = (): string[] => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').slice(0, 8); }
  catch { return []; }
};
const pushRecent = (q: string) => {
  const cur = getRecent();
  const next = [q, ...cur.filter(x => x.toLowerCase() !== q.toLowerCase())].slice(0, 8);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
};

// ---------- main page ----------
export default function NewsSearchPage() {
  const recentDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useSearchParams();

  const initialQ = params.get('q') || '';
  const [topic, setTopic] = useState(initialQ);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<CancelTokenSource | null>(null);
  const debounceRef = useRef<number | null>(null);

  // focus shortcut
  useEffect(() => {
    const onK = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setShowRecent(true);
      }
      if (e.key === 'Escape') setShowRecent(false);
    };
    window.addEventListener('keydown', onK);
    return () => window.removeEventListener('keydown', onK);
  }, []);

  // Click-away to close recent dropdown
  useEffect(() => {
    if (!showRecent) return;
    function handleClick(e: MouseEvent) {
      const input = inputRef.current;
      const dropdown = recentDropdownRef.current;
      if (!input || !dropdown) return;
      if (
        !input.contains(e.target as Node) &&
        !dropdown.contains(e.target as Node)
      ) {
        setShowRecent(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showRecent]);

  // load recents once on client
  useEffect(() => setRecent(getRecent()), []);

  // if URL had ?q=, auto-run once
  useEffect(() => {
    if (initialQ) doSearch(initialQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // Run search when topic changes due to recent selection
  useEffect(() => {
    if (!showRecent && topic && topic !== initialQ) {
      doSearch(topic);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, showRecent]);

  const confidenceBarWidth = useMemo(() => `${toPct(analysis?.confidence)}%`, [analysis?.confidence]);

  const clearAll = useCallback(() => {
    setTopic('');
    setAnalysis(null);
    setError(null);
    setShowRecent(false);
    router.replace('/chat', { scroll: false });
    inputRef.current?.focus();
  }, [router]);

  const doSearch = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) return;

    // cancel any inflight call
    cancelRef.current?.cancel('New search started');
    cancelRef.current = axios.CancelToken.source();

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const { data } = await axios.post(
        '/api/analyze',
        { query: q },
        { cancelToken: cancelRef.current.token }
      );
      const item: Analysis | null = data?.analyses?.[0] || null;
      setAnalysis(item);
      pushRecent(q);
      setRecent(getRecent());
      router.replace(`/chat?q=${encodeURIComponent(q)}`, { scroll: false });
    } catch (err: unknown) {
      if (axios.isCancel(err)) return; // user-initiated cancel
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || err.message || 'Failed to analyze news.');
      } else if (err instanceof Error) {
        setError(err.message || 'Failed to analyze news.');
      } else {
        setError('Failed to analyze news.');
      }
    } finally {
      setLoading(false);
      setShowRecent(false);
    }
  }, [router]);

  const onSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    doSearch(topic);
  }, [doSearch, topic]);

  // debounce: fetch suggestions later if you add them; for now, we just keep UI snappy
  const onChange = (v: string) => {
    setTopic(v);
    setError(null);
    setShowRecent(true);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      // reserved for live suggestions; no-op for now
    }, 300);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Page Introduction */}
      <div className="max-w-6xl mx-auto w-full px-4 pt-8 pb-2">
        <div className="rounded-xl bg-white/80 border border-gray-200 shadow p-5 mb-4">
          <h1 className="text-2xl font-bold mb-2 text-indigo-700">News & Stock Analysis</h1>
          <p className="text-gray-700 text-base">
            Search for a stock, company, or topic to analyze recent news and get a trading stance (BUY/SELL/HOLD) with confidence, rationale, risks, and catalysts. Recent searches are saved for quick access.
          </p>
        </div>
      </div>
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-gray-100/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto w-full px-4 py-4">
          <form onSubmit={onSubmit} className="relative flex gap-2 items-center">
            <label htmlFor="news-topic" className="sr-only">Search topic</label>
            <input
              id="news-topic"
              ref={inputRef}
              type="text"
              value={topic}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) onSubmit(); }}
              placeholder="Search a stock, or company, e.g., Tata Motors, Reliance, Tata Power"
              className="flex-1 rounded-2xl px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              autoFocus
              aria-autocomplete="list"
              disabled={loading}
              onFocus={() => setShowRecent(true)}
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

            {/* Recent dropdown */}
            {showRecent && recent.length > 0 && (
              <div
                ref={recentDropdownRef}
                role="listbox"
                className="absolute left-0 right-40 top-14 bg-white border border-gray-200 rounded-xl shadow-lg p-2 max-h-64 overflow-auto"
                onMouseLeave={() => setShowRecent(false)}
              >
                <div className="px-2 pb-1 text-xs text-slate-500">Recent</div>
                {recent.map((q) => (
                  <button
                    key={q}
                    role="option"
                    aria-selected={topic === q}
                    onClick={() => {
                      if (topic !== q) {
                        setTopic(q);
                        setShowRecent(false);
                      }
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </form>

          {error && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 flex items-start justify-between gap-4">
              <div className="leading-snug">{error}</div>
              <button
                onClick={() => doSearch(topic)}
                className="shrink-0 h-9 px-3 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 w-full">
        <div className="max-w-6xl mx-auto w-full px-4 py-8">
          {/* Empty state */}
          {!analysis && !loading && !error && (
            <div className="text-center text-slate-500 space-y-4">
              <p>Type a stock name above to analyze news & get a trading stance.</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['Tata Motors', 'Reliance', 'Tata Power', 'Adani Ports'].map((ex) => (
                  <button
                    key={ex}
                    onClick={() => { setTopic(ex); doSearch(ex); }}
                    className="px-3 py-1 rounded-full border text-sm hover:bg-gray-50"
                  >
                    {ex}
                  </button>
                ))}
              </div>
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

          {/* Result */}
          {analysis && !loading && (
            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-white shadow relative">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <div className="text-lg font-semibold">
                    {analysis.symbol.symbol}
                  </div>
                  <span className={`px-3 py-1 text-sm rounded-full border ${stanceBadge(analysis.stance)}`}>
                    {analysis.stance}
                  </span>
                  <div className="text-sm text-slate-500">As of: {fmtDate(analysis.asOf)}</div>
                </div>

                {/* Confidence */}
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-700">Confidence</span>
                    <span className="font-medium">{toPct(analysis.confidence)}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-2 rounded-full bg-indigo-600" style={{ width: confidenceBarWidth }} />
                  </div>
                </div>

                {/* About / Rationale / Risks / Catalysts */}
                {analysis.about && (
                  <Section title="About">
                    <p className="whitespace-pre-line text-slate-700">{analysis.about}</p>
                  </Section>
                )}
                <Section title="Rationale">
                  <p className="text-slate-700">{analysis.rationale || '—'}</p>
                </Section>
                {!!analysis.risks?.length && (
                  <Section title="Risks">
                    <p className="text-slate-700">{analysis.risks.join(', ')}</p>
                  </Section>
                )}
                {analysis.catalysts && (
                  <Section title="Catalysts">
                    <p className="whitespace-pre-line text-slate-700">{analysis.catalysts}</p>
                  </Section>
                )}

                {/* Trade CTA */}
                <div className="absolute right-4 top-4">
                  <button
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium shadow hover:bg-indigo-700"
                    onClick={() => router.push('/trade')}
                  >
                    Trade
                  </button>
                </div>
              </div>

              {/* Headlines */}
              {!!analysis.headlines?.length && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {analysis.headlines.map((h, i) => (
                    <article
                      key={`${h.url}-${i}`}
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
                          <div className="mt-2 text-sm text-slate-500 space-x-2">
                            {h.source && <span>{h.source}</span>}
                            {h.date && <span className="text-slate-400">· {h.date}</span>}
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- small inline component ----------
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="font-semibold">{title}:</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}
