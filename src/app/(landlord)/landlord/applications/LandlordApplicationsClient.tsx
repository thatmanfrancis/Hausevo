"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

// ── Types ──────────────────────────────────────────────────────────────────

type Tenancy = {
  id: string; status: string; startDate: Date; endDate: Date;
  cautionDeposit: number; savingsGoal: number;
};

type Application = {
  id: string; status: string; message: string | null;
  rejectionReason: string | null; shackScoreAtApplication: number | null;
  createdAt: Date; updatedAt: Date;
  property: {
    id: string; title: string; lga: string; pricePerYear: number;
    images: { url: string }[];
    tenancy: Tenancy | null;
  };
  tenant: {
    id: string; fullName: string; email: string; phoneNumber: string;
    verificationTier: number; shackScore: { score: number } | null;
  };
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
}
function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: "Pending",   cls: "bg-amber-50 text-amber-700" },
  REVIEWING: { label: "Reviewing", cls: "bg-blue-50 text-blue-700" },
  ACCEPTED:  { label: "Accepted",  cls: "bg-emerald-50 text-emerald-700" },
  REJECTED:  { label: "Rejected",  cls: "bg-red-50 text-red-700" },
  WITHDRAWN: { label: "Withdrawn", cls: "bg-zinc-100 text-zinc-500" },
};

const FILTERS = ["ALL", "PENDING", "REVIEWING", "ACCEPTED", "REJECTED", "WITHDRAWN"];

// ── Create Tenancy Modal ───────────────────────────────────────────────────

function CreateTenancyModal({
  application, onClose, onCreated,
}: { application: Application; onClose: () => void; onCreated: (tenancy: Tenancy) => void }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [cautionDeposit, setCautionDeposit] = useState("");
  const [savingsGoal, setSavingsGoal] = useState(
    application.property.pricePerYear ? String(application.property.pricePerYear) : ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/tenancy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: application.id,
          startDate, endDate,
          cautionDeposit: Number(cautionDeposit),
          savingsGoal: Number(savingsGoal),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create tenancy."); return; }
      onCreated(data.tenancy);
    } catch { setError("Network error. Please try again."); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-100">
          <div>
            <p className="text-base font-extrabold text-zinc-900">Create Tenancy</p>
            <p className="text-xs text-zinc-400 mt-0.5">For {application.tenant.fullName} · {application.property.title}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100 transition-colors text-zinc-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Move-in Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-colors" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Move-out Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-colors" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Security / Caution Deposit (₦)</label>
            <input type="number" min="0" value={cautionDeposit} onChange={(e) => setCautionDeposit(e.target.value)} required placeholder="e.g. 200000"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors" />
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              The refundable deposit the tenant pays upfront before moving in — typically 1–2 months rent. This is recorded here so both parties have proof. <span className="font-semibold text-zinc-500">No money is collected through this form.</span>
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Annual Rent / Savings Goal (₦)</label>
            <input type="number" min="0" value={savingsGoal} onChange={(e) => setSavingsGoal(e.target.value)} required placeholder="e.g. 1200000"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors" />
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              The total rent the tenant needs to pay for the tenancy period. Used to generate the rent payment schedule and track how much has been paid. Defaults to the property&apos;s annual rent price.
            </p>
          </div>
          {error && <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={submitting}
              className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50">
              {submitting ? "Creating…" : "Create tenancy"}
            </button>
            <button type="button" onClick={onClose} className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Tenancy Modal ─────────────────────────────────────────────────────

function EditTenancyModal({
  tenancy, propertyTitle, tenantName, onClose, onRequested,
}: { tenancy: Tenancy; propertyTitle: string; tenantName: string; onClose: () => void; onRequested: () => void }) {
  const [startDate, setStartDate] = useState(new Date(tenancy.startDate).toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date(tenancy.endDate).toISOString().split("T")[0]);
  const [cautionDeposit, setCautionDeposit] = useState(String(tenancy.cautionDeposit));
  const [savingsGoal, setSavingsGoal] = useState(String(tenancy.savingsGoal));
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) { setError("Please explain why you need to make these changes."); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/tenancy/${tenancy.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, cautionDeposit: Number(cautionDeposit), savingsGoal: Number(savingsGoal), reason }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Request failed."); return; }
      onRequested();
    } catch { setError("Network error. Please try again."); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-100">
          <div>
            <p className="text-base font-extrabold text-zinc-900">Edit Tenancy</p>
            <p className="text-xs text-zinc-400 mt-0.5">{tenantName} · {propertyTitle}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100 transition-colors text-zinc-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="px-6 py-3 bg-amber-50 border-b border-amber-100">
          <p className="text-xs text-amber-700 font-semibold">
            Changes require admin approval before they take effect. You will be notified once reviewed.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Move-in Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-colors" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Move-out Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-colors" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Caution Deposit (₦)</label>
              <input type="number" min="0" value={cautionDeposit} onChange={(e) => setCautionDeposit(e.target.value)} required
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-colors" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Annual Rent (₦)</label>
              <input type="number" min="0" value={savingsGoal} onChange={(e) => setSavingsGoal(e.target.value)} required
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-colors" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Reason for change *</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} required placeholder="e.g. Agreed date correction with tenant"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors resize-none" />
          </div>
          {error && <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={submitting}
              className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50">
              {submitting ? "Submitting…" : "Submit for admin approval"}
            </button>
            <button type="button" onClick={onClose} className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────────────────────

function DeleteTenancyModal({
  tenancy, propertyTitle, tenantName, onClose, onRequested,
}: { tenancy: Tenancy; propertyTitle: string; tenantName: string; onClose: () => void; onRequested: () => void }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) { setError("Please provide a reason."); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/tenancy/${tenancy.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Request failed."); return; }
      onRequested();
    } catch { setError("Network error. Please try again."); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-100">
          <div>
            <p className="text-base font-extrabold text-zinc-900">Terminate Tenancy</p>
            <p className="text-xs text-zinc-400 mt-0.5">{tenantName} · {propertyTitle}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100 transition-colors text-zinc-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="px-6 py-3 bg-red-50 border-b border-red-100">
          <p className="text-xs text-red-700 font-semibold">
            This will not terminate the tenancy immediately. An admin must review and approve the request first.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Reason for termination *</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} required placeholder="e.g. Mutual agreement to end tenancy early"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors resize-none" />
          </div>
          {error && <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={submitting}
              className="rounded-full bg-red-600 text-white px-5 py-2.5 text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50">
              {submitting ? "Submitting…" : "Request termination"}
            </button>
            <button type="button" onClick={onClose} className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function LandlordApplicationsClient({ applications: initial }: { applications: Application[] }) {
  const [list, setList] = useState(initial);
  const [filter, setFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Modal state
  const [createApp, setCreateApp] = useState<Application | null>(null);
  const [editApp, setEditApp] = useState<Application | null>(null);
  const [deleteApp, setDeleteApp] = useState<Application | null>(null);

  // Track per-application request outcomes
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  const filtered = filter === "ALL" ? list : list.filter((a) => a.status === filter);
  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === "ALL" ? list.length : list.filter((a) => a.status === f).length;
    return acc;
  }, {} as Record<string, number>);

  async function updateStatus(id: string, status: string, reason?: string) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...(reason && { rejectionReason: reason }) }),
      });
      if (res.ok) {
        setList((prev) => prev.map((a) => a.id === id ? { ...a, status, rejectionReason: reason ?? a.rejectionReason } : a));
        setRejectingId(null);
        setRejectionReason("");
      }
    } catch { /* silent */ }
    finally { setUpdatingId(null); }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Landlord</p>
          <h1 className="text-2xl font-extrabold text-zinc-900">Applications</h1>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                filter === f ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400"
              }`}>
              {f === "ALL" ? "All" : STATUS_CONFIG[f]?.label ?? f}
              {counts[f] > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${filter === f ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500"}`}>
                  {counts[f]}
                </span>
              )}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-12 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              </svg>
            </div>
            <p className="text-sm font-bold text-zinc-900 mb-1">No applications</p>
            <p className="text-xs text-zinc-400">Applications from tenants will appear here once your properties are live.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((app) => {
              const img = app.property.images[0]?.url;
              const s = STATUS_CONFIG[app.status] ?? { label: app.status, cls: "bg-zinc-100 text-zinc-600" };
              const canAct = app.status === "PENDING" || app.status === "REVIEWING";
              const isAccepted = app.status === "ACCEPTED";
              const existingTenancy = app.property.tenancy;
              const hasRequested = requestedIds.has(app.id);

              return (
                <div key={app.id} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
                  <div className="flex gap-4 p-5">
                    <div className="relative h-16 w-20 shrink-0 rounded-xl overflow-hidden bg-zinc-100">
                      {img ? (
                        <Image src={img} alt={app.property.title} fill className="object-cover" sizes="80px" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{app.tenant.fullName}</p>
                          <p className="text-xs text-zinc-500">{app.property.title} · {app.property.lga}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${s.cls}`}>{s.label}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        {app.tenant.verificationTier >= 1 && (
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Verified</span>
                        )}
                        {app.shackScoreAtApplication && (
                          <span className="text-xs text-zinc-500">Score: <span className="font-bold text-zinc-700">{app.shackScoreAtApplication}</span></span>
                        )}
                        <span className="text-xs text-zinc-400">{formatDate(app.createdAt)}</span>
                      </div>
                      {app.message && (
                        <p className="text-xs text-zinc-500 mt-2 italic line-clamp-2">&ldquo;{app.message}&rdquo;</p>
                      )}
                    </div>
                  </div>

                  {/* Actions row */}
                  {(canAct || isAccepted) && (
                    <div className="border-t border-zinc-100 px-5 py-3 flex flex-wrap items-center gap-2">
                      {canAct && (
                        <>
                          {app.status === "PENDING" && (
                            <button type="button" onClick={() => updateStatus(app.id, "REVIEWING")} disabled={updatingId === app.id}
                              className="rounded-full border border-blue-200 text-blue-700 px-4 py-1.5 text-xs font-bold hover:bg-blue-50 transition-colors disabled:opacity-50">
                              Mark reviewing
                            </button>
                          )}
                          <button type="button" onClick={() => updateStatus(app.id, "ACCEPTED")} disabled={updatingId === app.id}
                            className="rounded-full bg-emerald-600 text-white px-4 py-1.5 text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50">
                            {updatingId === app.id ? "…" : "Accept"}
                          </button>
                          {rejectingId === app.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input type="text" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Reason (optional)"
                                className="flex-1 rounded-xl border border-zinc-200 px-3 py-1.5 text-xs outline-none focus:border-zinc-900 transition-colors" />
                              <button type="button" onClick={() => updateStatus(app.id, "REJECTED", rejectionReason)} disabled={updatingId === app.id}
                                className="rounded-full bg-red-600 text-white px-4 py-1.5 text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-50">Confirm</button>
                              <button type="button" onClick={() => setRejectingId(null)} className="text-xs text-zinc-400 hover:text-zinc-700">Cancel</button>
                            </div>
                          ) : (
                            <button type="button" onClick={() => setRejectingId(app.id)}
                              className="rounded-full border border-red-200 text-red-600 px-4 py-1.5 text-xs font-bold hover:bg-red-50 transition-colors">Reject</button>
                          )}
                        </>
                      )}

                      {/* Accepted — no tenancy yet */}
                      {isAccepted && !existingTenancy && (
                        <button type="button" onClick={() => setCreateApp(app)}
                          className="rounded-full bg-zinc-900 text-white px-4 py-1.5 text-xs font-bold hover:bg-zinc-700 transition-colors">
                          Create tenancy →
                        </button>
                      )}

                      {/* Accepted — tenancy exists */}
                      {isAccepted && existingTenancy && !hasRequested && (
                        <>
                          <Link href={`/landlord/tenancies/${existingTenancy.id}`}
                            className="rounded-full border border-zinc-200 text-zinc-700 px-4 py-1.5 text-xs font-bold hover:border-zinc-400 transition-colors">
                            View tenancy
                          </Link>
                          <button type="button" onClick={() => setEditApp(app)}
                            className="rounded-full border border-zinc-200 text-zinc-700 px-4 py-1.5 text-xs font-bold hover:border-zinc-400 transition-colors">
                            Edit
                          </button>
                          <button type="button" onClick={() => setDeleteApp(app)}
                            className="rounded-full border border-red-200 text-red-600 px-4 py-1.5 text-xs font-bold hover:bg-red-50 transition-colors">
                            Terminate
                          </button>
                          <div className="flex items-center gap-1.5 ml-auto">
                            <span className="text-[10px] text-zinc-400">
                              {formatNaira(existingTenancy.cautionDeposit)} deposit · {formatDate(existingTenancy.startDate)} – {formatDate(existingTenancy.endDate)}
                            </span>
                          </div>
                        </>
                      )}

                      {/* Accepted — request already submitted */}
                      {isAccepted && existingTenancy && hasRequested && (
                        <span className="text-xs font-bold text-amber-600">
                          Request submitted — awaiting admin review
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {createApp && (
        <CreateTenancyModal
          application={createApp}
          onClose={() => setCreateApp(null)}
          onCreated={(tenancy) => {
            setList((prev) => prev.map((a) =>
              a.id === createApp.id ? { ...a, property: { ...a.property, tenancy } } : a
            ));
            setCreateApp(null);
          }}
        />
      )}
      {editApp && editApp.property.tenancy && (
        <EditTenancyModal
          tenancy={editApp.property.tenancy}
          propertyTitle={editApp.property.title}
          tenantName={editApp.tenant.fullName}
          onClose={() => setEditApp(null)}
          onRequested={() => {
            setRequestedIds((prev) => new Set(prev).add(editApp.id));
            setEditApp(null);
          }}
        />
      )}
      {deleteApp && deleteApp.property.tenancy && (
        <DeleteTenancyModal
          tenancy={deleteApp.property.tenancy}
          propertyTitle={deleteApp.property.title}
          tenantName={deleteApp.tenant.fullName}
          onClose={() => setDeleteApp(null)}
          onRequested={() => {
            setRequestedIds((prev) => new Set(prev).add(deleteApp.id));
            setDeleteApp(null);
          }}
        />
      )}
    </>
  );
}
