"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

// ── Types ──────────────────────────────────────────────────────────────────

type Application = {
  id: string;
  status: string;
  createdAt: string;
  property: {
    id: string;
    title: string;
    address: string;
    lga: string;
    pricePerYear: number;
    listingType: string;
    images: { url: string }[];
  };
};

type SavedProperty = {
  id: string;
  property: {
    id: string;
    title: string;
    address: string;
    lga: string;
    pricePerYear: number;
    listingType: string;
    metadata: unknown;
    images: { url: string }[];
  };
};

type Notification = {
  id: string;
  title: string;
  body: string;
  type: string;
  createdAt: string;
};

type Tenancy = {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  property: { id: string; title: string; address: string; lga: string };
} | null;

type Props = {
  user: {
    fullName: string;
    verificationTier: number;
    walletBalance: number;
    shackScore: { score: number } | null;
    applications: Application[];
    savedProperties: SavedProperty[];
    notifications: Notification[];
    tenancy: Tenancy;
  };
  session: unknown;
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ── Status badge ───────────────────────────────────────────────────────────

const STATUS: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: "Pending",   cls: "bg-zinc-100 text-zinc-600" },
  REVIEWING: { label: "Reviewing", cls: "bg-blue-50 text-blue-700" },
  ACCEPTED:  { label: "Accepted",  cls: "bg-emerald-50 text-emerald-700" },
  REJECTED:  { label: "Rejected",  cls: "bg-red-50 text-red-700" },
  WITHDRAWN: { label: "Withdrawn", cls: "bg-zinc-100 text-zinc-500" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, cls: "bg-zinc-100 text-zinc-600" };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${s.cls}`}>{s.label}</span>;
}

// ── Tier badge ─────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: number }) {
  if (tier >= 2) return <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-700">Gold</span>;
  if (tier === 1) return <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700">Verified</span>;
  return <span className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-bold text-zinc-500">Basic</span>;
}

// ── Score ring ─────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const pct = Math.min(100, (score / 850) * 100);
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = score >= 700 ? "#10b981" : score >= 500 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center w-20 h-20">
      <svg width="80" height="80" className="-rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#f4f4f5" strokeWidth="6" />
        <circle
          cx="40" cy="40" r={r} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-extrabold text-zinc-900 leading-none">{score}</span>
        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">/ 850</span>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function TenantDashboard({ user }: Props) {
  const { fullName, verificationTier, walletBalance, shackScore, applications, savedProperties, notifications, tenancy } = user;
  const [notifs, setNotifs] = useState(notifications);

  const firstName = fullName.split(" ")[0];
  const unreadCount = notifs.length;

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setNotifs([]);
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── Hero greeting ── */}
      <div className="bg-zinc-900 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
              {greeting()}
            </p>
            <h1 className="text-2xl font-extrabold leading-tight">{firstName}</h1>
            <p className="text-sm text-zinc-400 mt-1">
              {verificationTier === 0
                ? "Complete verification to apply for properties"
                : "Your account is active and verified"}
            </p>
          </div>
          <TierBadge tier={verificationTier} />
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 mt-5">
          <Link
            href="/properties"
            className="rounded-full bg-white text-zinc-900 px-4 py-2 text-xs font-bold hover:bg-zinc-100 transition-colors"
          >
            Browse properties →
          </Link>
          {verificationTier === 0 && (
            <Link
              href="/tenant/verification"
              className="rounded-full border border-zinc-700 text-zinc-300 px-4 py-2 text-xs font-bold hover:border-zinc-500 hover:text-white transition-colors"
            >
              Upgrade to Tier 1 (₦1,500)
            </Link>
          )}
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-3">
        {/* Wallet */}
        <Link href="/wallet" className="bg-white rounded-2xl border border-zinc-200 p-4 hover:border-zinc-400 transition-colors group">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Wallet</p>
          <p className="text-lg font-extrabold text-zinc-900 leading-none truncate">{formatNaira(walletBalance)}</p>
          <p className="text-[10px] text-zinc-400 mt-1 group-hover:text-zinc-600 transition-colors">Top up →</p>
        </Link>

        {/* ShackScore */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 flex flex-col items-center justify-center">
          {shackScore ? (
            <ScoreRing score={shackScore.score} />
          ) : (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Score</p>
              <p className="text-2xl font-extrabold text-zinc-300">—</p>
            </>
          )}
        </div>

        {/* Applications */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Applied</p>
          <p className="text-2xl font-extrabold text-zinc-900 leading-none">{applications.length}</p>
          <p className="text-[10px] text-zinc-400 mt-1">
            {applications.filter(a => a.status === "ACCEPTED").length} accepted
          </p>
        </div>
      </div>

      {/* ── Active tenancy ── */}
      {tenancy?.status === "ACTIVE" ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Active Tenancy</p>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700">Active</span>
          </div>
          <p className="font-extrabold text-zinc-900 text-sm">{tenancy.property.title}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{tenancy.property.address}, {tenancy.property.lga}</p>
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-zinc-400">
              {new Date(tenancy.startDate).toLocaleDateString("en-NG")} – {new Date(tenancy.endDate).toLocaleDateString("en-NG")}
            </p>
            <Link href="/tenant/tenancy" className="text-xs font-bold text-zinc-900 hover:underline underline-offset-2">
              View →
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-zinc-200 p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-zinc-900">No active tenancy</p>
            <p className="text-xs text-zinc-400 mt-0.5">Find your next home on Shack</p>
          </div>
          <Link href="/properties" className="rounded-full bg-zinc-900 text-white px-4 py-2 text-xs font-bold hover:bg-zinc-700 transition-colors whitespace-nowrap">
            Browse →
          </Link>
        </div>
      )}

      {/* ── Two-column: Applications + Notifications ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Applications */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Applications</p>
            <Link href="/tenant/applications" className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors">All →</Link>
          </div>
          {applications.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <p className="text-sm font-bold text-zinc-700 mb-1">No applications yet</p>
              <p className="text-xs text-zinc-400 mb-3">Apply for a property to get started</p>
              <Link href="/properties" className="rounded-full bg-zinc-900 text-white px-4 py-2 text-xs font-bold hover:bg-zinc-700 transition-colors">
                Browse properties
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {applications.slice(0, 4).map((app) => (
                <div key={app.id} className="flex items-center justify-between gap-3 py-2 border-b border-zinc-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900 truncate">{app.property.title}</p>
                    <p className="text-xs text-zinc-400">{app.property.lga}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Notifications</p>
              {unreadCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-white text-[9px] font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors">
                Mark read
              </button>
            )}
          </div>
          {notifs.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <p className="text-sm font-bold text-zinc-700">All caught up</p>
              <p className="text-xs text-zinc-400 mt-0.5">No unread notifications</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {notifs.slice(0, 4).map((n) => (
                <div key={n.id} className="flex items-start gap-3 py-2 border-b border-zinc-50 last:border-0">
                  <div className="flex h-2 w-2 rounded-full bg-zinc-900 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900 leading-snug">{n.title}</p>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">{n.body}</p>
                  </div>
                  <span className="text-[10px] text-zinc-400 shrink-0 mt-0.5">{timeAgo(n.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Saved properties ── */}
      {savedProperties.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Saved Properties</p>
            <Link href="/tenant/saved" className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors">All →</Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {savedProperties.slice(0, 4).map((sp) => {
              const img = sp.property.images[0]?.url;
              return (
                <Link
                  key={sp.id}
                  href={`/properties/${sp.property.id}`}
                  className="rounded-xl border border-zinc-200 overflow-hidden hover:border-zinc-400 transition-colors group"
                >
                  <div className="relative h-24 bg-zinc-100">
                    {img ? (
                      <Image src={img} alt={sp.property.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 50vw, 25vw" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-bold text-zinc-900 truncate">{sp.property.title}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{sp.property.lga} · {formatNaira(sp.property.pricePerYear)}/yr</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
