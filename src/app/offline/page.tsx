"use client";

import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-sm">
        {/* Luxury Icon */}
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-[2.5rem] bg-white text-zinc-950 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-4">
          You&apos;re Offline
        </h1>
        <p className="text-zinc-400 text-sm leading-relaxed mb-10">
          It looks like your connection has been interrupted. Hausevo requires an active internet connection to verify listings and secure your payments.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="w-full rounded-full bg-white text-zinc-950 py-4 text-sm font-extrabold hover:bg-zinc-200 transition-all active:scale-95 shadow-xl mb-4"
        >
          Try Reconnecting
        </button>
        
        <Link 
          href="/"
          className="text-xs font-bold text-zinc-500 hover:text-white transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>

      <div className="absolute bottom-8 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
        Hausevo &copy; {new Date().getFullYear()} · Offline Mode
      </div>
    </div>
  );
}
