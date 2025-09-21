"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAngelLogin } from "@/hooks/useAngel";

export default function Navbar() {
  const pathname = usePathname();
  const menu = [
    { name: "Home", href: "/" },
    { name: "Chat", href: "/chat" },
    { name: "Trade", href: "/trade" },
  ];
  // Auth state
  const { login } = useAngelLogin();
  const [authReady, setAuthReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  useEffect(() => {
    setHasToken(!!localStorage.getItem("angel_token"));
    setAuthReady(true);
  }, []);
  const handleLogin = async () => {
    await login();
    setHasToken(!!localStorage.getItem("angel_token"));
  };
  const handleLogout = () => {
    localStorage.removeItem("angel_token");
    setHasToken(false);
    location.reload();
  };
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-8 py-4 border-b shadow-sm bg-white backdrop-blur">
      <div className="text-2xl font-bold">📈 Stock Pilot</div>
      <div className="flex gap-10 text-lg font-medium pr-[30%] items-center">
        {menu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              `hover:text-blue-600 transition-colors duration-150 ` +
              (pathname === item.href
                ? "text-blue-600 underline underline-offset-4 decoration-2"
                : "text-gray-700")
            }
          >
            {item.name}
          </Link>
        ))}
        {authReady && (
          hasToken ? (
            <button
              onClick={handleLogout}
              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50 ml-6"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={handleLogin}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-700 hover:to-fuchsia-700 ml-6"
            >
              Login
            </button>
          )
        )}
      </div>
    </nav>
  );
}
