// Tailwind card titled "Portfolio".
// Props: holdings: { symbol, name, value }[]
// Layout: border rounded-lg bg-gray-50 p-4; list rows: flex justify-between text-sm; value bold.
import type { Holding } from "@/types/dashboard";

export default function SidebarPortfolio({ holdings }: { holdings: Holding[] }) {
    return (
        <aside className="border rounded-lg bg-gray-50 p-4">
            <h2 className="font-semibold text-lg mb-3">Portfolio</h2>
            <ul className="space-y-2">
                {holdings.map(h => (
                    <li key={h.symbol} className="flex justify-between text-sm">
                        <span>{h.name}</span>
                        <span className="font-semibold">${h.value.toFixed(2)}</span>
                    </li>
                ))}
            </ul>
        </aside>
    );
}
