"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = {
  fullName: string;
  verificationTier: number;
  walletBalance: number;
  verificationBundlePaid: boolean;
  idDocumentUrl: string | null;
  selfieUrl: string | null;
};

// ── Already verified ───────────────────────────────────────────────────────

function AlreadyVerified() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Verification</p>
        <h1 className="text-2xl font-extrabold text-zinc-900">Identity Verification</h1>
      </div>
      <div className="bg-white rounded-2xl border border-zinc-200 p-8 flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100 mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <h2 className="text-xl font-extrabold text-zinc-900 mb-2">Identity Verified</h2>
        <p className="text-sm text-zinc-500 mb-6 max-w-xs leading-relaxed">
          Your NIN has been verified. You can apply for properties and your Hausevo Score is visible to landlords.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/properties"
            className="rounded-full bg-zinc-900 text-white px-6 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors"
          >
            Browse properties →
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-zinc-200 text-zinc-700 px-6 py-2.5 text-sm font-bold hover:border-zinc-400 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function VerificationClient({
  verificationTier,
  verificationBundlePaid,
}: Props) {
  const router = useRouter();

  const [nin, setNin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [verifiedName, setVerifiedName] = useState("");

  // Already verified
  if (verificationTier >= 1 || verificationBundlePaid) {
    return <AlreadyVerified />;
  }

  async function handleNIN(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/verify/nin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nin: nin.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "NIN verification failed. Please try again.");
      } else {
        setVerifiedName(data.ninName ?? "");
        setSuccess(true);
        setTimeout(() => router.push("/dashboard"), 2500);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Success state ──────────────────────────────────────────────────────

  if (success) {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Verification</p>
          <h1 className="text-2xl font-extrabold text-zinc-900">Identity Verification</h1>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100 mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-xl font-extrabold text-zinc-900 mb-1">Identity Verified</h2>
          {verifiedName && (
            <p className="text-sm font-semibold text-zinc-500 mb-1">{verifiedName}</p>
          )}
          <p className="text-sm text-zinc-400 mb-2">You can now apply for properties.</p>
          <p className="text-xs text-zinc-400">Redirecting to dashboard…</p>
        </div>
      </div>
    );
  }

  // ── Verification form ──────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Verification</p>
        <h1 className="text-2xl font-extrabold text-zinc-900">Identity Verification</h1>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-extrabold text-zinc-900">NIN Verification</h2>
            <p className="text-sm text-zinc-500 mt-0.5 leading-relaxed">
              Enter your 11-digit National Identification Number. We verify it against NIMC records via Dojah.
            </p>
          </div>
        </div>

        {/* What you unlock */}
        <div className="bg-zinc-50 rounded-xl p-4 mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">What verification unlocks</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              "Apply for properties",
              "Verified badge on profile",
              "Hausevo Score visible to landlords",
              "Priority in application queue",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-zinc-700">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleNIN} className="flex flex-col gap-4">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="nin" className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              NIN (11 digits)
            </label>
            <input
              id="nin"
              type="text"
              inputMode="numeric"
              maxLength={11}
              value={nin}
              onChange={(e) => {
                setError("");
                setNin(e.target.value.replace(/\D/g, ""));
              }}
              placeholder="12345678901"
              required
              autoComplete="off"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors font-mono tracking-widest"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-400">Your full NIN is never stored — only a masked reference.</p>
              <p className={`text-xs font-mono tabular-nums ${nin.length === 11 ? "text-emerald-600" : "text-zinc-400"}`}>
                {nin.length}/11
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || nin.length !== 11}
            className="rounded-full bg-zinc-900 text-white py-3 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                </svg>
                Verifying…
              </>
            ) : (
              "Verify my identity"
            )}
          </button>
        </form>

        {/* Trust note */}
        <p className="text-[10px] text-zinc-400 text-center mt-4">
          Powered by Dojah · NIMC-certified identity lookup · Your data is encrypted
        </p>
      </div>
    </div>
  );
}
