"use client";
import React, { useEffect, useRef, useState } from "react";

const sampleStocks = [
  { symbol: "RELIANCE", price: 1395.0, change: "+1.2%" },
  { symbol: "TATAMOTORS", price: 707.45, change: "-0.5%" },
  { symbol: "TATAPOWER", price: 396.3, change: "+0.8%" },
  { symbol: "INFY", price: 1560.2, change: "+0.3%" },
  { symbol: "HDFCBANK", price: 1725.1, change: "-0.2%" },
  { symbol: "SBIN", price: 610.7, change: "+1.0%" },
];

export default function StockTicker() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    let id = 0;
    let x = 0;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const step = () => {
      if (!paused && !prefersReduced) {
        x -= 1;
        el.style.transform = `translateX(${x}px)`;
        if (Math.abs(x) > el.scrollWidth / 2) x = 0;
      }
      id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [paused]);

  return (
    <div
      className="overflow-hidden w-full border-b bg-gradient-to-r from-indigo-50 to-fuchsia-50"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-label="Live stock ticker"
    >
      <div
        ref={trackRef}
        className="flex gap-8 md:gap-12 py-3 px-4 whitespace-nowrap text-sm md:text-base"
        style={{ willChange: "transform" }}
      >
        {[...sampleStocks, ...sampleStocks].map((s, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="font-semibold">{s.symbol}</span>
            <span className="text-slate-700">₹{s.price.toFixed(2)}</span>
            <span className={s.change.startsWith("+") ? "text-green-600" : "text-rose-600"}>
              {s.change}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
