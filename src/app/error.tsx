"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to your error tracking service here (e.g. Sentry)
    console.error("[Shack Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        {/* Big 500 */}
        <p className="text-8xl font-extrabold text-zinc-200 leading-none mb-6 select-none">500</p>

        {/* Icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white border border-zinc-200 mx-auto mb-5">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        <h1 className="text-2xl font-extrabold text-zinc-900 mb-2">Something went wrong</h1>
        <p className="text-sm text-zinc-400 leading-relaxed mb-8">
          An unexpected error occurred on our end. We've been notified and are looking into it.
          Try again in a moment.
        </p>

        {/* Error digest for support reference */}
        {error.digest && (
          <p className="text-xs text-zinc-300 font-mono mb-6">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-full bg-zinc-900 text-white px-7 py-3 text-sm font-bold hover:bg-zinc-700 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-full border border-zinc-200 text-zinc-700 px-7 py-3 text-sm font-bold hover:border-zinc-400 transition-colors"
          >
            Go home
          </Link>
        </div>

        <p className="mt-8 text-xs text-zinc-400">
          Still having issues?{" "}
          <Link href="/contact" className="font-semibold text-zinc-600 hover:text-zinc-900 transition-colors underline underline-offset-2">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
