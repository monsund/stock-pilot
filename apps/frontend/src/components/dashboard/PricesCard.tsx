// Tailwind card titled "Real-Time Prices".
// Props: rows: { symbol, name, price }[].
// Layout: border rounded-lg bg-white p-4; list rows flex justify-between text-sm; price font-semibold.
import type { PriceRow } from "@/types/dashboard";

export default function PricesCard({ rows }: { rows: PriceRow[] }) {
    return (
        <div className="border rounded-lg p-4 bg-white">
            <h2 className="font-semibold text-lg mb-3">Real-Time Prices</h2>
            <ul className="space-y-2">
                {rows.map(r => (
                    <li key={r.symbol} className="flex justify-between text-sm">
                        <span>{r.name} ({r.symbol})</span>
                        <span className="font-semibold">${r.price.toFixed(2)}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
