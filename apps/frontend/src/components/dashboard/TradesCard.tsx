// Tailwind card titled "Recent Trades".
// Props: trades: { id, text, date }[].
// Layout: border rounded-lg bg-white p-4; rows flex justify-between text-sm; date text-gray-500.
import type { Trade } from "@/types/dashboard";

export default function TradesCard({ trades }: { trades: Trade[] }) {
    return (
        <div className="border rounded-lg bg-white p-4">
            <h2 className="font-semibold text-lg mb-3">Recent Trades</h2>
            <ul className="space-y-2 text-sm">
                {trades.map(t => (
                    <li key={t.id} className="flex justify-between">
                        <span>{t.text}</span>
                        <span className="text-gray-500">{t.date}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
