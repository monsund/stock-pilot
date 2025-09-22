// import { randomUUID } from "node:crypto";
import type { SymbolT } from "../agents/transform.js";

const randomUUID = () => crypto.randomUUID();

export type PaperOrder = {
  id: string;
  symbol: SymbolT;
  side: "BUY" | "SELL";
  qty: number;
  type: "MARKET";
  price: number;
  status: "FILLED";
  createdAt: string;
};

export type PaperPosition = {
  symbol: SymbolT;
  qty: number;
  avgPrice: number;
  realisedPnl: number;
  updatedAt: string;
};

const orders: PaperOrder[] = [];
const positions = new Map<string, PaperPosition>();

const key = (s: SymbolT) => `${s.exchange}:${s.symbol}`;

export function placeMarket(
  symbol: SymbolT,
  side: "BUY" | "SELL",
  qty: number,
  price: number
): PaperOrder {
  const order: PaperOrder = {
    id: randomUUID(),
    symbol,
    side,
    qty,
    type: "MARKET",
    price,
    status: "FILLED",
    createdAt: new Date().toISOString(),
  };
  orders.push(order);

  const k = key(symbol);
  const pos =
    positions.get(k) ??
    { symbol, qty: 0, avgPrice: 0, realisedPnl: 0, updatedAt: new Date().toISOString() };

  if (side === "BUY") {
    const newQty = pos.qty + qty;
    const newAvg = newQty === 0 ? 0 : ((pos.avgPrice * pos.qty) + price * qty) / newQty;
    pos.qty = newQty;
    pos.avgPrice = newAvg;
  } else {
    // SELL against existing long (no shorting in MVP)
    const sellQty = Math.min(qty, pos.qty);
    pos.realisedPnl += (price - pos.avgPrice) * sellQty;
    pos.qty = Math.max(0, pos.qty - sellQty);
    if (pos.qty === 0) pos.avgPrice = 0;
  }

  pos.updatedAt = new Date().toISOString();
  positions.set(k, pos);
  return order;
}

export function listOrders(): PaperOrder[] {
  return orders.slice().reverse();
}

export function listPositions(): PaperPosition[] {
  return Array.from(positions.values()).sort((a, b) =>
    key(b.symbol).localeCompare(key(a.symbol))
  );
}
