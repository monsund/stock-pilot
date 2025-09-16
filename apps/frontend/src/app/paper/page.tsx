'use client';

import { useEffect, useState } from "react";
import axios from "axios";

type SymbolT = { exchange: "NSE"|"BSE"; symbol: string; token?: string };
type PaperOrder = {
  id: string; symbol: SymbolT; side: "BUY"|"SELL"; qty: number;
  type: "MARKET"; price: number; status: "FILLED"; createdAt: string;
};
type PaperPosition = {
  symbol: SymbolT; qty: number; avgPrice: number; realisedPnl: number; updatedAt: string;
};

function DateText({ iso }: { iso: string }) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium", timeStyle: "short", timeZone: "UTC", hour12: false
  }).format(d);
}
function sideBadge(side: PaperOrder["side"]) {
  return side === "BUY"
    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : "bg-rose-100 text-rose-700 border-rose-200";
}

export default function PaperDashboard() {
  const [orders, setOrders] = useState<PaperOrder[]>([]);
  const [positions, setPositions] = useState<PaperPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string|null>(null);

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const [o, p] = await Promise.all([
        axios.get("/api/paper/orders"),
        axios.get("/api/paper/positions")
      ]);
      setOrders(o.data?.orders ?? []);
      setPositions(p.data?.positions ?? []);
    } catch (e: any) {
      setErr(e?.response?.data?.error || e?.message || "Failed to load");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-[80vh] py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">📘 Paper Trading</h1>
            <p className="text-slate-600">Review simulated orders and positions.</p>
          </div>
          <div className="flex gap-2">
            <a href="/news" className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50">← Back to News</a>
            <button onClick={load} disabled={loading} className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50">
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </header>

        {err && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{err}</div>}

        {/* Positions */}
        <section className="rounded-2xl border bg-white/70 backdrop-blur shadow-sm">
          <div className="px-5 py-3 border-b font-semibold">Positions</div>
          {positions.length === 0 ? (
            <div className="p-5 text-slate-600">No positions yet. Place a trade from the News page.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left p-3">Symbol</th>
                    <th className="text-right p-3">Qty</th>
                    <th className="text-right p-3">Avg Price</th>
                    <th className="text-right p-3">Realised P&L</th>
                    <th className="text-right p-3">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p) => (
                    <tr key={`${p.symbol.exchange}:${p.symbol.symbol}`} className="border-t">
                      <td className="p-3 font-medium">{p.symbol.exchange}:{p.symbol.symbol}</td>
                      <td className="p-3 text-right">{p.qty}</td>
                      <td className="p-3 text-right">{p.avgPrice.toFixed(2)}</td>
                      <td className={`p-3 text-right ${p.realisedPnl >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                        {p.realisedPnl.toFixed(2)}
                      </td>
                      <td className="p-3 text-right"><DateText iso={p.updatedAt} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Orders */}
        <section className="rounded-2xl border bg-white/70 backdrop-blur shadow-sm">
          <div className="px-5 py-3 border-b font-semibold">Orders</div>
          {orders.length === 0 ? (
            <div className="p-5 text-slate-600">No orders yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left p-3">Time (UTC)</th>
                    <th className="text-left p-3">Symbol</th>
                    <th className="text-left p-3">Side</th>
                    <th className="text-right p-3">Qty</th>
                    <th className="text-right p-3">Price</th>
                    <th className="text-right p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-t">
                      <td className="p-3"><DateText iso={o.createdAt} /></td>
                      <td className="p-3 font-medium">{o.symbol.exchange}:{o.symbol.symbol}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border ${sideBadge(o.side)}`}>
                          {o.side}
                        </span>
                      </td>
                      <td className="p-3 text-right">{o.qty}</td>
                      <td className="p-3 text-right">{o.price.toFixed(2)}</td>
                      <td className="p-3 text-right">{o.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
