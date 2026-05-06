"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

// ── Types ──────────────────────────────────────────────────────────────────

type SavedProperty = {
  id: string;
  createdAt: Date;
  property: {
    id: string;
    title: string;
    address: string;
    lga: string;
    state: string;
    pricePerYear: number;
    totalPackage: number;
    listingType: string;
    status: string;
    images: { url: string }[];
    landlord: { id: string; fullName: string; verificationTier: number };
  };
};

type Props = { saved: SavedProperty[] };

// ── Helpers ────────────────────────────────────────────────────────────────

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
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
  FLAGGED:     "bg-red-50 text-red-700",
};

// ── Main component ─────────────────────────────────────────────────────────

export default function SavedClient({ saved }: Props) {
  const [list, setList] = useState(saved);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleUnsave(propertyId: string, savedId: string) {
    setRemovingId(savedId);
    try {
      const res = await fetch(`/api/properties/${propertyId}/save`, {
        method: "POST",
      });
      if (res.ok) {
        setList((prev) => prev.filter((s) => s.id !== savedId));
      }
    } catch {
      // Silent fail
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Heading */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link
            href="/dashboard"
            className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            Dashboard
          </Link>
          <span className="text-xs text-zinc-300">/</span>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Saved
          </p>
        </div>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-extrabold text-zinc-900">Saved Properties</h1>
          {list.length > 0 && (
            <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-bold text-zinc-500">
              {list.length} saved
            </span>
          )}
        </div>
      </div>

      {/* Empty state */}
      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <p className="text-sm font-bold text-zinc-900 mb-1">No saved properties</p>
          <p className="text-xs text-zinc-400 mb-5">
            Save properties you like while browsing to find them here
          </p>
          <Link
            href="/properties"
            className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors"
          >
            Browse properties →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {list.map((item) => {
            const { property } = item;
            const img = property.images[0]?.url;
            const isRented = property.status === "RENTED";

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border overflow-hidden transition-colors ${
                  isRented ? "border-zinc-200 opacity-70" : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                {/* Image */}
                <div className="relative h-40 bg-zinc-100">
                  {img ? (
                    <Image
                      src={img}
                      alt={property.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      </svg>
                    </div>
                  )}
                  {/* Status overlay */}
                  {isRented && (
                    <div className="absolute inset-0 bg-zinc-900/40 flex items-center justify-center">
                      <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-zinc-700">
                        No longer available
                      </span>
                    </div>
                  )}
                  {/* Listing type badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${LISTING_BADGE[property.listingType] ?? "bg-zinc-100 text-zinc-600"}`}>
                      {property.listingType.charAt(0) + property.listingType.slice(1).toLowerCase()}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <Link
                      href={`/properties/${property.id}`}
                      className="text-sm font-bold text-zinc-900 hover:underline underline-offset-2 line-clamp-1"
                    >
                      {property.title}
                    </Link>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_BADGE[property.status] ?? "bg-zinc-100 text-zinc-600"}`}>
                      {property.status.charAt(0) + property.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-3">
                    {property.address}, {property.lga}
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-extrabold text-zinc-900">
                      {formatNaira(property.pricePerYear)}
                      <span className="text-xs font-semibold text-zinc-400">/yr</span>
                    </p>
                    <div className="flex items-center gap-2">
                      {!isRented && (
                        <Link
                          href={`/properties/${property.id}`}
                          className="rounded-full bg-zinc-900 text-white px-3 py-1.5 text-xs font-bold hover:bg-zinc-700 transition-colors"
                        >
                          View
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => handleUnsave(property.id, item.id)}
                        disabled={removingId === item.id}
                        className="rounded-full border border-zinc-200 text-zinc-500 px-3 py-1.5 text-xs font-bold hover:border-red-200 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {removingId === item.id ? "Removing…" : "Remove"}
                      </button>
                    </div>
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
