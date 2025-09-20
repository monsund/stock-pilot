// Dashboard layout using Tailwind.
// Sidebar (hidden on mobile) + main content.
// Search at top-right; Prices + Trades in a 2-col grid on md+; OrderForm full-width below.
"use client";
import SidebarPortfolio from "@/components/dashboard/SidebarPortfolio";
import PricesCard from "@/components/dashboard/PricesCard";
import TradesCard from "@/components/dashboard/TradesCard";
import OrderForm from "@/components/dashboard/OrderForm";
import type { Holding, PriceRow, Trade, PlaceOrderInput } from "@/types/dashboard";

export default function DashboardPage() {
  const holdings: Holding[] = [
    { symbol: "AAPL", name: "Apple Inc.", value: 1450 },
    { symbol: "MSFT", name: "Microsoft", value: 2350 },
    { symbol: "AMZN", name: "Amazon", value: 3200 },
  ];
  const rows: PriceRow[] = [
    { symbol: "GOOGL", name: "Google", price: 2800 },
    { symbol: "META", name: "Facebook", price: 355 },
    { symbol: "TSLA", name: "Tesla", price: 750 },
  ];
  const trades: Trade[] = [
    { id: "1", text: "Sold 10 shares of Apple", date: "Oct 10, 2023" },
    { id: "2", text: "Bought 5 shares of Tesla", date: "Oct 9, 2023" },
    { id: "3", text: "Bought 8 shares of Microsoft", date: "Oct 8, 2023" },
  ];

  const submitOrder = (o: PlaceOrderInput) => console.log("submit order", o);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <div className="flex flex-1 max-w-7xl mx-auto px-4 py-6 gap-6">
        {/* Sidebar */}
        <div className="w-64 hidden md:block">
          <SidebarPortfolio holdings={holdings} />
        </div>
        {/* Main */}
        <div className="flex-1 space-y-6">
          <div className="flex justify-end">
            <input
              type="text"
              placeholder="Search stocks..."
              className="border rounded px-3 py-1 text-sm w-64"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PricesCard rows={rows} />
            <TradesCard trades={trades} />
          </div>
          <OrderForm onSubmit={submitOrder} />
        </div>
      </div>
    </div>
  );
}
