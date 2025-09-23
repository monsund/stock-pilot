'use client';

import React, { useMemo } from 'react';
import '@/lib/chart'; // side-effect: registers scales/controllers
/// <reference types="chartjs-chart-financial" />
import type { ChartData, ChartOptions } from 'chart.js';
import { Chart as ReactChart } from 'react-chartjs-2';

type Candle = {
  timestamp: string | number | Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

type Props = {
  title?: string;
  candles: Candle[];
  symbol?: string;
  intervalLabel?: string; // e.g., "1d", "15m"
};

function toMs(x: Candle['timestamp']) {
  if (typeof x === 'number') return x < 1e12 ? x * 1000 : x; // sec→ms if needed
  return new Date(x).getTime();
}

export default function CandleCard({ title = 'Candles', candles, symbol, intervalLabel }: Props) {
  const unit = useMemo(() => {
    if (candles.length < 2) return 'day';
    const d0 = toMs(candles[0].timestamp);
    const d1 = toMs(candles[1].timestamp);
    // crude pick: >= ~20h apart ⇒ day, else minute
    return Math.abs(d1 - d0) >= 20 * 60 * 60 * 1000 ? 'day' : 'minute';
  }, [candles]);

  const lastClose = candles.at(-1)?.close;

  const data = useMemo<ChartData<'candlestick'>>(() => {
    const points = candles
      .map(c => {
        const x = toMs(c.timestamp);
        if (!Number.isFinite(x)) return null;
        return { x, o: c.open, h: c.high, l: c.low, c: c.close };
      })
      .filter(Boolean) as Array<{ x: number; o: number; h: number; l: number; c: number }>;

    return {
      datasets: [
        {
          label: [symbol, intervalLabel].filter(Boolean).join(' • ') || 'Price',
          data: points,
          upColor: 'rgba(16,185,129,0.9)',    // green
          downColor: 'rgba(239,68,68,0.9)',   // red
          borderColor: 'rgba(55,65,81,0.9)',
          wickColor: 'rgba(55,65,81,0.7)',
        },
      ],
    };
  }, [candles, symbol, intervalLabel]);

  const options = useMemo<ChartOptions<'candlestick'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      parsing: false, // dataset already {x,o,h,l,c}
      plugins: {
        legend: { display: false },
        tooltip: { mode: 'index', intersect: false },
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit,
            tooltipFormat: unit === 'day' ? 'yyyy-MM-dd' : 'yyyy-MM-dd HH:mm',
          },
          grid: { display: false },
          ticks: { maxTicksLimit: 10 },
        },
        y: {
          position: 'right',
          grid: { color: 'rgba(0,0,0,0.06)' },
        },
      },
    }),
    [unit]
  );

  return (
    <div className="bg-white rounded-xl shadow p-4 w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-slate-500">
          Last Close: <b>{lastClose ?? '—'}</b> · Points: {candles.length}
        </div>
      </div>
      <div className="h-80 w-full flex items-center justify-center">
        {candles.length > 1 ? (
          <ReactChart type="candlestick" data={data} options={options} />
        ) : candles.length === 1 ? (
          <div className="flex flex-col items-center justify-center h-full w-full">
            <div className="grid grid-cols-2 gap-4 w-full max-w-xs mb-2">
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-center">
                <div className="text-xs text-gray-500">Open</div>
                <div className="text-lg font-semibold text-emerald-700">₹{candles[0].open}</div>
              </div>
              <div className="rounded-xl bg-rose-50 px-4 py-3 text-center">
                <div className="text-xs text-gray-500">Close</div>
                <div className="text-lg font-semibold text-rose-700">₹{candles[0].close}</div>
              </div>
              <div className="rounded-xl bg-gray-50 px-4 py-3 text-center">
                <div className="text-xs text-gray-500">High</div>
                <div className="text-lg font-semibold text-gray-700">₹{candles[0].high}</div>
              </div>
              <div className="rounded-xl bg-gray-50 px-4 py-3 text-center">
                <div className="text-xs text-gray-500">Low</div>
                <div className="text-lg font-semibold text-gray-700">₹{candles[0].low}</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500">Volume: <span className="font-semibold">{candles[0].volume ?? '—'}</span></div>
          </div>
        ) : (
          <div className="text-slate-400 text-sm">No candles</div>
        )}
      </div>
    </div>
  );
}
