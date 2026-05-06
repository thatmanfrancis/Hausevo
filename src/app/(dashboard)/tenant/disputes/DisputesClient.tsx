
"use client";

import { useState } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────

type Dispute = {
  id: string;
  type: string;
  status: string;
  description: string;
  evidence: string[];
  resolution: string | null;
  createdAt: Date;
  updatedAt: Date;
  raisedBy: { id: string; fullName: string };
  against: { id: string; fullName: string };
  property: { id: string; title: string } | null;
};

type Tenancy = {
  id: string;
  property: {
    id: string;
    title: string;
    landlordId: string;
    landlord: { id: string; fullName: string };
  };
} | null;

type Props = {
  disputes: Dispute[];
  userId: string;
  tenancy: Tenancy;
};

// ── Config ─────────────────────────────────────────────────────────────────

const DISPUTE_TYPES = [
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "RENT", label: "Rent" },
  { value: "CAUTION_DEPOSIT", label: "Caution Deposit" },
  { value: "PROPERTY_CONDITION", label: "Property Condition" },
];

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  OPEN:         { label: "Open",         cls: "bg-amber-50 text-amber-700" },
  UNDER_REVIEW: { label: "Under Review", cls: "bg-blue-50 text-blue-700" },
  RESOLVED:     { label: "Resolved",     cls: "bg-emerald-50 text-emerald-700" },
  ESCALATED:    { label: "Escalated",    cls: "bg-red-50 text-red-700" },
};

const TYPE_CONFIG: Record<string, { label: string; cls: string }> = {
  MAINTENANCE:       { label: "Maintenance",       cls: "bg-orange-50 text-orange-700" },
  RENT:              { label: "Rent",              cls: "bg-blue-50 text-blue-700" },
  CAUTION_DEPOSIT:   { label: "Caution Deposit",   cls: "bg-purple-50 text-purple-700" },
  PROPERTY_CONDITION:{ label: "Property Condition", cls: "bg-zinc-100 text-zinc-600" },
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

// ── Main component ─────────────────────────────────────────────────────────

export default function DisputesClient({ disputes, userId, tenancy }: Props) {
  const [list, setList] = useState(disputes);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [type, setType] = useState("MAINTENANCE");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tenancy) return;
    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          againstId: tenancy.property.landlordId,
          type,
          description,
          propertyId: tenancy.property.id,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error ?? "Failed to raise dispute. Please try again.");
        return;
      }

      // Prepend new dispute to list
      setList((prev) => [{
        ...data.dispute,
        raisedBy: { id: userId, fullName: "You" },
        against: tenancy.property.landlord,
        property: { id: tenancy.property.id, title: tenancy.property.title },
      }, ...prev]);

      setShowForm(false);
      setDescription("");
      setType("MAINTENANCE");
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Heading */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/tenant/tenancy" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors">Tenancy</Link>
          <span className="text-xs text-zinc-300">/</span>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Disputes</p>
        </div>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-extrabold text-zinc-900">Disputes</h1>
          {tenancy && !showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors"
            >
              Raise dispute
            </button>
          )}
        </div>
      </div>

      {/* No tenancy warning */}
      {!tenancy && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 flex items-start gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <p className="text-sm font-bold text-amber-800">No active tenancy</p>
            <p className="text-xs text-amber-700 mt-0.5">You need an active tenancy to raise a dispute.</p>
          </div>
        </div>
      )}

      {/* Raise dispute form */}
      {showForm && tenancy && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">New Dispute</p>
          <p className="text-sm text-zinc-500 mb-5">
            Against <span className="font-bold text-zinc-700">{tenancy.property.landlord.fullName}</span> · {tenancy.property.title}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Type</label>
              <div className="grid grid-cols-2 gap-2">
                {DISPUTE_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-bold text-left transition-colors ${
                      type === t.value
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
                maxLength={1000}
                placeholder="Describe the issue in detail…"
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors resize-none"
              />
              <p className="text-xs text-zinc-400 text-right">{description.length}/1000</p>
            </div>

            {formError && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {formError}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting || !description.trim()}
                className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting…" : "Submit dispute"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormError(""); }}
                className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Disputes list */}
      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <p className="text-sm font-bold text-zinc-900 mb-1">No disputes</p>
          <p className="text-xs text-zinc-400">Any disputes you raise will appear here</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((d) => {
            const s = STATUS_CONFIG[d.status] ?? { label: d.status, cls: "bg-zinc-100 text-zinc-600" };
            const t = TYPE_CONFIG[d.type] ?? { label: d.type, cls: "bg-zinc-100 text-zinc-600" };
            const isRaiser = d.raisedBy.id === userId;

            return (
              <div key={d.id} className="bg-white rounded-2xl border border-zinc-200 p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${t.cls}`}>{t.label}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${s.cls}`}>{s.label}</span>
                  </div>
                  <p className="text-xs text-zinc-400 shrink-0">{formatDate(d.createdAt)}</p>
                </div>

                <p className="text-sm text-zinc-700 mb-3 leading-relaxed">{d.description}</p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                  {d.property && (
                    <span className="font-semibold text-zinc-600">{d.property.title}</span>
                  )}
                  <span>
                    {isRaiser ? `Against ${d.against.fullName}` : `Raised by ${d.raisedBy.fullName}`}
                  </span>
                </div>

                {d.resolution && (
                  <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                    <p className="text-xs font-bold text-emerald-700 mb-0.5">Resolution</p>
                    <p className="text-xs text-emerald-700">{d.resolution}</p>
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
