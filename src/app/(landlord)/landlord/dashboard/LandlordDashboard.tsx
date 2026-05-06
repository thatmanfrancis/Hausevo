"use client";

import Link from "next/link";
import Image from "next/image";

// ── Types ──────────────────────────────────────────────────────────────────

type Property = {
  id: string; title: string; lga: string; status: string;
  pricePerYear: number; listingType: string;
  images: { url: string }[];
  _count: { applications: number; waitlist: number };
};

type Application = {
  id: string; status: string; createdAt: Date;
  property: { id: string; title: string };
  tenant: { id: string; fullName: string; verificationTier: number; shackScore: { score: number } | null };
};

type Tenancy = {
  id: string; status: string; endDate: Date;
  property: { id: string; title: string; lga: string };
  tenant: { id: string; fullName: string };
  rentSchedules: { id: string; dueDate: Date; amount: number }[];
};

type Notification = { id: string; title: string; body: string; createdAt: Date };

type Props = {
  properties: Property[];
  recentApplications: Application[];
  activeTenancies: Tenancy[];
  notifications: Notification[];
  stats: { totalProperties: number; pendingApplications: number; activeTenancies: number };
  landlordName: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
}

function timeAgo(d: Date) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function daysUntil(d: Date) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PENDING:     { label: "Pending",     cls: "bg-amber-50 text-amber-700" },
  AVAILABLE:   { label: "Available",   cls: "bg-emerald-50 text-emerald-700" },
  RENTED:      { label: "Rented",      cls: "bg-blue-50 text-blue-700" },
  MAINTENANCE: { label: "Maintenance", cls: "bg-orange-50 text-orange-700" },
  FLAGGED:     { label: "Flagged",     cls: "bg-red-50 text-red-700" },
};

// ── Main component ─────────────────────────────────────────────────────────

export default function LandlordDashboard({
  properties, recentApplications, activeTenancies, notifications, stats, landlordName,
}: Props) {
  const firstName = landlordName.split(" ")[0];

  return (
    <div className="flex flex-col gap-5">

      {/* Hero */}
      <div className="bg-zinc-900 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">{greeting()}</p>
            <h1 className="text-2xl font-extrabold leading-tight">{firstName}</h1>
            <p className="text-sm text-zinc-400 mt-1">Manage your properties and tenants from here.</p>
          </div>
          <Link
            href="/landlord/properties/new"
            className="rounded-full bg-white text-zinc-900 px-4 py-2 text-xs font-bold hover:bg-zinc-100 transition-colors whitespace-nowrap shrink-0"
          >
            + New listing
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-2xl font-extrabold text-white">{stats.totalProperties}</p>
            <p className="text-xs text-zinc-400 mt-0.5">Properties</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-2xl font-extrabold text-white">{stats.pendingApplications}</p>
            <p className="text-xs text-zinc-400 mt-0.5">Pending apps</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-2xl font-extrabold text-white">{stats.activeTenancies}</p>
            <p className="text-xs text-zinc-400 mt-0.5">Active tenants</p>
          </div>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Pending applications */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Pending Applications</p>
            <Link href="/landlord/applications" className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors">All →</Link>
          </div>
          {recentApplications.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                </svg>
              </div>
              <p className="text-sm font-bold text-zinc-700 mb-1">No pending applications</p>
              <p className="text-xs text-zinc-400">Applications from tenants will appear here</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentApplications.map((app) => (
                <Link
                  key={app.id}
                  href={`/landlord/applications?property=${app.property.id}`}
                  className="flex items-center justify-between gap-3 py-2.5 border-b border-zinc-50 last:border-0 hover:bg-zinc-50 -mx-2 px-2 rounded-xl transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900 truncate">{app.tenant.fullName}</p>
                    <p className="text-xs text-zinc-400 truncate">{app.property.title}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {app.tenant.shackScore && (
                      <span className="text-xs font-bold text-zinc-500">{app.tenant.shackScore.score}</span>
                    )}
                    <span className="text-xs text-zinc-400">{timeAgo(app.createdAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Active tenancies */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Active Tenancies</p>
            <Link href="/landlord/tenancies" className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors">All →</Link>
          </div>
          {activeTenancies.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                </svg>
              </div>
              <p className="text-sm font-bold text-zinc-700 mb-1">No active tenancies</p>
              <p className="text-xs text-zinc-400">Accept an application to create a tenancy</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {activeTenancies.map((t) => {
                const nextRent = t.rentSchedules[0];
                const daysLeft = daysUntil(t.endDate);
                return (
                  <Link
                    key={t.id}
                    href={`/landlord/tenancies/${t.id}`}
                    className="flex items-center justify-between gap-3 py-2.5 border-b border-zinc-50 last:border-0 hover:bg-zinc-50 -mx-2 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-zinc-900 truncate">{t.tenant.fullName}</p>
                      <p className="text-xs text-zinc-400 truncate">{t.property.title}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {nextRent ? (
                        <p className={`text-xs font-bold ${daysUntil(nextRent.dueDate) <= 7 ? "text-red-600" : "text-zinc-500"}`}>
                          Rent in {daysUntil(nextRent.dueDate)}d
                        </p>
                      ) : (
                        <p className="text-xs font-bold text-emerald-600">Paid ✓</p>
                      )}
                      <p className="text-[10px] text-zinc-400">{daysLeft}d left</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Properties */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Your Properties</p>
          <Link href="/landlord/properties" className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors">All →</Link>
        </div>
        {properties.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
            </div>
            <p className="text-sm font-bold text-zinc-700 mb-1">No properties yet</p>
            <p className="text-xs text-zinc-400 mb-4">List your first property to start receiving applications</p>
            <Link href="/landlord/properties/new" className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors">
              Add your first property →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-100">
            {properties.map((p) => {
              const img = p.images[0]?.url;
              const s = STATUS_CONFIG[p.status] ?? { label: p.status, cls: "bg-zinc-100 text-zinc-600" };
              return (
                <Link
                  key={p.id}
                  href={`/landlord/properties/${p.id}`}
                  className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0 hover:bg-zinc-50 -mx-2 px-2 rounded-xl transition-colors"
                >
                  <div className="relative h-12 w-16 shrink-0 rounded-xl overflow-hidden bg-zinc-100">
                    {img ? (
                      <Image src={img} alt={p.title} fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-zinc-900 truncate">{p.title}</p>
                    <p className="text-xs text-zinc-400">{p.lga} · {formatNaira(p.pricePerYear)}/yr</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${s.cls}`}>{s.label}</span>
                    {p._count.applications > 0 && (
                      <span className="rounded-full bg-zinc-900 text-white px-2 py-0.5 text-[10px] font-bold">
                        {p._count.applications} apps
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Recent Notifications</p>
            <Link href="/notifications" className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors">All →</Link>
          </div>
          <div className="flex flex-col gap-2">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3 py-2 border-b border-zinc-50 last:border-0">
                <div className="flex h-2 w-2 rounded-full bg-zinc-900 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-900">{n.title}</p>
                  <p className="text-xs text-zinc-400 truncate">{n.body}</p>
                </div>
                <span className="text-[10px] text-zinc-400 shrink-0">{timeAgo(n.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
