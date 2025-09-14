// Types for dashboard data models used across components.
export type Holding = { symbol: string; name: string; value: number };
export type PriceRow = { symbol: string; name: string; price: number };
export type Trade = { id: string; text: string; date: string };

export type OrderSide = "BUY" | "SELL";
export type PlaceOrderInput = { symbol: string; qty: number; side: OrderSide };
