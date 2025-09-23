"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAngelLogin } from "@/hooks/useAngel";

export default function Navbar() {
  const pathname = usePathname();
  const { login } = useAngelLogin();

  const [open, setOpen] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const read = () => setHasToken(!!window.localStorage.getItem("angel_token"));
    read();
    window.addEventListener("storage", read);
    return () => window.removeEventListener("storage", read);
  }, []);

  const menu = [
    { name: "Home", href: "/" },
    { name: "Chat", href: "/chat" },
    { name: "Trade", href: "/trade" },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
      <div className="mx-auto max-w-screen-xl px-3 sm:px-4 md:px-6">
        <div className="h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight">Stock Pilot</Link>

          {/* desktop menu */}
          <div className="hidden md:flex items-center gap-3">
            {menu.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className={`px-2 py-1 rounded-md ${
                  pathname === m.href
                    ? "text-indigo-700 font-medium"
                    : "text-slate-700 hover:text-indigo-700"
                }`}
              >
                {m.name}
              </Link>
            ))}
            {hasToken ? (
              <button
                onClick={() => { localStorage.removeItem("angel_token"); setHasToken(false); }}
                className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={login}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white px-3 py-2 text-sm shadow-sm hover:from-indigo-700 hover:to-fuchsia-700"
              >
                Login
              </button>
            )}
          </div>

          {/* mobile controls */}
          <div className="md:hidden flex items-center gap-2">
            {hasToken ? (
              <button
                onClick={() => { localStorage.removeItem("angel_token"); setHasToken(false); }}
                className="rounded-lg border px-2.5 py-1.5 text-xs"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={login}
                className="rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white px-2.5 py-1.5 text-xs"
              >
                Login
              </button>
            )}
            <button
              aria-label="Menu"
              onClick={() => setOpen((v) => !v)}
              className="rounded-lg border p-1.5"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* mobile sheet */}
        {open && (
          <div className="md:hidden pb-3">
            <div className="flex flex-col gap-1">
              {menu.map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  onClick={() => setOpen(false)}
                  className={`px-2 py-2 rounded-md ${
                    pathname === m.href ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-50"
                  }`}
                >
                  {m.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
