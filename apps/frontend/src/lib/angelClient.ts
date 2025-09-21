import axios from 'axios';

export const ANGEL_BASE =
  process.env.NEXT_PUBLIC_ANGEL_HTTP_API_BASE ?? 'http://localhost:8001';


export const PATHS = {
  login: '/login',
  ltp: '/ltp',
  candles: '/candles',
  list_orders: '/list_orders',
  list_positions: '/list_positions',
  place_order: '/place_order',
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
export type PlaceOrderReq = {
  exchange: string;
  tradingsymbol: string;
  transactiontype: 'BUY' | 'SELL';
  quantity: number;
  ordertype: string;
  price?: number;
};
export type PlaceOrderRes = { orderId: string; status: string; avgPrice?: number; qty: number; time: string; symbol?: string; side?: string };
export type Order = {
  orderid: string;
  mode: string;
  exchange: string;
  tradingsymbol: string;
  symboltoken: string;
  transactiontype: 'BUY' | 'SELL';
  ordertype: string;
  quantity: number;
  price: number;
  status: string;
  timestamp: number;
};
export type Position = {
  symbol: string;
  exchange: string;
  symboltoken: string;
  qty: number;
  avgPrice: number;
  pnl?: number;
};


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
    const response = await api.post(PATHS.place_order, body);
    return response.data;
  },
  listOrders: async () => {
    const response = await api.get(PATHS.list_orders);
    return response.data;
  },
  positions: async () => {
    const response = await api.get(PATHS.list_positions);
    return response.data;
  },
};
