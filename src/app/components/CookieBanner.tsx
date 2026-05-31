"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const COOKIE_KEY = "hausevo_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_KEY);
      if (!consent) setVisible(true);
    } catch {
      // localStorage blocked — don't show banner
    }
  }, []);

  function accept() {
    try { localStorage.setItem(COOKIE_KEY, "accepted"); } catch {}
    setVisible(false);
  }

  function decline() {
    try { localStorage.setItem(COOKIE_KEY, "declined"); } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50">
      <div className="bg-zinc-900 text-white rounded-2xl p-5 shadow-2xl">
        <p className="text-sm font-bold mb-1">We use cookies 🍪</p>
        <p className="text-xs text-zinc-400 leading-relaxed mb-4">
          We use essential cookies to keep you logged in and optional analytics to improve the
          platform. No personal data is sold.{" "}
          <Link href="/cookies" className="text-zinc-300 underline underline-offset-2 hover:text-white transition-colors">
            Learn more
          </Link>
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={accept}
            className="flex-1 rounded-full bg-white text-zinc-900 px-4 py-2 text-xs font-bold hover:bg-zinc-100 transition-colors"
          >
            Accept all
          </button>
          <button
            onClick={decline}
            className="flex-1 rounded-full border border-zinc-700 text-zinc-300 px-4 py-2 text-xs font-bold hover:border-zinc-500 hover:text-white transition-colors"
          >
            Essential only
          </button>
        </div>
      </div>
    </div>
  );
}
