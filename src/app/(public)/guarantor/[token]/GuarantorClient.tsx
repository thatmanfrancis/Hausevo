"use client";

import { useState } from "react";

type Props = {
  guarantor: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    relationship: string;
    status: string;
    isEmergency: boolean;
    acknowledgedAt: Date | null;
    token: string;
    user: { fullName: string };
    application: {
      property: { title: string; address: string; lga: string } | null;
    } | null;
  };
};

export default function GuarantorClient({ guarantor }: Props) {
  const [status, setStatus] = useState<string>(guarantor.status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAction(action: "acknowledge" | "decline") {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/guarantor/${guarantor.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to complete action.");
      } else {
        setStatus(data.status);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "ACKNOWLEDGED") {
    return (
      <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-xl font-extrabold text-zinc-900 mb-2">Thank you!</h2>
        <p className="text-sm text-zinc-500 leading-relaxed mb-1">
          You have successfully acknowledged your role as a guarantor for <strong>{guarantor.user.fullName}</strong>.
        </p>
        <p className="text-xs text-zinc-400">
          This window can now be safely closed.
        </p>
      </div>
    );
  }

  if (status === "DECLINED") {
    return (
      <div className="bg-white rounded-2xl border border-zinc-200 p-8 text-center shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        <h2 className="text-xl font-extrabold text-zinc-900 mb-2">Request Declined</h2>
        <p className="text-sm text-zinc-500 leading-relaxed">
          You have declined this request. The tenant has been notified to provide an alternative guarantor.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
        {guarantor.isEmergency ? "Emergency Contact Request" : "Digital Guarantor Request"}
      </p>
      <h2 className="text-xl font-extrabold text-zinc-900 mb-4">
        Hi {guarantor.fullName},
      </h2>
      <p className="text-sm text-zinc-600 leading-relaxed mb-6">
        <strong>{guarantor.user.fullName}</strong> has listed you as their{" "}
        {guarantor.isEmergency ? "emergency contact" : "guarantor"} on Hausevo.
        {!guarantor.isEmergency && guarantor.application?.property && (
          <span>
            {" "}for their tenancy application at <strong>{guarantor.application.property.title}</strong>, located at{" "}
            <strong>{guarantor.application.property.address}, {guarantor.application.property.lga}</strong>.
          </span>
        )}
      </p>

      {/* Info card */}
      <div className="bg-zinc-50 rounded-xl p-4 mb-6 text-xs text-zinc-500 leading-relaxed">
        <p className="font-bold text-zinc-700 uppercase tracking-widest mb-1.5">What this means</p>
        {guarantor.isEmergency ? (
          <p>As an emergency contact, landlords or Hausevo representatives will reach out to you if the tenant cannot be reached during critical situations.</p>
        ) : (
          <p>By acknowledging this request, you confirm that you know the tenant, vouch for their character, and can be contacted as a trusted reference. This digital process replaces physical agent verification.</p>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <button
          onClick={() => handleAction("acknowledge")}
          disabled={loading}
          className="w-full rounded-full bg-zinc-900 py-3 text-sm font-bold text-white hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Processing…" : guarantor.isEmergency ? "I Acknowledge Contact Request" : "I Acknowledge & Guarantee"}
        </button>
        <button
          onClick={() => handleAction("decline")}
          disabled={loading}
          className="w-full rounded-full border border-zinc-200 py-3 text-sm font-bold text-zinc-700 hover:border-zinc-400 transition-colors disabled:opacity-50"
        >
          Decline request
        </button>
      </div>
    </div>
  );
}
