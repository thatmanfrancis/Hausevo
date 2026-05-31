"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

// ── Types ──────────────────────────────────────────────────────────────────

type Application = {
  id: string;
  status: string;
  message: string | null;
  rejectionReason: string | null;
  shackScoreAtApplication: number | null;
  createdAt: Date;
  updatedAt: Date;
  property: {
    id: string;
    title: string;
    address: string;
    lga: string;
    pricePerYear: number;
    listingType: string;
    images: { url: string }[];
    totalPackage: number;
  };
  tenancyId?: string | null;
};

type Props = { applications: Application[] };

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

// ── Status config ──────────────────────────────────────────────────────────

const STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  PENDING:   { label: "Pending",   cls: "bg-zinc-100 text-zinc-600",     dot: "bg-zinc-400" },
  REVIEWING: { label: "Reviewing", cls: "bg-blue-50 text-blue-700",      dot: "bg-blue-500" },
  ACCEPTED:  { label: "Accepted",  cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  REJECTED:  { label: "Rejected",  cls: "bg-red-50 text-red-700",        dot: "bg-red-500" },
  WITHDRAWN: { label: "Withdrawn", cls: "bg-zinc-100 text-zinc-500",     dot: "bg-zinc-300" },
};

const LISTING_BADGE: Record<string, string> = {
  RENT:     "bg-blue-50 text-blue-700",
  SALE:     "bg-emerald-50 text-emerald-700",
  SHORTLET: "bg-amber-50 text-amber-700",
  LEASE:    "bg-purple-50 text-purple-700",
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? STATUS.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${s.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ApplicationsClient({ applications }: Props) {
  const [list, setList] = useState(applications);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState("");
  const [filter, setFilter] = useState("ALL");

  const FILTERS = ["ALL", "PENDING", "REVIEWING", "ACCEPTED", "REJECTED", "WITHDRAWN"];

  const filtered = filter === "ALL" ? list : list.filter((a) => a.status === filter);

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === "ALL" ? list.length : list.filter((a) => a.status === f).length;
    return acc;
  }, {} as Record<string, number>);

  async function handleWithdraw(id: string) {
    setWithdrawingId(id);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "WITHDRAWN" }),
      });
      if (res.ok) {
        setList((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: "WITHDRAWN" } : a))
        );
      }
    } catch {
      // Silent fail
    } finally {
      setWithdrawingId(null);
    }
  }

  async function handlePayTotal(id: string) {
    setPayingId(id);
    setPayError("");
    try {
      const res = await fetch(`/api/applications/${id}/pay-total`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setPayError(data.error ?? "Payment failed. Check your wallet balance.");
        return;
      }
      // Refresh or redirect
      window.location.href = "/tenant/tenancy";
    } catch {
      setPayError("Network error. Please try again.");
    } finally {
      setPayingId(null);
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
            Applications
          </p>
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900">My Applications</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
              filter === f
                ? "bg-zinc-900 text-white"
                : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400"
            }`}
          >
            {f === "ALL" ? "All" : STATUS[f]?.label ?? f}
            {counts[f] > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                  filter === f ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {counts[f]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <p className="text-sm font-bold text-zinc-900 mb-1">
            {filter === "ALL" ? "No applications yet" : `No ${STATUS[filter]?.label.toLowerCase()} applications`}
          </p>
          <p className="text-xs text-zinc-400 mb-5">
            {filter === "ALL"
              ? "Browse properties and apply to get started"
              : "Try a different filter"}
          </p>
          {filter === "ALL" && (
            <Link
              href="/properties"
              className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors"
            >
              Browse properties →
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((app) => {
            const img = app.property.images[0]?.url;
            const canWithdraw = app.status === "PENDING" || app.status === "REVIEWING";

            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-zinc-200 overflow-hidden"
              >
                <div className="flex gap-4 p-5">
                  {/* Property image */}
                  <div className="relative h-20 w-24 shrink-0 rounded-xl overflow-hidden bg-zinc-100">
                    {img ? (
                      <Image
                        src={img}
                        alt={app.property.title}
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
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <Link
                          href={`/properties/${app.property.id}`}
                          className="text-sm font-bold text-zinc-900 hover:underline underline-offset-2 truncate block"
                        >
                          {app.property.title}
                        </Link>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {app.property.address}, {app.property.lga}
                        </p>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className="text-sm font-extrabold text-zinc-900">
                        {formatNaira(app.property.pricePerYear)}/yr
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${LISTING_BADGE[app.property.listingType] ?? "bg-zinc-100 text-zinc-600"}`}>
                        {app.property.listingType.charAt(0) + app.property.listingType.slice(1).toLowerCase()}
                      </span>
                      <span className="text-xs text-zinc-400">
                        Applied {formatDate(app.createdAt)}
                      </span>
                    </div>

                    {/* Message */}
                    {app.message && (
                      <p className="text-xs text-zinc-500 mt-2 line-clamp-2 italic">
                        &ldquo;{app.message}&rdquo;
                      </p>
                    )}

                    {/* Rejection reason */}
                    {app.status === "REJECTED" && app.rejectionReason && (
                      <div className="mt-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2">
                        <p className="text-xs text-red-700">
                          <span className="font-bold">Reason: </span>
                          {app.rejectionReason}
                        </p>
                      </div>
                    )}

                    {/* Accepted — prompt to pay total package */}
                    {app.status === "ACCEPTED" && !app.tenancyId && (
                      <div className="mt-4 rounded-2xl bg-zinc-900 p-5 text-white">
                        <div className="flex flex-col gap-4">
                          <div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Package</p>
                            <p className="text-2xl font-extrabold">{formatNaira(app.property.totalPackage)}</p>
                          </div>
                          
                          {payError && payingId === app.id && (
                            <p className="text-xs font-bold text-red-400">{payError}</p>
                          )}

                          <button
                            type="button"
                            onClick={() => handlePayTotal(app.id)}
                            disabled={payingId === app.id}
                            className="w-full rounded-full bg-white text-zinc-900 py-3 text-sm font-extrabold hover:bg-zinc-100 transition-colors disabled:opacity-50"
                          >
                            {payingId === app.id ? "Securing Home…" : "Pay & Secure Home"}
                          </button>
                          <p className="text-[10px] text-zinc-500 text-center leading-relaxed">
                            To protect your deposit, always pay through the Hausevo app. <br/> Never pay landlords directly.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Finalized Tenancy */}
                    {app.tenancyId && (
                      <div className="mt-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 flex items-center justify-between gap-3">
                        <p className="text-xs text-emerald-700 font-semibold">
                          Tenancy is active ✅
                        </p>
                        <Link
                          href="/tenant/tenancy"
                          className="text-xs font-bold text-emerald-700 hover:underline underline-offset-2 whitespace-nowrap"
                        >
                          Go to My Home →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {canWithdraw && (
                  <div className="border-t border-zinc-100 px-5 py-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-zinc-400">
                      Last updated {formatDate(app.updatedAt)}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleWithdraw(app.id)}
                      disabled={withdrawingId === app.id}
                      className="rounded-full border border-zinc-200 text-zinc-600 px-4 py-1.5 text-xs font-bold hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {withdrawingId === app.id ? "Withdrawing…" : "Withdraw"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
