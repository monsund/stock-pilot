'use client';

import React from 'react';

type LtpData = {
  ltp: number;
  exchange: string;
  tradingsymbol: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
};

type Candle = { close: number };

function formatPrice(n?: number) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function Sparkline({ points }: { points: number[] }) {
  if (!points.length) return null;
  const w = 160;
  const h = 40;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = Math.max(max - min, 1e-9);
  const step = w / (points.length - 1 || 1);

  const d = points
    .map((p, i) => {
      const x = i * step;
      const y = h - ((p - min) / span) * h;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  const rising = points[points.length - 1] >= points[0];
  const stroke = rising ? 'rgb(5 150 105)' /* emerald-600 */ : 'rgb(225 29 72)'; /* rose-600 */

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="ltp sparkline">
      <path d={d} fill="none" stroke={stroke} strokeWidth="2" />
    </svg>
  );
}

export default function LtpCard({
  data,
  loading,
  onRefresh,
  lastUpdatedISO,
  candles = [],
}: {
  data?: LtpData;
  loading: boolean;
  onRefresh: () => void;
  lastUpdatedISO?: string;
  candles?: Candle[];
}) {
  const price = data?.ltp ?? undefined;
  const prev = data?.close ?? undefined;
  const delta = price != null && prev != null ? price - prev : undefined;
  const pct = delta != null && prev ? (delta / prev) * 100 : undefined;

  const badgeColor =
    delta == null
      ? 'bg-gray-100 text-gray-600'
      : delta >= 0
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-rose-100 text-rose-700';

  const series = candles.slice(-24).map((c) => c.close);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white/90 backdrop-blur shadow-sm hover:shadow-md transition p-5 flex flex-col items-center text-center">
      {/* Refresh button on top */}
      <div className="w-full flex justify-end mb-2">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="rounded-xl border px-4 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Get LTP'}
        </button>
      </div>
      {/* Price + change, stats, etc. */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[220px]">
          <span className="animate-spin h-8 w-8 border-4 border-indigo-300 border-t-indigo-600 rounded-full inline-block" />
        </div>
      ) : (
        <>
          <div className="text-4xl font-bold tabular-nums">₹{formatPrice(price)}</div>
          <span
            className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${badgeColor}`}
          >
            {delta == null ? '—' : delta >= 0 ? '▲' : '▼'} {formatPrice(delta != null ? Math.abs(delta) : undefined)}
            {pct != null && (
              <span className="ml-1 opacity-80">
                ({pct >= 0 ? '+' : '-'}
                {Math.abs(pct).toFixed(2)}%)
              </span>
            )}
          </span>

          {/* Symbol */}
          <div className="mt-2 text-xs text-gray-500">
            {data?.tradingsymbol} <span className="opacity-70">({data?.exchange})</span>
          </div>

          {/* Sparkline */}
          {series.length > 1 && (
            <div className="mt-4 w-[160px] h-[40px]">
              <Sparkline points={series} />
            </div>
          )}

          {/* Stats */}
          <div className="mt-4 grid grid-cols-2 gap-4 text-xs w-full max-w-xs">
            <div className="rounded-xl bg-gray-50 px-3 py-2">
              <div className="text-gray-500">Open</div>
              <div className="font-medium">₹{formatPrice(data?.open)}</div>
            </div>
            <div className="rounded-xl bg-gray-50 px-3 py-2">
              <div className="text-gray-500">High</div>
              <div className="font-medium">₹{formatPrice(data?.high)}</div>
            </div>
            <div className="rounded-xl bg-gray-50 px-3 py-2">
              <div className="text-gray-500">Low</div>
              <div className="font-medium">₹{formatPrice(data?.low)}</div>
            </div>
            <div className="rounded-xl bg-gray-50 px-3 py-2">
              <div className="text-gray-500">Prev Close</div>
              <div className="font-medium">₹{formatPrice(data?.close)}</div>
            </div>
          </div>

          {/* Timestamp */}
          <div className="mt-4 text-[11px] text-gray-400">
            {lastUpdatedISO
              ? `Last updated: ${new Date(lastUpdatedISO).toLocaleString()}`
              : 'Last updated: just now'}
          </div>
        </>
      )}
    </div>
  );
}

