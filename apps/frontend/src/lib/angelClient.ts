import axios from 'axios';

export const ANGEL_BASE =
  process.env.NEXT_PUBLIC_ANGEL_HTTP_API_BASE ?? 'http://localhost:8001';


export const PATHS = {
  login: '/login',
  ltp: '/ltp',            // POST {exchange, tradingsymbol, token}
  candles: '/candles',    // GET ?symbol=...&tf=15m&from=&to=
  orders: '/orders',      // GET list, POST place
  positions: '/positions' // GET
};

export type LoginRes = { loggedIn: boolean; mode: 'PAPER' | 'LIVE' };
export type LTPRes = {
  status: boolean;
  message: string;
  errorcode: string;
  data?: {
    exchange: string;
    tradingsymbol: string;
    symboltoken: string;
    open: number;
    high: number;
    low: number;
    close: number;
    ltp: number;
  };
};
export type Candle = { timestamp: string; open: number; high: number; low: number; close: number; volume: number };
export type CandlesRes = { ohlcv: Candle[] };
export type PlaceOrderReq = { symbol: string; side: 'BUY'|'SELL'; qty: number; type: 'MKT'|'LMT'; price?: number };
export type PlaceOrderRes = { orderId: string; status: string; avgPrice?: number; qty: number; time: string; symbol?: string; side?: string };
export type Order = { orderId: string; status: string; symbol: string; side: string; qty: number; avgPrice?: number; time: string };
export type Position = { symbol: string; qty: number; avgPrice: number; pnl?: number };


const api = axios.create({ baseURL: ANGEL_BASE, headers: { 'content-type': 'application/json' } });

export const angel = {
  login: async () => {
    const response = await api.post(PATHS.login, {});
    return response.data;
  },
  ltp: async (payload: { exchange: string; tradingsymbol: string; }) => {
    const response = await api.post(PATHS.ltp, payload);
    return response.data;
  },
  candles: async (payload: { exchange: string; interval: string; from_date: string; to_date: string }) => {
    const response = await api.post(PATHS.candles, payload);
    return response.data;
  },
  placeOrder: async (body: PlaceOrderReq) => {
    const response = await api.post(PATHS.orders, body);
    return response.data;
  },
  listOrders: async () => {
    const response = await api.get(PATHS.orders);
    return response.data;
  },
  positions: async () => {
    const response = await api.get(PATHS.positions);
    return response.data;
  },
};
