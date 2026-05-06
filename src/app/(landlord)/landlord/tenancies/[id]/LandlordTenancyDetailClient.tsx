"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

// ── Types ──────────────────────────────────────────────────────────────────

type RentSchedule = {
  id: string; dueDate: Date; amount: number;
  frequency: string; status: string; paidAt: Date | null;
};

type Tenancy = {
  id: string; status: string; startDate: Date; endDate: Date;
  cautionDeposit: number; savingsGoal: number; currentSaved: number;
  isJoint: boolean; createdAt: Date;
  property: {
    id: string; title: string; address: string; lga: string;
    pricePerYear: number;
    images: { url: string }[];
  };
  tenant: {
    id: string; fullName: string; email: string; phoneNumber: string;
    verificationTier: number;
    shackScore: { score: number } | null;
  };
  rentSchedules: RentSchedule[];
  agreement: {
    id: string; status: string;
    tenantSigned: boolean; tenantSignedAt: Date | null;
    ownerSigned: boolean; ownerSignedAt: Date | null;
    content: string;
  } | null;
  movingOrder: {
    id: string; scheduledDate: Date; status: string;
    pickupAddress: string; deliveryAddress: string;
    providerName: string | null; price: number | null;
  } | null;
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
}
function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}
function daysUntil(d: Date) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const RENT_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: "Due",    cls: "bg-amber-50 text-amber-700" },
  SUCCESS:   { label: "Paid",   cls: "bg-emerald-50 text-emerald-700" },
  COMPLETED: { label: "Paid",   cls: "bg-emerald-50 text-emerald-700" },
  FAILED:    { label: "Failed", cls: "bg-red-50 text-red-700" },
  ESCROW:    { label: "Escrow", cls: "bg-blue-50 text-blue-700" },
};

const MOVE_STATUS: Record<string, { label: string; cls: string }> = {
  SCHEDULED:  { label: "Scheduled",  cls: "bg-blue-50 text-blue-700" },
  IN_TRANSIT: { label: "In Transit", cls: "bg-amber-50 text-amber-700" },
  COMPLETED:  { label: "Completed",  cls: "bg-emerald-50 text-emerald-700" },
  CANCELLED:  { label: "Cancelled",  cls: "bg-zinc-100 text-zinc-500" },
};

// ── Main component ─────────────────────────────────────────────────────────

export default function LandlordTenancyDetailClient({ tenancy }: { tenancy: Tenancy }) {
  const [agreementState, setAgreementState] = useState(tenancy.agreement);
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState("");

  const img = tenancy.property.images[0]?.url;
  const totalDays = new Date(tenancy.endDate).getTime() - new Date(tenancy.startDate).getTime();
  const elapsed = Date.now() - new Date(tenancy.startDate).getTime();
  const progressPct = Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)));
  const nextDue = tenancy.rentSchedules.find((r) => r.status === "PENDING");
  const daysToNext = nextDue ? daysUntil(nextDue.dueDate) : null;
  const paidCount = tenancy.rentSchedules.filter((r) => r.status === "COMPLETED" || r.status === "SUCCESS").length;
  const daysLeft = daysUntil(tenancy.endDate);

  async function handleSign() {
    setSigning(true);
    setSignError("");
    try {
      const res = await fetch(`/api/tenancy/${tenancy.id}/agreement`, { method: "PATCH" });
      const data = await res.json();
      if (!res.ok) {
        setSignError(data.error ?? "Failed to sign. Please try again.");
        return;
      }
      setAgreementState(data.agreement);
    } catch {
      setSignError("Network error. Please try again.");
    } finally {
      setSigning(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Heading */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/landlord/tenancies" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors">
            Tenancies
          </Link>
          <span className="text-xs text-zinc-300">/</span>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 truncate max-w-[200px]">
            {tenancy.tenant.fullName}
          </p>
        </div>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-extrabold text-zinc-900">{tenancy.tenant.fullName}</h1>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${
            tenancy.status === "ACTIVE" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-zinc-100 text-zinc-500"
          }`}>
            {tenancy.status.charAt(0) + tenancy.status.slice(1).toLowerCase()}
          </span>
        </div>
      </div>

      {/* Property card */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="flex gap-4 p-5">
          <div className="relative h-20 w-28 shrink-0 rounded-xl overflow-hidden bg-zinc-100">
            {img ? (
              <Image src={img} alt={tenancy.property.title} fill className="object-cover" sizes="112px" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <Link href={`/landlord/properties/${tenancy.property.id}`} className="text-sm font-bold text-zinc-900 hover:underline underline-offset-2 block truncate">
              {tenancy.property.title}
            </Link>
            <p className="text-xs text-zinc-500 mt-0.5">{tenancy.property.address}, {tenancy.property.lga}</p>
            <p className="text-sm font-extrabold text-zinc-900 mt-2">
              {formatNaira(tenancy.property.pricePerYear)}<span className="text-xs font-semibold text-zinc-400">/yr</span>
            </p>
          </div>
        </div>
        <div className="border-t border-zinc-100 px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Tenancy Period</p>
            <p className="text-xs font-bold text-zinc-600">{progressPct}% elapsed · {daysLeft}d remaining</p>
          </div>
          <div className="h-2 bg-zinc-100 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-zinc-900 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>{formatDate(tenancy.startDate)}</span>
            <span>{formatDate(tenancy.endDate)}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-zinc-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Caution Deposit</p>
          <p className="text-lg font-extrabold text-zinc-900">{formatNaira(tenancy.cautionDeposit)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Next Rent Due</p>
          {nextDue ? (
            <>
              <p className="text-lg font-extrabold text-zinc-900">{formatNaira(nextDue.amount)}</p>
              <p className={`text-[10px] font-bold mt-0.5 ${daysToNext !== null && daysToNext <= 7 ? "text-red-600" : "text-zinc-400"}`}>
                {daysToNext !== null ? (daysToNext <= 0 ? "Overdue" : `In ${daysToNext}d`) : formatDate(nextDue.dueDate)}
              </p>
            </>
          ) : (
            <p className="text-sm font-bold text-emerald-600">All paid ✓</p>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-4 col-span-2 sm:col-span-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Payments</p>
          <p className="text-lg font-extrabold text-zinc-900">{paidCount}/{tenancy.rentSchedules.length}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">schedules paid</p>
        </div>
      </div>

      {/* Tenant info */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Tenant</p>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white text-sm font-bold">
              {tenancy.tenant.fullName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-zinc-900">{tenancy.tenant.fullName}</p>
                {tenancy.tenant.verificationTier >= 1 && (
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Verified</span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">{tenancy.tenant.email}</p>
              <p className="text-xs text-zinc-400">{tenancy.tenant.phoneNumber}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            {tenancy.tenant.shackScore && (
              <>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">ShackScore</p>
                <p className="text-xl font-extrabold text-zinc-900">{tenancy.tenant.shackScore.score}</p>
              </>
            )}
            <Link href="/chat" className="mt-2 rounded-full border border-zinc-200 text-zinc-700 px-4 py-1.5 text-xs font-bold hover:border-zinc-400 transition-colors inline-block">
              Message →
            </Link>
          </div>
        </div>
      </div>

      {/* Rent schedule */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Rent Schedule</p>
        {tenancy.rentSchedules.length === 0 ? (
          <p className="text-sm text-zinc-500">No rent schedule set up yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-100">
            {tenancy.rentSchedules.map((r) => {
              const s = RENT_STATUS[r.status] ?? { label: r.status, cls: "bg-zinc-100 text-zinc-600" };
              const overdue = r.status === "PENDING" && daysUntil(r.dueDate) < 0;
              return (
                <div key={r.id} className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
                  <div>
                    <p className={`text-sm font-bold ${overdue ? "text-red-600" : "text-zinc-900"}`}>
                      {formatDate(r.dueDate)}
                      {overdue && <span className="ml-2 text-xs font-bold text-red-500">Overdue</span>}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {r.frequency.charAt(0) + r.frequency.slice(1).toLowerCase()}
                      {r.paidAt && ` · Paid ${formatDate(r.paidAt)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-sm font-extrabold text-zinc-900">{formatNaira(r.amount)}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${s.cls}`}>{s.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Agreement */}
      {agreementState && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Tenancy Agreement</p>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
              agreementState.status === "SIGNED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            }`}>
              {agreementState.status.charAt(0) + agreementState.status.slice(1).toLowerCase()}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
              <div className={`h-2 w-2 rounded-full shrink-0 ${agreementState.tenantSigned ? "bg-emerald-500" : "bg-zinc-300"}`} />
              <div>
                <p className="text-xs font-bold text-zinc-700">Tenant signature</p>
                <p className="text-[10px] text-zinc-400">
                  {agreementState.tenantSigned && agreementState.tenantSignedAt
                    ? `Signed ${formatDate(agreementState.tenantSignedAt)}`
                    : "Not yet signed"}
                </p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
              <div className={`h-2 w-2 rounded-full shrink-0 ${agreementState.ownerSigned ? "bg-emerald-500" : "bg-zinc-300"}`} />
              <div>
                <p className="text-xs font-bold text-zinc-700">Your signature</p>
                <p className="text-[10px] text-zinc-400">
                  {agreementState.ownerSigned && agreementState.ownerSignedAt
                    ? `Signed ${formatDate(agreementState.ownerSignedAt)}`
                    : "Not yet signed"}
                </p>
              </div>
            </div>
          </div>

          {signError && (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 mb-3">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {signError}
            </div>
          )}

          {!agreementState.ownerSigned && (
            <button
              type="button"
              onClick={handleSign}
              disabled={signing}
              className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {signing ? "Signing…" : "Sign agreement"}
            </button>
          )}
        </div>
      )}

      {/* Moving order */}
      {tenancy.movingOrder && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Moving Order</p>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${MOVE_STATUS[tenancy.movingOrder.status]?.cls ?? "bg-zinc-100 text-zinc-600"}`}>
              {MOVE_STATUS[tenancy.movingOrder.status]?.label ?? tenancy.movingOrder.status}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Scheduled Date</p>
              <p className="font-bold text-zinc-900">{formatDate(tenancy.movingOrder.scheduledDate)}</p>
            </div>
            {tenancy.movingOrder.providerName && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Provider</p>
                <p className="font-bold text-zinc-900">{tenancy.movingOrder.providerName}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Pickup</p>
              <p className="text-zinc-700">{tenancy.movingOrder.pickupAddress}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Delivery</p>
              <p className="text-zinc-700">{tenancy.movingOrder.deliveryAddress}</p>
            </div>
            {tenancy.movingOrder.price && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Cost</p>
                <p className="font-bold text-zinc-900">{formatNaira(tenancy.movingOrder.price)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
