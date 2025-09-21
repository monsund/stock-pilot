// Home page: beautiful, responsive landing with CTA to Chat/Trade.
// Tailwind-only. Uses the existing <StockTicker />.

import Link from "next/link";
import StockTicker from "@/components/dashboard/StockTicker";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top market ticker */}
      <StockTicker />

      {/* Decorative background blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-72 w-72 rounded-full bg-fuchsia-300/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-64 w-[36rem] bg-gradient-to-r from-indigo-200/30 to-fuchsia-200/30 blur-3xl rounded-3xl" />
      </div>

      <main className="relative flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 pt-16 pb-10 md:pt-24 md:pb-16">
          <div className="text-center space-y-8">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
              <span className="bg-gradient-to-r from-indigo-700 via-fuchsia-600 to-indigo-700 bg-clip-text text-transparent">
                Welcome to 📈 Stock Pilot
              </span>
            </h1>

            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Your AI-powered stock trading dashboard with{" "}
              <span className="font-medium text-gray-800">real-time prices</span>,{" "}
              <span className="font-medium text-gray-800">market news</span>, and{" "}
              <span className="font-medium text-gray-800">easy order placement</span>.
            </p>

            {/* CTAs */}
            <div className="flex items-center justify-center gap-3 md:gap-4">
              <Link
                href="/trade"
                className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 md:px-6 md:py-3.5 text-white text-sm md:text-base font-semibold shadow-lg shadow-indigo-500/20
                           bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700 transition"
              >
                Open Trading
              </Link>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 md:px-6 md:py-3.5 text-sm md:text-base font-semibold
                           border border-gray-300 bg-white/70 backdrop-blur hover:bg-white transition"
              >
                Explore Chat
              </Link>
            </div>

            {/* Social proof / tiny stats */}
            <div className="mx-auto grid max-w-3xl grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 pt-6">
              <Stat pill label="Symbols" value="3,000+" />
              <Stat pill label="Avg. Latency" value="~120ms" />
              <Stat pill label="Uptime" value="99.9%" />
              <Stat pill label="Orders/Day" value="10k+" />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-6 pb-20 md:pb-28">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <Feature
              icon="⚡"
              title="Ultra-fast LTP"
              desc="Stream live prices and snapshots with minimal lag for decisive trades."
            />
            <Feature
              icon="🧠"
              title="AI News Summaries"
              desc="Scan headlines, sentiment & stance—so you can act with context."
            />
            <Feature
              icon="🛒"
              title="One-click Orders"
              desc="Market & limit orders with instant feedback, plus positions & PnL."
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/60 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-6 text-center text-xs md:text-sm text-gray-500">
          © {new Date().getFullYear()} Stock Pilot. Built for speed, clarity & control.
        </div>
      </footer>
    </div>
  );
}

/* ---------- small presentational helpers ---------- */

function Stat({
  label,
  value,
  pill = false,
}: {
  label: string;
  value: string;
  pill?: boolean;
}) {
  return (
    <div
      className={
        "flex flex-col items-center justify-center rounded-xl px-3 py-3 " +
        (pill ? "bg-white shadow-sm border" : "")
      }
    >
      <div className="text-base md:text-lg font-semibold text-gray-900">{value}</div>
      <div className="text-[11px] md:text-xs text-gray-500">{label}</div>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border bg-white/80 backdrop-blur p-5 md:p-6 shadow-sm hover:shadow-md transition">
      <div className="text-2xl md:text-3xl">{icon}</div>
      <h3 className="mt-3 text-lg md:text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm md:text-[15px] leading-relaxed text-gray-600">{desc}</p>
    </div>
  );
}
