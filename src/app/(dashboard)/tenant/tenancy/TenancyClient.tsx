
"use client";

import Link from "next/link";
import Image from "next/image";

type RentSchedule = {
  id: string; dueDate: Date; amount: number;
  frequency: string; status: string; paidAt: Date | null;
};

type Tenancy = {
  id: string; status: string; startDate: Date; endDate: Date;
  cautionDeposit: number; savingsGoal: number; currentSaved: number;
  isJoint: boolean; createdAt: Date;
  property: {
    id: string; title: string; address: string; lga: string; state: string;
    pricePerYear: number; listingType: string;
    images: { url: string }[];
    landlord: { id: string; fullName: string; verificationTier: number };
  };
  rentSchedules: RentSchedule[];
  agreement: {
    id: string; status: string; tenantSigned: boolean;
    tenantSignedAt: Date | null; ownerSigned: boolean;
    ownerSignedAt: Date | null; content: string;
  } | null;
  movingOrder: {
    id: string; scheduledDate: Date; pickupAddress: string;
    deliveryAddress: string; status: string;
    providerName: string | null; price: number | null;
  } | null;
} | null;

type Props = { tenancy: Tenancy };

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

export default function TenancyClient({ tenancy }: Props) {
  if (!tenancy) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors">Dashboard</Link>
            <span className="text-xs text-zinc-300">/</span>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Tenancy</p>
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-900">My Tenancy</h1>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <p className="text-sm font-bold text-zinc-900 mb-1">No active tenancy</p>
          <p className="text-xs text-zinc-400 mb-5">Apply for a property to get started</p>
          <Link href="/properties" className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors">
            Browse properties →
          </Link>
        </div>
      </div>
    );
  }

  const { property, rentSchedules, agreement, movingOrder } = tenancy;
  const img = property.images[0]?.url;
  const totalDays = new Date(tenancy.endDate).getTime() - new Date(tenancy.startDate).getTime();
  const elapsed = Date.now() - new Date(tenancy.startDate).getTime();
  const progressPct = Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)));
  const nextDue = rentSchedules.find((r) => r.status === "PENDING");
  const daysToNext = nextDue ? daysUntil(nextDue.dueDate) : null;
  const savingsPct = tenancy.savingsGoal > 0
    ? Math.min(100, Math.round((tenancy.currentSaved / tenancy.savingsGoal) * 100)) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/dashboard" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors">Dashboard</Link>
          <span className="text-xs text-zinc-300">/</span>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Tenancy</p>
        </div>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-extrabold text-zinc-900">My Tenancy</h1>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${tenancy.status === "ACTIVE" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
            {tenancy.status.charAt(0) + tenancy.status.slice(1).toLowerCase()}
          </span>
        </div>
      </div>

      {/* Property card */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="flex gap-4 p-5">
          <div className="relative h-20 w-28 shrink-0 rounded-xl overflow-hidden bg-zinc-100">
            {img ? (
              <Image src={img} alt={property.title} fill className="object-cover" sizes="112px" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <Link href={`/properties/${property.id}`} className="text-sm font-bold text-zinc-900 hover:underline underline-offset-2 block truncate">{property.title}</Link>
            <p className="text-xs text-zinc-500 mt-0.5">{property.address}, {property.lga}</p>
            <p className="text-sm font-extrabold text-zinc-900 mt-2">{formatNaira(property.pricePerYear)}<span className="text-xs font-semibold text-zinc-400">/yr</span></p>
          </div>
        </div>
        <div className="border-t border-zinc-100 px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Tenancy Period</p>
            <p className="text-xs font-bold text-zinc-600">{progressPct}% elapsed</p>
          </div>
          <div className="h-2 bg-zinc-100 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-zinc-900 rounded-full" style={{ width: `${progressPct}%` }} />
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
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Savings Goal</p>
          <p className="text-lg font-extrabold text-zinc-900">{savingsPct}%</p>
          <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${savingsPct}%` }} />
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">{formatNaira(tenancy.currentSaved)} of {formatNaira(tenancy.savingsGoal)}</p>
        </div>
      </div>

      {/* Rent schedule */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Rent Schedule</p>
        {rentSchedules.length === 0 ? (
          <p className="text-sm text-zinc-500">No rent schedule set up yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-100">
            {rentSchedules.map((r) => {
              const s = RENT_STATUS[r.status] ?? { label: r.status, cls: "bg-zinc-100 text-zinc-600" };
              const overdue = r.status === "PENDING" && daysUntil(r.dueDate) < 0;
              return (
                <div key={r.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className={`text-sm font-bold ${overdue ? "text-red-600" : "text-zinc-900"}`}>
                      {formatDate(r.dueDate)}
                      {overdue && <span className="ml-2 text-xs font-bold text-red-500">Overdue</span>}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {r.frequency.charAt(0) + r.frequency.slice(1).toLowerCase()} payment
                      {r.paidAt && ` · Paid ${formatDate(r.paidAt)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
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
      {agreement && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Tenancy Agreement</p>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${agreement.status === "SIGNED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              {agreement.status.charAt(0) + agreement.status.slice(1).toLowerCase()}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
              <div className={`h-2 w-2 rounded-full ${agreement.tenantSigned ? "bg-emerald-500" : "bg-zinc-300"}`} />
              <div>
                <p className="text-xs font-bold text-zinc-700">Your signature</p>
                <p className="text-[10px] text-zinc-400">{agreement.tenantSigned && agreement.tenantSignedAt ? `Signed ${formatDate(agreement.tenantSignedAt)}` : "Not yet signed"}</p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
              <div className={`h-2 w-2 rounded-full ${agreement.ownerSigned ? "bg-emerald-500" : "bg-zinc-300"}`} />
              <div>
                <p className="text-xs font-bold text-zinc-700">Landlord signature</p>
                <p className="text-[10px] text-zinc-400">{agreement.ownerSigned && agreement.ownerSignedAt ? `Signed ${formatDate(agreement.ownerSignedAt)}` : "Awaiting landlord"}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Moving order */}
      {movingOrder && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Moving Order</p>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${MOVE_STATUS[movingOrder.status]?.cls ?? "bg-zinc-100 text-zinc-600"}`}>
              {MOVE_STATUS[movingOrder.status]?.label ?? movingOrder.status}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Scheduled Date</p><p className="font-bold text-zinc-900">{formatDate(movingOrder.scheduledDate)}</p></div>
            {movingOrder.providerName && <div><p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Provider</p><p className="font-bold text-zinc-900">{movingOrder.providerName}</p></div>}
            <div><p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Pickup</p><p className="text-zinc-700">{movingOrder.pickupAddress}</p></div>
            <div><p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Delivery</p><p className="text-zinc-700">{movingOrder.deliveryAddress}</p></div>
            {movingOrder.price && <div><p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Cost</p><p className="font-bold text-zinc-900">{formatNaira(movingOrder.price)}</p></div>}
          </div>
        </div>
      )}

      {/* Landlord */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Landlord</p>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white text-sm font-bold">
              {property.landlord.fullName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">{property.landlord.fullName}</p>
              <p className="text-xs text-zinc-400">{property.landlord.verificationTier >= 1 ? "Verified landlord" : "Basic account"}</p>
            </div>
          </div>
          <Link href="/chat" className="rounded-full border border-zinc-200 text-zinc-700 px-4 py-2 text-xs font-bold hover:border-zinc-400 transition-colors">Message →</Link>
        </div>
      </div>
    </div>
  );
}