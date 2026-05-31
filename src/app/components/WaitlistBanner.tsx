"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "hausevo_waitlist_banner";
const DELAY_MS = 8000; // show after 8 seconds
const SNOOZE_MS = 10 * 60 * 1000; // "remind me later" snoozes for 10 minutes

export default function WaitlistBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check localStorage — if dismissed or snoozed, don't show
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { dismissed, snoozeUntil } = JSON.parse(stored);
        if (dismissed) return;
        if (snoozeUntil && Date.now() < snoozeUntil) return;
      }
    } catch {
      // ignore parse errors
    }

    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ dismissed: true }));
    } catch {}
    setVisible(false);
  }

  function snooze() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ snoozeUntil: Date.now() + SNOOZE_MS })
      );
    } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <>
      {/* Backdrop — subtle, doesn't block interaction */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
        onClick={snooze}
      />

      {/* Banner — slides up from bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6 animate-in slide-in-from-bottom duration-300">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden">

          {/* Top accent bar */}
          {/* <div className="h-1 bg-zinc-900" /> */}

          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Coming soon
                  </span>
                  <span className="h-1 w-1 rounded-full bg-zinc-300" />
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Lagos launch
                  </span>
                </div>

                <p className="text-base font-extrabold text-zinc-900 mb-1">
                  Rent in Lagos without the agent fees.
                </p>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Verified listings, direct landlord contact, zero markups.
                  Join the waitlist and be first in line.
                </p>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-4">
                  <Link
                    href="/waitlist"
                    onClick={dismiss}
                    className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors"
                  >
                    Join the waitlist →
                  </Link>
                  <button
                    type="button"
                    onClick={snooze}
                    className="text-sm font-semibold text-zinc-400 hover:text-zinc-700 transition-colors"
                  >
                    Remind me later
                  </button>
                </div>
              </div>

              {/* Close button */}
              <button
                type="button"
                onClick={dismiss}
                aria-label="Dismiss"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-700"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
