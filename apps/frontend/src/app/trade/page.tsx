'use client';

import { useState, useEffect, useRef } from 'react';
import {
  useLTP,
  useCandles,
  useOrders,
  usePlaceOrder,
  usePositions,
} from '@/hooks/useAngel';

import ExchangeSelect from '@/components/trade/ExchangeSelect';
import SymbolInput from '@/components/trade/SymbolInput';
import CandleCard from '@/components/trade/CandleCard';
import TradeOrderModal from '@/components/trade/TradeOrderModal';
import LtpCard from '@/components/trade/LtpCard';

const card =
  'rounded-2xl border border-gray-200 bg-white/90 backdrop-blur shadow-sm hover:shadow-md transition';

function getMonthStart() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01 09:15`;
}

function getNowDateTime() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export default function TradePage() {
  // Map UI interval to backend interval
  const intervalMap: Record<string, string> = {
    '1m': 'ONE_MINUTE',
    '5m': 'FIVE_MINUTE',
    '15m': 'FIFTEEN_MINUTE',
    '1h': 'ONE_HOUR',
    '1d': 'ONE_DAY',
  };

    const [ltpLoading, setLtpLoading] = useState(false);
    const [candlesLoading, setCandlesLoading] = useState(false);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [positionsLoading, setPositionsLoading] = useState(false);
  const [exchange, setExchange] = useState('NSE');
  const [symbol, setSymbol] = useState('TATAPOWER');
  const [tf, setTf] = useState<'1m' | '5m' | '15m' | '1h' | '1d'>('1d');

  const [fromDate, setFromDate] = useState(getMonthStart());
  const [toDate, setToDate] = useState(getNowDateTime());

  const { data: ltp, refresh: refreshLTP } = useLTP({
    exchange,
    tradingsymbol: symbol,
  });
  // Button handlers with loading state
  async function handleRefreshLTP() {
    setLtpLoading(true);
    await refreshLTP();
    setLtpLoading(false);
  }

  async function handleRefreshCandles() {
    setCandlesLoading(true);
    await refreshCandles();
    setCandlesLoading(false);
  }

  async function handleRefreshOrders() {
    setOrdersLoading(true);
    await refreshOrders();
    setOrdersLoading(false);
  }

  async function handleRefreshPositions() {
    setPositionsLoading(true);
    await refreshPositions();
    setPositionsLoading(false);
  }

  const { data: candles, refresh: refreshCandles } = useCandles({
    exchange,
    tradingsymbol: symbol,
    interval: intervalMap[tf],
    from_date: fromDate,
    to_date: toDate,
  });
  console.log('qaz---candles',  candles);

  const { orders, refresh: refreshOrders } = useOrders();
  const { positions, refresh: refreshPositions } = usePositions();
  const { place, submitting } = usePlaceOrder();

  // Order modal state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({
    exchange: 'NSE',
    tradingsymbol: 'TATAMOTORS',
    transactiontype: 'BUY' as 'BUY' | 'SELL',
    quantity: 1,
    ordertype: 'MARKET',
    price: '',
  });

  // Keep modal form in sync with top controls
  useEffect(() => {
    setOrderForm((f) => ({ ...f, exchange, tradingsymbol: symbol }));
  }, [exchange, symbol]);

  // Ref to ensure LTP is fetched only once on mount
  const didLTPFetch = useRef(false);

  // Initial fetches
  useEffect(() => {
    const timer = setTimeout(() => {
      if (symbol && exchange && intervalMap[tf] && fromDate && toDate) {
        handleRefreshCandles();
      }
    }, 1000);
    if (!didLTPFetch.current) {
      handleRefreshLTP();
      handleRefreshOrders();
      handleRefreshPositions();
      didLTPFetch.current = true;
    }
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleOrderFieldChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setOrderForm((f) => ({
      ...f,
      [name]:
        name === 'transactiontype' ? (value as 'BUY' | 'SELL') : value,
    }));
  }

  async function handleOrderSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload = {
      exchange: orderForm.exchange,
      tradingsymbol: orderForm.tradingsymbol,
      transactiontype: orderForm.transactiontype,
      quantity: Number(orderForm.quantity),
      ordertype: orderForm.ordertype,
      price:
        orderForm.ordertype === 'LIMIT'
          ? Number(orderForm.price)
          : undefined,
    };
    await place(payload);
    setShowOrderModal(false);
    await Promise.all([refreshOrders(), refreshPositions()]);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Modal */}
      <TradeOrderModal
        show={showOrderModal}
        submitting={submitting}
        orderForm={orderForm}
        onClose={() => setShowOrderModal(false)}
        onChange={handleOrderFieldChange}
        onSubmit={handleOrderSubmit}
      />

      {/* Top bar */}
      <div className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-semibold">
                ₹
              </span>
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                  Trade
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  <span className="text-sm text-gray-500 font-normal">
                    Place orders (<span className="font-semibold text-emerald-700">paper trading</span>), track positions (<span className="font-semibold text-emerald-700">paper trading</span>), view LTP (<span className="font-semibold text-indigo-700">real time</span>), and inspect candles (<span className="font-semibold text-indigo-700">real time</span>).
                  </span>
                </p>
              </div>
            </div>
            {/* Login/Logout moved to navbar */}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        {/* Controls */}
        <section className={`${card} p-4 md:p-5 relative z-10`}>
          {/* Give the middle controls more room on lg+ screens */}
          <div className="grid grid-cols-1 gap-3 lg:[grid-template-columns:1fr_2.4fr_auto]">
            {/* Left column */}
            <div className="flex items-end gap-3 min-w-0 w-full max-w-2xl">
              <div className="flex-1 min-w-0">
                <ExchangeSelect value={exchange} onChange={setExchange} />
              </div>
              <div className="w-3" />
              <div className="flex-[2] min-w-0">
                <SymbolInput value={symbol} onChange={setSymbol} />
              </div>
            </div>

            {/* Middle column (wrap if tight) */}
            <div className="flex items-end gap-3 flex-wrap min-w-0">
              <div className="flex-[1] min-w-[80px] max-w-[100px]">
                <label className="text-[11px] text-gray-500">Interval</label>
                <select
                  value={tf}
                  onChange={(e) =>
                    setTf(e.target.value as '1m' | '5m' | '15m' | '1h' | '1d')
                  }
                  className="w-full rounded-xl border px-2 py-2 text-sm"
                >
                  <option value="1m">1m</option>
                  <option value="5m">5m</option>
                  <option value="15m">15m</option>
                  <option value="1h">1h</option>
                  <option value="1d">1d</option>
                </select>
              </div>
              <div className="flex-[1] min-w-[180px]">
                <label className="text-[11px] text-gray-500">
                  From (date & time)
                </label>
                <input
                  type="datetime-local"
                  value={fromDate.replace(' ', 'T')}
                  onChange={(e) => setFromDate(e.target.value.replace('T', ' '))}
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                />
              </div>
              <div className="flex-[1] min-w-[180px]">
                <label className="text-[11px] text-gray-500">
                  To (date & time)
                </label>
                <input
                  type="datetime-local"
                  value={toDate.replace(' ', 'T')}
                  onChange={(e) => setToDate(e.target.value.replace('T', ' '))}
                  className="w-full rounded-xl border px-3 py-2 text-sm relative z-10"
                />
              </div>
            </div>

            {/* Right column */}
            <div className="flex items-end justify-end gap-2 w-full lg:w-auto relative z-0">
              <button
                onClick={() => {
                  setOrderForm((f) => ({ ...f, transactiontype: 'BUY' }));
                  setShowOrderModal(true);
                }}
                disabled={submitting}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                Buy
              </button>
              <button
                onClick={() => {
                  setOrderForm((f) => ({ ...f, transactiontype: 'SELL' }));
                  setShowOrderModal(true);
                }}
                disabled={submitting}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
              >
                Sell
              </button>
            </div>
          </div>
        </section>

        {/* Market snapshot */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LTP */}
          <LtpCard
            data={
              ltp?.status && ltp?.data
                ? {
                    ltp: ltp.data.ltp,
                    exchange: ltp.data.exchange,
                    tradingsymbol: ltp.data.tradingsymbol,
                    open: ltp.data.open,
                    high: ltp.data.high,
                    low: ltp.data.low,
                    close: ltp.data.close,
                  }
                : undefined
            }
            loading={ltpLoading}
            onRefresh={handleRefreshLTP}
            lastUpdatedISO={new Date().toISOString()}
            candles={candles?.length ? candles : []}
          />

          {/* Candles */}
          <div className={`${card} p-5 lg:col-span-2`}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Candles ({tf})</h2>
              <button
                onClick={handleRefreshCandles}
                className="rounded-xl border px-3 py-1.5 text-xs hover:bg-gray-50"
              >
                {candlesLoading ? 'Loading...' : 'Get Candles'}
              </button>
            </div>
            <div className="mt-4 h-[380px] flex items-center justify-center">
              {candlesLoading ? (
                <span className="animate-spin h-8 w-8 border-4 border-indigo-300 border-t-indigo-600 rounded-full inline-block" />
              ) : candles.length ? (
                <CandleCard
                  title=""
                  candles={candles}
                  symbol={symbol}
                  intervalLabel={tf}
                />
              ) : (
                <div className="grid h-full place-items-center text-gray-400 text-sm">
                  No candles yet. Click “Get Candles”.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Orders & Positions */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`${card} p-5`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Orders</h3>
              <button
                onClick={handleRefreshOrders}
                className="rounded-xl border px-3 py-1.5 text-xs hover:bg-gray-50"
              >
                {ordersLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            <div className="overflow-auto min-h-[60px] flex items-center justify-center">
              {ordersLoading ? (
                <span className="animate-spin h-6 w-6 border-4 border-indigo-300 border-t-indigo-600 rounded-full inline-block" />
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="text-left text-gray-500">
                    <tr className="border-b">
                      <th className="py-2 pr-3">ID</th>
                      <th className="py-2 pr-3">Mode</th>
                      <th className="py-2 pr-3">Exchange</th>
                      <th className="py-2 pr-3">Symbol</th>
                      <th className="py-2 pr-3">Token</th>
                      <th className="py-2 pr-3">Side</th>
                      <th className="py-2 pr-3">Order Type</th>
                      <th className="py-2 pr-3">Qty</th>
                      <th className="py-2 pr-3">Price</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.orderid} className="border-b last:border-0">
                        <td className="py-2 pr-3 font-mono text-[11px]">
                          {o.orderid}
                        </td>
                        <td className="py-2 pr-3">{o.mode}</td>
                        <td className="py-2 pr-3">{o.exchange}</td>
                        <td className="py-2 pr-3">{o.tradingsymbol}</td>
                        <td className="py-2 pr-3">{o.symboltoken}</td>
                        <td className="py-2 pr-3">{o.transactiontype}</td>
                        <td className="py-2 pr-3">{o.ordertype}</td>
                        <td className="py-2 pr-3">{o.quantity}</td>
                        <td className="py-2 pr-3">{o.price ?? '—'}</td>
                        <td className="py-2 pr-3">{o.status}</td>
                        <td className="py-2 pr-3">
                          {o.timestamp
                            ? new Date(o.timestamp * 1000).toLocaleString()
                            : '—'}
                        </td>
                      </tr>
                    ))}
                    {!orders.length && (
                      <tr>
                        <td className="py-6 text-center text-gray-400" colSpan={11}>
                          No orders yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className={`${card} p-5`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Positions</h3>
              <button
                onClick={handleRefreshPositions}
                className="rounded-xl border px-3 py-1.5 text-xs hover:bg-gray-50"
              >
                {positionsLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            <div className="overflow-auto min-h-[60px] flex items-center justify-center">
              {positionsLoading ? (
                <span className="animate-spin h-6 w-6 border-4 border-indigo-300 border-t-indigo-600 rounded-full inline-block" />
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="text-left text-gray-500">
                    <tr className="border-b">
                      <th className="py-2 pr-3">Exchange</th>
                      <th className="py-2 pr-3">Symbol</th>
                      <th className="py-2 pr-3">Qty</th>
                      <th className="py-2 pr-3">Avg Px</th>
                      <th className="py-2 pr-3">PNL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions
                      .filter((p) => p.qty > 0)
                      .map((p) => (
                        <tr
                          key={`${p.exchange}:${p.symbol}:${p.symboltoken}`}
                          className="border-b last:border-0"
                        >
                          <td className="py-2 pr-3">{p.exchange}</td>
                          <td className="py-2 pr-3">{p.symbol}</td>
                          <td className="py-2 pr-3">{p.qty}</td>
                          <td className="py-2 pr-3">{p.avgPrice}</td>
                          <td className="py-2 pr-3">{p.pnl ?? '—'}</td>
                        </tr>
                      ))}
                    {!positions.length && (
                      <tr>
                        <td className="py-6 text-center text-gray-400" colSpan={5}>
                          No positions
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
