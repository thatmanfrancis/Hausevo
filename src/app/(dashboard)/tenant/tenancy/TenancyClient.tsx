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
  tenantId: string;
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
  coTenants: { id: string; fullName: string; email: string; verificationTier: number }[];
  conditionReport: {
    id: string; type: any; beforePhotos: string[];
    afterPhotos: string[]; notes: string | null;
    isAcknowledgedByTenant: boolean; isAcknowledgedByOwner: boolean;
  } | null;
} | null;

type Props = { tenancy: Tenancy; userId: string; walletBalance: number };

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

// ── Review modal ───────────────────────────────────────────────────────────

function ReviewModal({
  landlordId,
  landlordName,
  propertyId,
  onClose,
}: {
  landlordId: string;
  landlordName: string;
  propertyId: string;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId: landlordId, rating, comment: comment.trim() || undefined, propertyId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to submit review. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {done ? (
          <div className="flex flex-col items-center text-center py-12 px-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p className="text-base font-extrabold text-zinc-900 mb-1">Review submitted!</p>
            <p className="text-sm text-zinc-500 mb-6">Thank you for your feedback.</p>
            <button type="button" onClick={onClose} className="rounded-full bg-zinc-900 text-white px-6 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors">
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-100">
              <div>
                <p className="text-base font-extrabold text-zinc-900">Review Landlord</p>
                <p className="text-xs text-zinc-400 mt-0.5">{landlordName}</p>
              </div>
              <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100 transition-colors text-zinc-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              {/* Star rating */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHovered(star)}
                      onMouseLeave={() => setHovered(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill={(hovered || rating) >= star ? "#f59e0b" : "none"}
                        stroke={(hovered || rating) >= star ? "#f59e0b" : "#d4d4d8"}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </button>
                  ))}
                  {(hovered || rating) > 0 && (
                    <span className="text-sm font-bold text-amber-600 ml-1">
                      {LABELS[hovered || rating]}
                    </span>
                  )}
                </div>
              </div>

              {/* Comment */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="comment" className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Comment <span className="normal-case font-normal text-zinc-400">(optional)</span>
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="How was your experience with this landlord?"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors resize-none"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting || !rating}
                  className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting…" : "Submit review"}
                </button>
                <button type="button" onClick={onClose} className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// function formatNaira(n: number) {
//   return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
// }
// function formatDate(d: Date) {
//   return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
// }
// function daysUntil(d: Date) {
//   return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
// }

// const RENT_STATUS: Record<string, { label: string; cls: string }> = {
//   PENDING:   { label: "Due",    cls: "bg-amber-50 text-amber-700" },
//   SUCCESS:   { label: "Paid",   cls: "bg-emerald-50 text-emerald-700" },
//   COMPLETED: { label: "Paid",   cls: "bg-emerald-50 text-emerald-700" },
//   FAILED:    { label: "Failed", cls: "bg-red-50 text-red-700" },
//   ESCROW:    { label: "Escrow", cls: "bg-blue-50 text-blue-700" },
// };

// const MOVE_STATUS: Record<string, { label: string; cls: string }> = {
//   SCHEDULED:  { label: "Scheduled",  cls: "bg-blue-50 text-blue-700" },
//   IN_TRANSIT: { label: "In Transit", cls: "bg-amber-50 text-amber-700" },
//   COMPLETED:  { label: "Completed",  cls: "bg-emerald-50 text-emerald-700" },
//   CANCELLED:  { label: "Cancelled",  cls: "bg-zinc-100 text-zinc-500" },
// };



export default function TenancyClient({ tenancy, userId, walletBalance }: Props) {
  const isPrimary = tenancy?.tenantId === userId;
  const isCoTenant = tenancy?.coTenants.some(ct => ct.id === userId);
  const [schedules, setSchedules] = useState(tenancy?.rentSchedules ?? []);
  const [balance, setBalance] = useState(walletBalance);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState("");
  const [paySuccess, setPaySuccess] = useState("");

  const [agreementState, setAgreementState] = useState(tenancy?.agreement ?? null);
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState("");

  const [showReview, setShowReview] = useState(false);

  // ── Condition Report ───────────────────────────────────────────────────
  const [report, setReport] = useState(tenancy?.conditionReport ?? null);
  const [acknowledging, setAcknowledging] = useState(false);

  async function handleAcknowledgeReport() {
    if (!tenancy || !report) return;
    setAcknowledging(true);
    try {
      const res = await fetch(`/api/tenancy/${tenancy.id}/condition-report/acknowledge`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setReport(data.report);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAcknowledging(false);
    }
  }

  // ── Co-tenancy ──────────────────────────────────────────────────────────
  const [coTenants, setCoTenants] = useState(tenancy?.coTenants ?? []);
  const [addingCoTenant, setAddingCoTenant] = useState(false);
  const [coTenantIdentifier, setCoTenantIdentifier] = useState("");
  const [coTenantError, setCoTenantError] = useState("");
  const [coTenantSuccess, setCoTenantSuccess] = useState("");

  async function handleAddCoTenant(e: React.FormEvent) {
    e.preventDefault();
    if (!tenancy || !coTenantIdentifier) return;
    setAddingCoTenant(true);
    setCoTenantError("");
    setCoTenantSuccess("");

    try {
      const res = await fetch(`/api/tenancy/${tenancy.id}/co-tenants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: coTenantIdentifier }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCoTenantError(data.error ?? "Failed to add co-tenant.");
        return;
      }
      setCoTenants([...coTenants, data.coTenant]);
      setCoTenantSuccess(`${data.coTenant.fullName} added successfully.`);
      setCoTenantIdentifier("");
      setTimeout(() => setCoTenantSuccess(""), 5000);
    } catch {
      setCoTenantError("Network error. Please try again.");
    } finally {
      setAddingCoTenant(false);
    }
  }

  // ── Pay rent ──────────────────────────────────────────────────────────────

  async function handlePay(scheduleId: string, amount: number) {
    if (!tenancy) return;
    setPayingId(scheduleId);
    setPayError("");
    setPaySuccess("");

    try {
      const res = await fetch(`/api/tenancy/${tenancy.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleId, amount }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPayError(data.error ?? "Payment failed. Please try again.");
        return;
      }

      // Update the schedule entry to COMPLETED
      setSchedules((prev) =>
        prev.map((s) =>
          s.id === scheduleId
            ? { ...s, status: "COMPLETED", paidAt: new Date() }
            : s
        )
      );
      setBalance(data.summary.tenantBalance ?? (balance - amount));
      setPaySuccess(`Payment of ${formatNaira(amount)} completed successfully using your wallet.`);
      setTimeout(() => setPaySuccess(""), 5000);
    } catch {
      setPayError("Network error. Please try again.");
    } finally {
      setPayingId(null);
    }
  }

  // ── Contribute to rent (Co-tenants) ──────────────────────────────────────
  const [contributing, setContributing] = useState(false);
  const [contribError, setContribError] = useState("");
  const [contribSuccess, setContribSuccess] = useState("");

  async function handleContribute(amount: number) {
    if (!tenancy) return;
    setContributing(true);
    setContribError("");
    setContribSuccess("");

    try {
      const res = await fetch(`/api/tenancy/${tenancy.id}/contribute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setContribError(data.error ?? "Contribution failed.");
        return;
      }
      setContribSuccess(`Contributed ${formatNaira(amount)} to primary tenant.`);
      setTimeout(() => setContribSuccess(""), 5000);
    } catch {
      setContribError("Network error. Please try again.");
    } finally {
      setContributing(false);
    }
  }

  // ── Sign agreement ────────────────────────────────────────────────────────

  async function handleSign() {
    if (!tenancy || !agreementState) return;
    setSigning(true);
    setSignError("");

    try {
      const res = await fetch(`/api/tenancy/${tenancy.id}/agreement`, {
        method: "PATCH",
      });
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

  // ── Empty state ───────────────────────────────────────────────────────────

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

  const { property, movingOrder, isJoint } = tenancy;
  const img = property.images[0]?.url;
  const totalDays = new Date(tenancy.endDate).getTime() - new Date(tenancy.startDate).getTime();
  const elapsed = Date.now() - new Date(tenancy.startDate).getTime();
  const progressPct = Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)));
  const nextDue = schedules.find((r) => r.status === "PENDING");
  const daysToNext = nextDue ? daysUntil(nextDue.dueDate) : null;
  const savingsPct = tenancy.savingsGoal > 0
    ? Math.min(100, Math.round((tenancy.currentSaved / tenancy.savingsGoal) * 100)) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Heading */}
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

      {/* Pay success */}
      {paySuccess && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 px-5 py-3.5 text-sm text-emerald-700 font-semibold">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {paySuccess}
        </div>
      )}

      {/* Contribution success */}
      {contribSuccess && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 px-5 py-3.5 text-sm text-emerald-700 font-semibold">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {contribSuccess}
        </div>
      )}

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
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
            {isCoTenant ? "Your Share" : "Next Rent Due"}
          </p>
          {nextDue ? (
            <>
              <p className="text-lg font-extrabold text-zinc-900">
                {formatNaira(isJoint ? nextDue.amount / (1 + coTenants.length) : nextDue.amount)}
              </p>
              <p className={`text-[10px] font-bold mt-0.5 ${daysToNext !== null && daysToNext <= 7 ? "text-red-600" : "text-zinc-400"}`}>
                {isJoint && <span className="mr-1 text-zinc-400 font-normal">(Split {1 + coTenants.length} ways)</span>}
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
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Rent Schedule</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Wallet:</span>
            <span className="text-xs font-extrabold text-zinc-900">{formatNaira(balance)}</span>
          </div>
        </div>


        {payError && (
          <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 mb-4">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {payError}
          </div>
        )}

        {contribError && (
          <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 mb-4">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {contribError}
          </div>
        )}

        {schedules.length === 0 ? (
          <p className="text-sm text-zinc-500">No rent schedule set up yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-100">
            {schedules.map((r) => {
              const s = RENT_STATUS[r.status] ?? { label: r.status, cls: "bg-zinc-100 text-zinc-600" };
              const overdue = r.status === "PENDING" && daysUntil(r.dueDate) < 0;
              const isPending = r.status === "PENDING";

              return (
                <div key={r.id} className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${overdue ? "text-red-600" : "text-zinc-900"}`}>
                      {formatDate(r.dueDate)}
                      {overdue && <span className="ml-2 text-xs font-bold text-red-500">Overdue</span>}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {r.frequency.charAt(0) + r.frequency.slice(1).toLowerCase()} · {formatNaira(r.amount)}
                      {r.paidAt && ` · Paid ${formatDate(r.paidAt)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${s.cls}`}>{s.label}</span>
                    {isPending && isPrimary && (
                      <button
                        type="button"
                        onClick={() => handlePay(r.id, r.amount)}
                        disabled={payingId === r.id}
                        className="rounded-full bg-zinc-900 text-white px-4 py-1.5 text-xs font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {payingId === r.id ? "Paying…" : "Pay landlord"}
                      </button>
                    )}
                    {isPending && isCoTenant && (
                      <button
                        type="button"
                        onClick={() => handleContribute(isJoint ? r.amount / (1 + coTenants.length) : r.amount)}
                        disabled={contributing}
                        className="rounded-full bg-zinc-900 text-white px-4 py-1.5 text-xs font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {contributing ? "Contributing…" : "Pay share"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-6 pt-4 border-t border-zinc-50">
          <p className="text-[10px] text-zinc-400 text-center italic">
            Always pay through the Shack app to maintain digital proof of payment. <br/> Never pay landlords via direct bank transfer.
          </p>
        </div>
      </div>

      {/* Agreement */}
      {agreementState && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Tenancy Agreement</p>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${agreementState.status === "SIGNED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              {agreementState.status.charAt(0) + agreementState.status.slice(1).toLowerCase()}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
              <div className={`h-2 w-2 rounded-full shrink-0 ${agreementState.tenantSigned ? "bg-emerald-500" : "bg-zinc-300"}`} />
              <div>
                <p className="text-xs font-bold text-zinc-700">Your signature</p>
                <p className="text-[10px] text-zinc-400">{agreementState.tenantSigned && agreementState.tenantSignedAt ? `Signed ${formatDate(agreementState.tenantSignedAt)}` : "Not yet signed"}</p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3">
              <div className={`h-2 w-2 rounded-full shrink-0 ${agreementState.ownerSigned ? "bg-emerald-500" : "bg-zinc-300"}`} />
              <div>
                <p className="text-xs font-bold text-zinc-700">Landlord signature</p>
                <p className="text-[10px] text-zinc-400">{agreementState.ownerSigned && agreementState.ownerSignedAt ? `Signed ${formatDate(agreementState.ownerSignedAt)}` : "Awaiting landlord"}</p>
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

          {!agreementState.tenantSigned && (
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

      {/* Co-Tenants */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Co-Tenants (Roommates)</p>
        
        {coTenants.length === 0 ? (
          <p className="text-sm text-zinc-400 mb-4 italic">No co-tenants added yet. You can share your space and rent with others.</p>
        ) : (
          <div className="flex flex-col gap-3 mb-6">
            {coTenants.map((ct) => (
              <div key={ct.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-zinc-100 bg-zinc-50">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white text-[10px] font-bold">
                    {ct.fullName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-900">{ct.fullName}</p>
                    <p className="text-[10px] text-zinc-400">{ct.email}</p>
                  </div>
                </div>
                <span className="rounded-full bg-zinc-200 text-zinc-600 px-2 py-0.5 text-[9px] font-bold uppercase">Active</span>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAddCoTenant} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Add Roommate</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={coTenantIdentifier}
                onChange={(e) => setCoTenantIdentifier(e.target.value)}
                placeholder="Email or phone number"
                className="flex-1 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
              />
              <button
                type="submit"
                disabled={addingCoTenant || !coTenantIdentifier}
                className="rounded-full bg-zinc-900 text-white px-4 py-2 text-xs font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                {addingCoTenant ? "Adding…" : "Add"}
              </button>
            </div>
          </div>
          {coTenantError && <p className="text-[10px] font-bold text-red-600">{coTenantError}</p>}
          {coTenantSuccess && <p className="text-[10px] font-bold text-emerald-600">{coTenantSuccess}</p>}
        </form>
      </div>

      {/* Escrow & Condition Report */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Escrow Security</p>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">
            <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 p-4 rounded-xl border border-zinc-100 bg-zinc-50">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white border border-zinc-200 text-zinc-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-zinc-900 mb-0.5">Caution Deposit Secured</p>
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                Your deposit of {formatNaira(tenancy.cautionDeposit)} is held in Shack Escrow. It is protected and cannot be released without a mutual move-out audit.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-100 bg-white">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Condition Report</p>
              <span className={`text-[10px] font-bold ${report?.isAcknowledgedByTenant ? "text-emerald-600" : "text-amber-600"}`}>
                {report?.isAcknowledgedByTenant ? "Acknowledged ✓" : "Pending your review"}
              </span>
            </div>
            
            {!report ? (
              <p className="text-[10px] text-zinc-400 italic">Landlord has not uploaded the move-in report yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {report.beforePhotos.map((url, i) => (
                    <div key={i} className="h-16 w-16 shrink-0 rounded-lg bg-zinc-100 border border-zinc-200 overflow-hidden">
                      <img src={url} alt="State" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
                {!report.isAcknowledgedByTenant && (
                  <button
                    onClick={handleAcknowledgeReport}
                    disabled={acknowledging}
                    className="w-full rounded-full bg-zinc-900 text-white py-2 text-xs font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50"
                  >
                    {acknowledging ? "Acknowledging…" : "Acknowledge Property State"}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-blue-600">✨</span>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-700">Shack Loyalty Reward</p>
            </div>
            <p className="text-[10px] text-blue-600 leading-relaxed">
              Moving to another house on Shack? Get <span className="font-bold">80% of your deposit back</span> as a Shack Bond, with only a 20% processing fee. Loyalty pays.
            </p>
          </div>
        </div>
      </div>
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
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowReview(true)}
              className="rounded-full border border-zinc-200 text-zinc-700 px-4 py-2 text-xs font-bold hover:border-zinc-400 transition-colors"
            >
              Leave review
            </button>
            <Link href="/chat" className="rounded-full border border-zinc-200 text-zinc-700 px-4 py-2 text-xs font-bold hover:border-zinc-400 transition-colors">
              Message →
            </Link>
          </div>
        </div>
      </div>

      {/* Review modal */}
      {showReview && (
        <ReviewModal
          landlordId={property.landlord.id}
          landlordName={property.landlord.fullName}
          propertyId={property.id}
          onClose={() => setShowReview(false)}
        />
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/tenant/disputes" className="bg-white rounded-2xl border border-zinc-200 p-4 hover:border-zinc-400 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">Disputes</p>
              <p className="text-xs text-zinc-400">Raise an issue</p>
            </div>
          </div>
        </Link>
        <Link href="/tenant/services" className="bg-white rounded-2xl border border-zinc-200 p-4 hover:border-zinc-400 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">Services</p>
              <p className="text-xs text-zinc-400">Request help</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
