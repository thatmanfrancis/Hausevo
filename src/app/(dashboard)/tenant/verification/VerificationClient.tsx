"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const UPGRADE_FEE = 1500;

type Props = {
  fullName: string;
  verificationTier: number;
  walletBalance: number;
  verificationBundlePaid: boolean;
  idDocumentUrl: string | null;
  selfieUrl: string | null;
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
}

// ── Step dots ─────────────────────────────────────────────────────────────

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
          i === current ? "w-6 bg-zinc-900" : i < current ? "w-3 bg-zinc-400" : "w-3 bg-zinc-200"
        }`} />
      ))}
    </div>
  );
}

// ── Already verified ───────────────────────────────────────────────────────

function AlreadyVerified({ tier }: { tier: number }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Verification</p>
        <h1 className="text-2xl font-extrabold text-zinc-900">Identity Verification</h1>
      </div>
      <div className="bg-white rounded-2xl border border-zinc-200 p-8 flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-600">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <h2 className="text-xl font-extrabold text-zinc-900 mb-2">
          {tier >= 2 ? "Fully Verified" : "Tier 1 Verified"}
        </h2>
        <p className="text-sm text-zinc-400 mb-6 max-w-xs">
          {tier >= 2
            ? "Your identity is fully verified. You have access to all platform features."
            : "Your identity is verified. You can apply for properties and your Hausevo Score is visible to landlords."}
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/properties" className="rounded-full bg-zinc-900 text-white px-6 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors">
            Browse properties →
          </Link>
          <Link href="/dashboard" className="rounded-full border border-zinc-200 text-zinc-700 px-6 py-2.5 text-sm font-bold hover:border-zinc-400 transition-colors">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function VerificationClient({
  fullName,
  verificationTier,
  walletBalance,
  verificationBundlePaid,
  idDocumentUrl,
  selfieUrl,
}: Props) {
  const router = useRouter();

  // Step 0 = ID Upload (free), Step 1 = NIN (free), Step 2 = BVN Upgrade (paid)
  const [step, setStep] = useState(idDocumentUrl ? 1 : 0);

  // Step 0: ID Upload state
  const [idDocUrl, setIdDocUrl] = useState(idDocumentUrl ?? "");
  const [idDocPreview, setIdDocPreview] = useState<string | null>(idDocumentUrl);
  const [selfieDocUrl, setSelfieDocUrl] = useState(selfieUrl ?? "");
  const [selfieDocPreview, setSelfieDocPreview] = useState<string | null>(selfieUrl);

  const [idUploadLoading, setIdUploadLoading] = useState(false);
  const [idUploadError, setIdUploadError] = useState("");
  const [idUploadSuccess, setIdUploadSuccess] = useState("");

  const idFileRef = useRef<HTMLInputElement>(null);
  const selfieFileRef = useRef<HTMLInputElement>(null);

  // Step 1 state (NIN)
  const [nin, setNin] = useState("");
  const [ninLoading, setNinLoading] = useState(false);
  const [ninError, setNinError] = useState("");
  const [ninSuccess, setNinSuccess] = useState("");

  // Step 2 state (BVN Upgrade)
  const [upgradeNin, setUpgradeNin] = useState("");
  const [bvn, setBvn] = useState("");
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selfieBase64, setSelfieBase64] = useState("");
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeError, setUpgradeError] = useState("");
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  function handleIdDocFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setIdDocPreview(result);
      // Mock Cloudinary URL upload
      setIdDocUrl("https://res.cloudinary.com/demo/image/upload/v12345/mock-id.jpg");
    };
    reader.readAsDataURL(file);
  }

  function handleSelfieDocFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setSelfieDocPreview(result);
      // Mock Cloudinary URL upload
      setSelfieDocUrl("https://res.cloudinary.com/demo/image/upload/v12345/mock-selfie.jpg");
    };
    reader.readAsDataURL(file);
  }

  async function handleIDUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIdUploadLoading(true);
    setIdUploadError("");
    setIdUploadSuccess("");

    if (!idDocUrl || !selfieDocUrl) {
      setIdUploadError("Please upload both your ID document and selfie.");
      setIdUploadLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/user/id-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idDocumentUrl: idDocUrl, selfieUrl: selfieDocUrl }),
      });
      const data = await res.json();

      if (!res.ok) {
        setIdUploadError(data.error ?? "Failed to upload ID document.");
      } else {
        setIdUploadSuccess("ID document submitted successfully!");
        setTimeout(() => setStep(1), 1500);
      }
    } catch {
      setIdUploadError("Network error. Please try again.");
    } finally {
      setIdUploadLoading(false);
    }
  }

  // Already verified
  if (verificationTier >= 1 || verificationBundlePaid) {
    return <AlreadyVerified tier={verificationTier} />;
  }

  // ── Step 0: Free NIN verification ────────────────────────────────────────

  async function handleNIN(e: React.FormEvent) {
    e.preventDefault();
    setNinLoading(true);
    setNinError("");
    setNinSuccess("");

    try {
      const res = await fetch("/api/verify/nin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nin: nin.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setNinError(data.error ?? "NIN verification failed.");
      } else {
        setNinSuccess(`NIN verified — ${data.ninName}`);
        // Pre-fill NIN for the upgrade step and advance
        setUpgradeNin(nin.trim());
        setTimeout(() => setStep(1), 1500);
      }
    } catch {
      setNinError("Network error. Please try again.");
    } finally {
      setNinLoading(false);
    }
  }

  // ── Selfie capture ────────────────────────────────────────────────────────

  function handleSelfieFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setSelfiePreview(result);
      // Strip data URI prefix before sending
      setSelfieBase64(result.replace(/^data:image\/\w+;base64,/, ""));
    };
    reader.readAsDataURL(file);
  }

  // ── Step 1: Paid upgrade ──────────────────────────────────────────────────

  async function handleUpgrade(e: React.FormEvent) {
    e.preventDefault();
    setUpgradeLoading(true);
    setUpgradeError("");

    if (!selfieBase64) {
      setUpgradeError("Please upload a selfie photo.");
      setUpgradeLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/verify/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nin: upgradeNin.trim(), selfieBase64, bvn: bvn.trim() }),
      });
      const data = await res.json();

      if (res.status === 402) {
        // Insufficient balance
        setUpgradeError(`Insufficient wallet balance. You need ${formatNaira(UPGRADE_FEE)} but have ${formatNaira(walletBalance)}. Top up your wallet first.`);
      } else if (!res.ok) {
        setUpgradeError(data.error ?? "Upgrade failed. Please try again.");
      } else {
        setUpgradeSuccess(true);
        setTimeout(() => router.push("/dashboard"), 2500);
      }
    } catch {
      setUpgradeError("Network error. Please try again.");
    } finally {
      setUpgradeLoading(false);
    }
  }

  // ── Success state ─────────────────────────────────────────────────────────

  if (upgradeSuccess) {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Verification</p>
          <h1 className="text-2xl font-extrabold text-zinc-900">Identity Verification</h1>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-600">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 className="text-xl font-extrabold text-zinc-900 mb-2">Upgraded to Tier 1! 🎉</h2>
          <p className="text-sm text-zinc-400 mb-2">You can now apply for properties.</p>
          <p className="text-xs text-zinc-400">Redirecting to dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Verification</p>
        <h1 className="text-2xl font-extrabold text-zinc-900">Identity Verification</h1>
      </div>

      {/* ── Step 0: ID Upload (FREE) ── */}
      {step === 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <StepDots total={3} current={0} />

          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Step 1 of 3 — Free</p>
          <h2 className="text-lg font-extrabold text-zinc-900 mb-1">Upload your ID Document</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Upload any government-issued ID (NIN Slip, Driver&apos;s License, Voter&apos;s Card, or International Passport) along with a selfie to verify your identity for free.
          </p>

          {idDocumentUrl && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">Status: Pending Review</p>
              <p className="text-xs text-amber-700 leading-relaxed mb-3">
                You have already submitted an ID. Our team is reviewing it. To get instant verification, you can skip to Step 2 (NIN Verification).
              </p>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-bold text-zinc-900 underline hover:text-zinc-600 transition-colors"
              >
                Skip to NIN Verification →
              </button>
            </div>
          )}

          <form onSubmit={handleIDUploadSubmit} className="flex flex-col gap-6">
            {idUploadError && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{idUploadError}</div>
            )}
            {idUploadSuccess && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                {idUploadSuccess}
              </div>
            )}

            {/* ID Document Zone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Government ID Document</label>
              <input
                ref={idFileRef}
                type="file"
                accept=".pdf,image/*"
                onChange={handleIdDocFile}
                className="hidden"
              />
              {idDocPreview ? (
                <div className="flex items-center gap-4 border border-zinc-200 rounded-xl p-3 bg-zinc-50">
                  <div className="h-12 w-12 bg-zinc-200 rounded-lg flex items-center justify-center text-zinc-600 font-bold text-xs uppercase overflow-hidden">
                    {idDocPreview.startsWith("data:") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={idDocPreview} alt="ID preview" className="h-full w-full object-cover" />
                    ) : (
                      "ID doc"
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-zinc-900">Document Selected</p>
                    <p className="text-[10px] text-zinc-500">Government ID Document</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => idFileRef.current?.click()}
                    className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    Replace
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => idFileRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 py-6 text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 transition-colors bg-white"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                  <span className="text-xs font-bold">Select ID document file</span>
                  <span className="text-[10px]">PDF, PNG, or JPG (Max 5MB)</span>
                </button>
              )}
            </div>

            {/* Selfie Zone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Selfie Photo</label>
              <input
                ref={selfieFileRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleSelfieDocFile}
                className="hidden"
              />
              {selfieDocPreview ? (
                <div className="flex items-center gap-4 border border-zinc-200 rounded-xl p-3 bg-zinc-50">
                  <div className="h-12 w-12 bg-zinc-200 rounded-lg flex items-center justify-center text-zinc-600 font-bold text-xs uppercase overflow-hidden">
                    {selfieDocPreview.startsWith("data:") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selfieDocPreview} alt="Selfie preview" className="h-full w-full object-cover" />
                    ) : (
                      "Selfie"
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-zinc-900">Selfie Captured</p>
                    <p className="text-[10px] text-zinc-500">Live facial photo</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => selfieFileRef.current?.click()}
                    className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    Retake
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => selfieFileRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 py-6 text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 transition-colors bg-white"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  <span className="text-xs font-bold">Take or upload selfie</span>
                  <span className="text-[10px]">Must show your face clearly</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={idUploadLoading || !idDocUrl || !selfieDocUrl}
              className="rounded-full bg-zinc-900 text-white py-3 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {idUploadLoading ? "Submitting ID…" : "Submit for Verification — Free"}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between">
            <p className="text-xs text-zinc-400">Want instant automated verification?</p>
            <button onClick={() => setStep(1)} className="text-xs font-bold text-zinc-700 hover:text-zinc-900 transition-colors">
              Skip to NIN Verification →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 1: NIN (FREE) ── */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <StepDots total={3} current={1} />

          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Step 2 of 3 — Free</p>
          <h2 className="text-lg font-extrabold text-zinc-900 mb-1">Verify your NIN</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Enter your 11-digit National Identification Number. This is free and confirms your identity against NIMC records.
          </p>

          {/* What you get */}
          <div className="bg-zinc-50 rounded-xl p-4 mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">What you unlock</p>
            <ul className="space-y-2">
              {["Browse all properties", "Save favourite listings", "Chat with landlords", "View property details"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-zinc-700">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-500 shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={handleNIN} className="flex flex-col gap-4">
            {ninError && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{ninError}</div>
            )}
            {ninSuccess && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                {ninSuccess}
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
                onChange={(e) => setNin(e.target.value.replace(/\D/g, ""))}
                placeholder="12345678901"
                required
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors font-mono tracking-widest"
              />
              <p className="text-xs text-zinc-400">Your full NIN is never stored — only a masked reference.</p>
            </div>

            <button
              type="submit"
              disabled={ninLoading || nin.length !== 11}
              className="rounded-full bg-zinc-900 text-white py-3 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {ninLoading ? "Verifying…" : "Verify NIN — Free"}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between">
            <button onClick={() => setStep(0)} className="text-xs font-bold text-zinc-700 hover:text-zinc-900 transition-colors">
              ← Back to ID upload
            </button>
            <button onClick={() => { setUpgradeNin(nin.trim()); setStep(2); }} className="text-xs font-bold text-zinc-700 hover:text-zinc-900 transition-colors">
              Skip to Tier 1 upgrade →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Upgrade to Tier 1 (₦1,500) ── */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <StepDots total={3} current={2} />

          <div className="flex items-start justify-between gap-4 mb-1">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Step 3 of 3 — ₦1,500</p>
              <h2 className="text-lg font-extrabold text-zinc-900">Upgrade to Tier 1</h2>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-zinc-400">Wallet balance</p>
              <p className={`text-sm font-extrabold ${walletBalance >= UPGRADE_FEE ? "text-zinc-900" : "text-red-600"}`}>
                {formatNaira(walletBalance)}
              </p>
            </div>
          </div>
          <p className="text-sm text-zinc-400 mb-6">
            Includes biometric selfie match + BVN financial signal. One-time fee of ₦1,500 deducted from your wallet.
          </p>

          {/* What you unlock */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-zinc-900 rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Tier 0 (current)</p>
              <ul className="space-y-1.5 text-xs text-zinc-400">
                <li className="flex items-center gap-1.5"><span className="text-zinc-500">✓</span> Browse properties</li>
                <li className="flex items-center gap-1.5"><span className="text-zinc-500">✓</span> Save & chat</li>
                <li className="flex items-center gap-1.5"><span className="text-zinc-600">✗</span> Apply for properties</li>
              </ul>
            </div>
            <div className="bg-white border-2 border-zinc-900 rounded-xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">Tier 1 (after)</p>
              <ul className="space-y-1.5 text-xs text-zinc-700">
                <li className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Apply for properties</li>
                <li className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Verified badge</li>
                <li className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Hausevo Score visible</li>
              </ul>
            </div>
          </div>

          {walletBalance < UPGRADE_FEE && (
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700 mb-4 flex items-start gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>
                You need {formatNaira(UPGRADE_FEE - walletBalance)} more in your wallet.{" "}
                <Link href="/wallet" className="font-bold underline underline-offset-2">Top up wallet →</Link>
              </span>
            </div>
          )}

          <form onSubmit={handleUpgrade} className="flex flex-col gap-4">
            {upgradeError && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{upgradeError}</div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="upgradeNin" className="text-xs font-bold uppercase tracking-widest text-zinc-400">NIN (11 digits)</label>
              <input
                id="upgradeNin"
                type="text"
                value={upgradeNin}
                readOnly
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500 outline-none cursor-not-allowed font-mono tracking-widest"
              />
              <p className="text-xs text-zinc-400">Carried over from Step 2.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="bvn" className="text-xs font-bold uppercase tracking-widest text-zinc-400">BVN (11 digits)</label>
              <input
                id="bvn"
                type="text"
                inputMode="numeric"
                maxLength={11}
                value={bvn}
                onChange={(e) => setBvn(e.target.value.replace(/\D/g, ""))}
                placeholder="22233344455"
                required
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors font-mono tracking-widest"
              />
              <p className="text-xs text-zinc-400">Your BVN is used for financial identity verification only.</p>
            </div>

            {/* Selfie upload */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Selfie Photo</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleSelfieFile}
                className="hidden"
              />
              {selfiePreview ? (
                <div className="flex items-center gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selfiePreview} alt="Selfie preview" className="h-16 w-16 rounded-xl object-cover border border-zinc-200" />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    Retake photo
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 py-6 text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 transition-colors bg-white"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  <span className="text-xs font-bold">Take or upload selfie</span>
                  <span className="text-[10px]">Must match your NIN photo</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={upgradeLoading || upgradeNin.length !== 11 || bvn.length !== 11 || !selfieBase64 || walletBalance < UPGRADE_FEE}
              className="rounded-full bg-zinc-900 text-white py-3 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {upgradeLoading ? "Verifying & upgrading…" : `Upgrade to Tier 1 — ${formatNaira(UPGRADE_FEE)}`}
            </button>

            <p className="text-xs text-zinc-400 text-center">
              ₦1,500 will be deducted from your wallet. Non-refundable once initiated.
            </p>
          </form>

          <button
            onClick={() => setStep(1)}
            className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-700 transition-colors bg-white"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to NIN verification
          </button>
        </div>
      )}
    </div>
  );
}
