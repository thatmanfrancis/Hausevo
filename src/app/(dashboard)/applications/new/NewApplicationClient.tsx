"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────

type Property = {
  id: string;
  title: string;
  address: string;
  lga: string;
  state: string;
  pricePerYear: number;
  totalPackage: number;
  listingType: string;
  status: string;
  images: { url: string }[];
  landlord: { id: string; fullName: string; verificationTier: number };
};

type Props = {
  property: Property;
  verificationTier: number;
  shackScore: number | null;
  existingApplication: { id: string; status: string } | null;
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

const LISTING_BADGE: Record<string, string> = {
  RENT:     "bg-blue-50 text-blue-700",
  SALE:     "bg-emerald-50 text-emerald-700",
  SHORTLET: "bg-amber-50 text-amber-700",
  LEASE:    "bg-purple-50 text-purple-700",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:   "Pending review",
  REVIEWING: "Under review",
  ACCEPTED:  "Accepted",
  REJECTED:  "Rejected",
  WITHDRAWN: "Withdrawn",
};

// ── Main component ─────────────────────────────────────────────────────────

export default function NewApplicationClient({
  property,
  verificationTier,
  shackScore,
  existingApplication,
}: Props) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const img = property.images[0]?.url;
  const isUnavailable = property.status !== "AVAILABLE";
  const needsVerification = verificationTier < 1;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/properties/${property.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to submit application. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success state ──────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/properties" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors">Properties</Link>
            <span className="text-xs text-zinc-300">/</span>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Apply</p>
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-900">Application Submitted</h1>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-10 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <p className="text-lg font-extrabold text-zinc-900 mb-1">Application sent!</p>
          <p className="text-sm text-zinc-500 mb-1 max-w-xs">
            Your application for <span className="font-bold text-zinc-700">{property.title}</span> has been submitted.
          </p>
          <p className="text-xs text-zinc-400 mb-6">
            The landlord will review it and get back to you. You&apos;ll be notified of any updates.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/tenant/applications"
              className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors"
            >
              View my applications →
            </Link>
            <Link
              href="/properties"
              className="rounded-full border border-zinc-200 text-zinc-700 px-5 py-2.5 text-sm font-bold hover:border-zinc-400 transition-colors"
            >
              Browse more
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Heading */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link
            href={`/properties/${property.id}`}
            className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            Property
          </Link>
          <span className="text-xs text-zinc-300">/</span>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Apply</p>
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900">Apply for Property</h1>
      </div>

      {/* Property summary */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        <div className="flex gap-4 p-5">
          <div className="relative h-20 w-28 shrink-0 rounded-xl overflow-hidden bg-zinc-100">
            {img ? (
              <Image src={img} alt={property.title} fill className="object-cover" sizes="112px" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-300">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-zinc-900 truncate">{property.title}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{property.address}, {property.lga}</p>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-sm font-extrabold text-zinc-900">
                {formatNaira(property.pricePerYear)}
                <span className="text-xs font-semibold text-zinc-400">/yr</span>
              </p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${LISTING_BADGE[property.listingType] ?? "bg-zinc-100 text-zinc-600"}`}>
                {property.listingType.charAt(0) + property.listingType.slice(1).toLowerCase()}
              </span>
            </div>
          </div>
        </div>
        <div className="border-t border-zinc-100 px-5 py-3 flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            Total package: <span className="font-bold text-zinc-700">{formatNaira(property.totalPackage)}</span>
          </p>
          <p className="text-xs text-zinc-500">
            Landlord: <span className="font-bold text-zinc-700">{property.landlord.fullName}</span>
            {property.landlord.verificationTier >= 1 && (
              <span className="ml-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">Verified</span>
            )}
          </p>
        </div>
      </div>

      {/* Already applied */}
      {existingApplication && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 flex items-start gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <p className="text-sm font-bold text-amber-800">You&apos;ve already applied</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Status: <span className="font-bold">{STATUS_LABELS[existingApplication.status] ?? existingApplication.status}</span>
            </p>
            <Link href="/tenant/applications" className="text-xs font-bold text-amber-800 underline underline-offset-2 mt-1 inline-block">
              View your application →
            </Link>
          </div>
        </div>
      )}

      {/* Verification gate */}
      {needsVerification && !existingApplication && (
        <div className="rounded-2xl bg-zinc-900 p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Verification Required</p>
          <p className="text-sm font-bold mb-1">Upgrade to Tier 1 to apply</p>
          <p className="text-xs text-zinc-400 mb-4">
            A one-time ₦1,500 verification unlocks applications, your Hausevo Score, and a verified badge.
          </p>
          <Link
            href="/tenant/verification"
            className="rounded-full bg-white text-zinc-900 px-5 py-2.5 text-sm font-bold hover:bg-zinc-100 transition-colors inline-block"
          >
            Verify now — ₦1,500 →
          </Link>
        </div>
      )}

      {/* Property unavailable */}
      {isUnavailable && !existingApplication && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-5 flex items-start gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <div>
            <p className="text-sm font-bold text-red-800">Property not available</p>
            <p className="text-xs text-red-700 mt-0.5">This property is no longer accepting applications.</p>
          </div>
        </div>
      )}

      {/* Application form */}
      {!existingApplication && !needsVerification && !isUnavailable && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Your Application</p>
          <p className="text-sm text-zinc-500 mb-5">
            Write a short message to the landlord introducing yourself. This is optional but increases your chances.
          </p>

          {/* Hausevo Score indicator */}
          {shackScore !== null && (
            <div className="flex items-center gap-3 rounded-xl bg-zinc-50 border border-zinc-200 px-4 py-3 mb-5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white text-xs font-bold">
                {shackScore}
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-700">Your Hausevo Score</p>
                <p className="text-[10px] text-zinc-400">This will be shared with the landlord alongside your application</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="message" className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Message to landlord <span className="normal-case font-normal text-zinc-400">(optional)</span>
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Hi, I'm interested in this property. I'm a working professional looking for a quiet place…"
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors resize-none"
              />
              <p className="text-xs text-zinc-400 text-right">{message.length}/500</p>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-zinc-900 text-white px-6 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting…" : "Submit application"}
              </button>
              <Link
                href={`/properties/${property.id}`}
                className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      )}

      {/* What happens next */}
      {!existingApplication && !needsVerification && !isUnavailable && (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">What happens next</p>
          <ol className="flex flex-col gap-2.5">
            {[
              "Your application is sent to the landlord for review.",
              "The landlord may move it to Reviewing status while they consider it.",
              "You'll be notified when they accept or reject your application.",
              "If accepted, a tenancy agreement will be created for you to sign.",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-600 text-[10px] font-bold mt-0.5">
                  {i + 1}
                </span>
                <p className="text-xs text-zinc-600">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
