"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

// ── Types ──────────────────────────────────────────────────────────────────

type WaitlistEntry = {
  id: string;
  position: number;
  createdAt: Date;
  property: {
    id: string;
    title: string;
    address: string;
    lga: string;
    pricePerYear: number;
    listingType: string;
    status: string;
    images: { url: string }[];
  };
};

type Props = { waitlists: WaitlistEntry[] };

// ── Helpers ────────────────────────────────────────────────────────────────

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const LISTING_BADGE: Record<string, string> = {
  RENT:     "bg-blue-50 text-blue-700",
  SALE:     "bg-emerald-50 text-emerald-700",
  SHORTLET: "bg-amber-50 text-amber-700",
  LEASE:    "bg-purple-50 text-purple-700",
};

const STATUS_BADGE: Record<string, string> = {
  AVAILABLE:   "bg-emerald-50 text-emerald-700",
  RENTED:      "bg-zinc-100 text-zinc-500",
  PENDING:     "bg-amber-50 text-amber-700",
  MAINTENANCE: "bg-orange-50 text-orange-700",
};

// ── Main component ─────────────────────────────────────────────────────────

export default function WaitlistClient({ waitlists: initial }: Props) {
  const [list, setList] = useState(initial);
  const [leavingId, setLeavingId] = useState<string | null>(null);

  async function handleLeave(propertyId: string, entryId: string) {
    setLeavingId(entryId);
    try {
      const res = await fetch(`/api/properties/${propertyId}/waitlist`, {
        method: "DELETE",
      });
      if (res.ok) {
        setList((prev) => prev.filter((w) => w.id !== entryId));
      }
    } catch {
      // Silent fail
    } finally {
      setLeavingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Heading */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/dashboard" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors">
            Dashboard
          </Link>
          <span className="text-xs text-zinc-300">/</span>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Waitlist</p>
        </div>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-extrabold text-zinc-900">My Waitlists</h1>
          {list.length > 0 && (
            <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-bold text-zinc-500">
              {list.length} propert{list.length !== 1 ? "ies" : "y"}
            </span>
          )}
        </div>
      </div>

      {/* Info banner */}
      {list.length > 0 && (
        <div className="rounded-2xl bg-zinc-50 border border-zinc-200 p-4 flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400 shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <p className="text-xs text-zinc-500">
            You&apos;ll be notified automatically when a waitlisted property becomes available. Your position is shown below.
          </p>
        </div>
      )}

      {/* Empty state */}
      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </div>
          <p className="text-sm font-bold text-zinc-900 mb-1">No waitlists yet</p>
          <p className="text-xs text-zinc-400 mb-5">
            When a property you want is rented out, join the waitlist to be notified when it becomes available again.
          </p>
          <Link
            href="/properties"
            className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors"
          >
            Browse properties →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((entry) => {
            const img = entry.property.images[0]?.url;
            const isAvailable = entry.property.status === "AVAILABLE";

            return (
              <div key={entry.id} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                <div className="flex gap-4 p-5">
                  {/* Image */}
                  <div className="relative h-20 w-24 shrink-0 rounded-xl overflow-hidden bg-zinc-100">
                    {img ? (
                      <Image
                        src={img}
                        alt={entry.property.title}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
                      <Link
                        href={`/properties/${entry.property.id}`}
                        className="text-sm font-bold text-zinc-900 hover:underline underline-offset-2 truncate"
                      >
                        {entry.property.title}
                      </Link>
                      {/* Position badge */}
                      <span className="shrink-0 flex items-center gap-1 rounded-full bg-zinc-900 text-white px-2.5 py-0.5 text-xs font-bold">
                        #{entry.position}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mb-2">
                      {entry.property.address}, {entry.property.lga}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-extrabold text-zinc-900">
                        {formatNaira(entry.property.pricePerYear)}
                        <span className="text-xs font-semibold text-zinc-400">/yr</span>
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${LISTING_BADGE[entry.property.listingType] ?? "bg-zinc-100 text-zinc-600"}`}>
                        {entry.property.listingType.charAt(0) + entry.property.listingType.slice(1).toLowerCase()}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_BADGE[entry.property.status] ?? "bg-zinc-100 text-zinc-600"}`}>
                        {entry.property.status.charAt(0) + entry.property.status.slice(1).toLowerCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-zinc-100 px-5 py-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-zinc-400">
                    Joined {formatDate(entry.createdAt)}
                  </p>
                  <div className="flex items-center gap-2">
                    {isAvailable && (
                      <Link
                        href={`/applications/new?property=${entry.property.id}`}
                        className="rounded-full bg-zinc-900 text-white px-4 py-1.5 text-xs font-bold hover:bg-zinc-700 transition-colors"
                      >
                        Apply now →
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => handleLeave(entry.property.id, entry.id)}
                      disabled={leavingId === entry.id}
                      className="rounded-full border border-zinc-200 text-zinc-500 px-4 py-1.5 text-xs font-bold hover:border-red-200 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      {leavingId === entry.id ? "Leaving…" : "Leave waitlist"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
