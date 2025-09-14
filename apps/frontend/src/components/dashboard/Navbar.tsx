import Link from "next/link";

// Responsive top navbar using Tailwind.
// Left: "📈 TradeNews Hub" (bold). Right: links: Home, Stock News, Trade Stocks, SLM Selection, User.
// Layout: flex items-center justify-between px-6 py-3 border-b bg-white. Mobile-friendly.
export default function Navbar() {
  // Start typing: return (<nav className="..."> ... );  // let Copilot fill
  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b bg-white">
      <Link href="/" className="text-xl font-bold">
        📈 TradeNews Hub
      </Link>
      <ul className="flex gap-6 text-sm font-medium">
        <li><Link href="/">Home</Link></li>
        <li><Link href="/news">Stock News</Link></li>
        <li><Link href="/dashboard" className="text-black font-semibold">Trade Stocks</Link></li>
        <li><Link href="/slm">SLM Selection</Link></li>
        <li><Link href="/user">User</Link></li>
      </ul>
    </nav>
  );
}
