// Home page: minimal landing with CTA to Dashboard.
// Uses Navbar, centers content, Tailwind-only.
import Link from "next/link";
import Navbar from "../components/dashboard/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold">Welcome to 📈 TradeNews Hub</h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Your AI-powered stock trading dashboard with real-time prices, market news, and easy order placement.
          </p>
          <Link href="/dashboard" className="inline-block bg-black text-white px-6 py-3 rounded-lg font-semibold">
            Go to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
