
"use client";

import { useState } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────

type ServiceRequest = {
  id: string;
  category: string;
  notes: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  property: { id: string; title: string; lga: string };
};

type Props = {
  requests: ServiceRequest[];
  hasTenancy: boolean;
};

// ── Config ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "INTERNET",    label: "Internet",    icon: "📶" },
  { value: "DSTV",        label: "DSTV",        icon: "📺" },
  { value: "GENERATOR",   label: "Generator",   icon: "⚡" },
  { value: "FUMIGATION",  label: "Fumigation",  icon: "🪲" },
  { value: "CLEANING",    label: "Cleaning",    icon: "🧹" },
  { value: "SECURITY",    label: "Security",    icon: "🔒" },
  { value: "OTHER",       label: "Other",       icon: "🔧" },
];

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  OPEN:        { label: "Open",        cls: "bg-amber-50 text-amber-700" },
  ASSIGNED:    { label: "Assigned",    cls: "bg-blue-50 text-blue-700" },
  IN_PROGRESS: { label: "In Progress", cls: "bg-blue-50 text-blue-700" },
  COMPLETED:   { label: "Completed",   cls: "bg-emerald-50 text-emerald-700" },
  VERIFIED:    { label: "Verified",    cls: "bg-emerald-50 text-emerald-700" },
  PAID:        { label: "Paid",        cls: "bg-emerald-50 text-emerald-700" },
  DISPUTED:    { label: "Disputed",    cls: "bg-red-50 text-red-700" },
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ServicesClient({ requests, hasTenancy }: Props) {
  const [list, setList] = useState(requests);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("INTERNET");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, notes: notes.trim() || undefined }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error ?? "Failed to submit request. Please try again.");
        return;
      }

      setList((prev) => [{ ...data.serviceRequest, property: { id: "", title: "Your property", lga: "" } }, ...prev]);
      setShowForm(false);
      setNotes("");
      setCategory("INTERNET");
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
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Services</p>
        </div>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-extrabold text-zinc-900">Service Requests</h1>
          {hasTenancy && !showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors"
            >
              New request
            </button>
          )}
        </div>
      </div>

      {/* No tenancy warning */}
      {!hasTenancy && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 flex items-start gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <p className="text-sm font-bold text-amber-800">No active tenancy</p>
            <p className="text-xs text-amber-700 mt-0.5">You need an active tenancy to request services.</p>
          </div>
        </div>
      )}

      {/* New request form */}
      {showForm && hasTenancy && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-5">New Service Request</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors ${
                      category === c.value
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                    }`}
                  >
                    <span>{c.icon}</span>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="notes" className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Notes <span className="normal-case font-normal text-zinc-400">(optional)</span>
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Describe the issue or what you need…"
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors resize-none"
              />
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
                disabled={submitting}
                className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting…" : "Submit request"}
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

      {/* Requests list */}
      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-12 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <p className="text-sm font-bold text-zinc-900 mb-1">No service requests</p>
          <p className="text-xs text-zinc-400">Submit a request when you need help with something in your home</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
          {list.map((r) => {
            const s = STATUS_CONFIG[r.status] ?? { label: r.status, cls: "bg-zinc-100 text-zinc-600" };
            const cat = CATEGORIES.find((c) => c.value === r.category);

            return (
              <div key={r.id} className="flex items-start gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-lg">
                  {cat?.icon ?? "🔧"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <p className="text-sm font-bold text-zinc-900">{cat?.label ?? r.category}</p>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${s.cls}`}>{s.label}</span>
                  </div>
                  {r.notes && <p className="text-xs text-zinc-500 mb-1.5 line-clamp-2">{r.notes}</p>}
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    {r.property.title && <span>{r.property.title}</span>}
                    <span>{formatDate(r.createdAt)}</span>
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
