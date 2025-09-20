'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAngelLogin, useLTP, useCandles, useOrders, usePlaceOrder, usePositions } from '@/hooks/useAngel';
import ExchangeSelect from '@/components/trade/ExchangeSelect';
import SymbolInput from '@/components/trade/SymbolInput';
import CandleCard from '@/components/trade/CandleCard';

export default function TradePage() {
  // Map UI interval to backend interval
  const intervalMap: Record<string, string> = {
    '1m': 'ONE_MINUTE',
    '5m': 'FIVE_MINUTE',
    '15m': 'FIFTEEN_MINUTE',
    '1h': 'ONE_HOUR',
    '1d': 'ONE_DAY',
  };

  const [showLtpError, setShowLtpError] = useState(false);

  const [exchange, setExchange] = useState('NSE');
  const [symbol, setSymbol] = useState('TATAMOTORS');
  const [tf, setTf] = useState('15m');
  const [fromDate, setFromDate] = useState('2025-09-01 09:15');
  const [toDate, setToDate] = useState('2025-09-20 15:30');

  const { data: ltp, error: ltpError, refresh: refreshLTP } = useLTP({ exchange, tradingsymbol: symbol });
  const { data: candles, refresh: refreshCandles } = useCandles({
    exchange,
    tradingsymbol: symbol,
    interval: intervalMap[tf],
    from_date: fromDate,
    to_date: toDate,
  });


   // --- client-only auth state to avoid hydration mismatches ---
  const [authReady, setAuthReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(!!localStorage.getItem('angel_token'));
    setAuthReady(true);
  }, []);

  const handleLogin = async () => {
    await login();
    setHasToken(!!localStorage.getItem('angel_token'));
  };

  const handleLogout = () => {
    localStorage.removeItem('angel_token');
    setHasToken(false);
    location.reload();
  };

  // Show snackbar when ltpError changes
  useEffect(() => {
    if (ltpError) setShowLtpError(true);
  }, [ltpError]);

  const { error: loginError, login } = useAngelLogin();


  const { orders, refresh: refreshOrders } = useOrders();
  const { positions, refresh: refreshPositions } = usePositions();
  const { place, submitting, error: orderError } = usePlaceOrder();

  // Helper to extract candle values safely
  function getCandleValue(candle: unknown, key: string, idx: number) {
    if (candle && typeof candle === 'object' && !Array.isArray(candle)) {
      if (key in candle) return (candle as Record<string, number | string>)[key];
      // Support legacy keys and new meaningful names
      const legacyMap: Record<string, string> = {
        t: 'timestamp',
        o: 'open',
        h: 'high',
        l: 'low',
        c: 'close',
        v: 'volume',
      };
      if (Object.keys(legacyMap).includes(key) && legacyMap[key] in candle) return (candle as Record<string, unknown>)[legacyMap[key]];
      if (['timestamp','open','high','low','close','volume'].includes(key) && key in candle) return (candle as Record<string, unknown>)[key];
    }
    if (Array.isArray(candle)) return candle[idx];
    return undefined;
  }

  const lastClose = useMemo(() => {
    const last = candles.at(-1);
    return last ? getCandleValue(last, 'close', 4) || getCandleValue(last, 'c', 4) : undefined;
  }, [candles]);


  async function handlePlace(side: 'BUY' | 'SELL') {
  await place({ symbol, side, qty: 1, type: 'MKT' });
    await Promise.all([refreshOrders(), refreshPositions()]);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {ltpError && showLtpError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-rose-600 text-white px-4 py-2 rounded shadow-lg z-50 flex items-center gap-2 animate-fade-in">
          <span>Could not fetch LTP. Please verify the stock symbol.</span>
          <button
            onClick={() => setShowLtpError(false)}
            className="ml-2 text-white hover:text-rose-200 text-lg font-bold px-2"
            aria-label="Close"
          >×</button>
        </div>
      )}
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Trade</h1>
          <div className="flex items-center gap-2">
             {authReady && (
              hasToken ? (
                <button onClick={handleLogout} className="text-xs px-3 py-2 rounded border">Logout</button>
              ) : (
                <button onClick={handleLogin} className="text-xs px-3 py-2 rounded border">Login</button>
              )
            )}
          </div>
        </header>

        {loginError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{loginError}</div>}
        {orderError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{orderError}</div>}

        {/* Controls */}
        <section className="bg-white rounded-xl shadow p-4 flex flex-wrap items-end gap-3">
          <ExchangeSelect value={exchange} onChange={setExchange} />
          <SymbolInput value={symbol} onChange={setSymbol} />
          <div className="ml-auto flex gap-2">
            <button onClick={refreshLTP} className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-slate-200 text-slate-800 hover:bg-slate-300">LTP</button>
            <button onClick={refreshCandles} className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-slate-200 text-slate-800 hover:bg-slate-300">Candles</button>
            <button onClick={() => handlePlace('BUY')} disabled={submitting} className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">Buy</button>
            <button onClick={() => handlePlace('SELL')} disabled={submitting} className="inline-flex items-center justify-center h-10 px-4 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50">Sell</button>
          </div>
        </section>

        {/* Market snapshot */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow p-4">
            <div className="text-sm text-slate-500">LTP</div>
            {ltp?.status && ltp?.data ? (
              <div>
                <div className="text-2xl font-semibold">{ltp?.data?.ltp}</div>
                <div className="text-xs text-slate-400 mt-1">{ltp?.data?.tradingsymbol} ({ltp?.data?.exchange})</div>
                <div className="text-xs text-slate-400 mt-1">Open: {ltp?.data?.open} | High: {ltp?.data?.high} | Low: {ltp?.data?.low} | Close: {ltp?.data?.close}</div>
              </div>
            ) : (
              <div>
                <div className="text-2xl font-semibold">—</div>
                <div className="text-xs text-slate-400 mt-1">{symbol}</div>
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl shadow p-4 md:col-span-2">
            <div className="text-sm text-slate-500 flex flex-wrap items-center justify-between gap-2">
              <span>Candles ({tf})</span>
              <select
                value={tf}
                onChange={e => setTf(e.target.value)}
                className="rounded-lg border px-2 py-1 text-xs"
              >
                <option>1m</option>
                <option>5m</option>
                <option>15m</option>
                <option>1h</option>
                <option>1d</option>
              </select>
              <div className="flex items-center gap-2">
                <label className="text-xs">From</label>
                <input type="text" value={fromDate} onChange={e => setFromDate(e.target.value)} placeholder="YYYY-MM-DD HH:MM" className="rounded border px-2 py-1 text-xs w-40" />
                <label className="text-xs">To</label>
                <input type="text" value={toDate} onChange={e => setToDate(e.target.value)} placeholder="YYYY-MM-DD HH:MM" className="rounded border px-2 py-1 text-xs w-40" />
                <span className="text-xs text-slate-400 ml-2">Format: <b>YYYY-MM-DD HH:MM</b></span>
              </div>
            </div>
            <div className="mt-2 text-sm text-slate-700">
              {candles.length ? (
                <div>
                   <CandleCard
                      title="Candles"
                      candles={candles}      // your hook already returns the shown shape
                      symbol={symbol}
                      intervalLabel={tf}
                    />
                  <div>Last Close: <b>{lastClose}</b></div>
                  <div className="text-xs text-slate-500">Points: {candles.length}</div>
                </div>
              ) : (
                <div className="text-slate-400">No candles loaded</div>
              )}
            </div>
          </div>
        </section>

        {/* Orders & Positions */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Orders</h2>
              <button onClick={refreshOrders} className="text-xs px-2 py-1 rounded border">Refresh</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr><th>ID</th><th>Symbol</th><th>Side</th><th>Qty</th><th>Status</th><th>Avg Px</th><th>Time</th></tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.orderId} className="border-t">
                      <td className="py-1 pr-3">{o.orderId}</td>
                      <td className="py-1 pr-3">{o.symbol}</td>
                      <td className="py-1 pr-3">{o.side}</td>
                      <td className="py-1 pr-3">{o.qty}</td>
                      <td className="py-1 pr-3">{o.status}</td>
                      <td className="py-1 pr-3">{o.avgPrice ?? '—'}</td>
                      <td className="py-1 pr-3">{o.time}</td>
                    </tr>
                  ))}
                  {!orders.length && <tr><td colSpan={7} className="py-2 text-slate-400">No orders yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Positions</h2>
              <button onClick={refreshPositions} className="text-xs px-2 py-1 rounded border">Refresh</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr><th>Symbol</th><th>Qty</th><th>Avg Px</th><th>PNL</th></tr>
                </thead>
                <tbody>
                  {positions.map(p => (
                    <tr key={p.symbol} className="border-t">
                      <td className="py-1 pr-3">{p.symbol}</td>
                      <td className="py-1 pr-3">{p.qty}</td>
                      <td className="py-1 pr-3">{p.avgPrice}</td>
                      <td className="py-1 pr-3">{p.pnl ?? '—'}</td>
                    </tr>
                  ))}
                  {!positions.length && <tr><td colSpan={4} className="py-2 text-slate-400">No positions</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
    </div>
  );
}
