// Client component with Tailwind.
// State: side (BUY/SELL), symbol, qty.
// Layout: border rounded-lg bg-white p-4.
// Fields: radio group flex gap-4; text/number inputs: w-full border rounded px-3 py-2 text-sm.
// Submit button: w-full bg-black text-white rounded py-2 text-sm font-semibold.
// Calls onSubmit({ symbol: UPPERCASE, qty, side }).
"use client";
import { useState } from "react";
import type { PlaceOrderInput, OrderSide } from "@/types/dashboard";

export default function OrderForm({ onSubmit }: { onSubmit: (o: PlaceOrderInput) => void }) {
  const [side, setSide] = useState<OrderSide>("BUY");
  const [symbol, setSymbol] = useState("");
  const [qty, setQty] = useState<number>(1);

  return (
    <div className="border rounded-lg bg-white p-4" data-testid="order-form">
      <h2 className="font-semibold text-lg mb-3">Place Order</h2>
      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit({ symbol: symbol.toUpperCase(), qty, side }); }}
        className="space-y-3"
      >
        <div className="flex items-center gap-4" aria-label="Order side">
          <label className="flex items-center gap-1">
            <input data-testid="order-side-buy" type="radio" checked={side === "BUY"} onChange={() => setSide("BUY")} />Buy
          </label>
          <label className="flex items-center gap-1">
            <input data-testid="order-side-sell" type="radio" checked={side === "SELL"} onChange={() => setSide("SELL")} />Sell
          </label>
        </div>
        <input
          data-testid="order-symbol"
          aria-label="Stock symbol"
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="Stock Symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
        />
        <input
          data-testid="order-qty"
          aria-label="Quantity"
          type="number"
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="Quantity"
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
        />
        <button
          data-testid="order-submit"
          type="submit"
          className="w-full bg-black text-white rounded py-2 text-sm font-semibold"
        >
          Submit Order
        </button>
      </form>
    </div>
  );
}
