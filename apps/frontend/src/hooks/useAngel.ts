'use client';
import { useCallback, useState } from 'react';
import { angel, Candle, LTPRes, LoginRes, Order, PlaceOrderReq, Position } from '@/lib/angelClient';

export function useAngelLogin() {
  const [status, setStatus] = useState<{connected:boolean; mode:'PAPER'|'LIVE'|'?'}>({ connected:false, mode:'?' });
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async () => {
    try {
      setError(null);
      const r: LoginRes & { feedToken?: string } = await angel.login();
      setStatus({ connected: r.loggedIn, mode: r.mode ?? 'PAPER' });
      if (r.feedToken) {
        window.localStorage.setItem('angel_token', r.feedToken);
      }
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message || 'Login failed');
      } else {
        setError('Login failed');
      }
    }
  }, []);

  return { ...status, error, login };
}

export function useLTP({ exchange, tradingsymbol }: { exchange: string; tradingsymbol: string }) {
  const [data, setData] = useState<LTPRes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try { setError(null); setData(await angel.ltp({ exchange, tradingsymbol })); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
  }, [exchange, tradingsymbol]);
  return { data, error, refresh };
}

export function useCandles(params: { exchange: string; tradingsymbol: string; interval: string; from_date: string; to_date: string }) {
  const [data, setData] = useState<Candle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try {
      setError(null);
      const r = await angel.candles(params);
          const candles = Array.isArray(r?.data)
            ? r.data.map((arr: [string, number, number, number, number, number]) => ({
                timestamp: arr[0],
                open: arr[1],
                high: arr[2],
                low: arr[3],
                close: arr[4],
                volume: arr[5],
              }))
            : [];
      setData(candles);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [params]);
  return { data, error, refresh };
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try { setError(null); setOrders(await angel.listOrders()); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
  }, []);
  return { orders, error, refresh };
}

export function usePositions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try {
      setError(null);
      const raw = await angel.positions();
      // Transform object response to array for UI
      const arr: Position[] = Object.entries(raw).map(([key, val]) => {
        const [exchange, symbol, symboltoken] = key.split(":");
        const pos = val as { qty: number; avgPrice: number };
        return {
          symbol: symbol,
          exchange,
          symboltoken,
          qty: pos.qty,
          avgPrice: pos.avgPrice,
        };
      });
      setPositions(arr);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);
  return { positions, error, refresh };
}

export function usePlaceOrder() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const place = useCallback(async (req: PlaceOrderReq) => {
    try { setSubmitting(true); setError(null); return await angel.placeOrder(req); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setSubmitting(false); }
  }, []);
  return { place, submitting, error };
}
