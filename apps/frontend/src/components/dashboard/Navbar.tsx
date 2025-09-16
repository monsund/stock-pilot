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
        <li><Link href="/" className="hover:underline">Home</Link></li>
        <li><Link href="/news" className="hover:underline">Stock News</Link></li>
        <li><Link href="/dashboard" className="hover:underline">Trade Stocks</Link></li>
        <li><Link href="/slm" className="hover:underline">SLM Selection</Link></li>
        <li><Link href="/user" className="hover:underline">User</Link></li>
        <li><Link href="/paper" className="hover:underline">Paper</Link></li>
      </ul>
    </nav>
  );
}
