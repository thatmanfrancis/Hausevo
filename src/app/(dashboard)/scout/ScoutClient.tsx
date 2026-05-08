"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ImageUpload from "@/app/components/ImageUpload";

// ── Lagos LGAs ─────────────────────────────────────────────────────────────

const LAGOS_LGAS = [
  "Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa",
  "Badagry", "Epe", "Eti-Osa", "Ibeju-Lekki", "Ifako-Ijaiye",
  "Ikeja", "Ikorodu", "Kosofe", "Lagos Island", "Lagos Mainland",
  "Mushin", "Ojo", "Oshodi-Isolo", "Shomolu", "Surulere",
];

const RENT_FREQUENCIES = [
  { value: "ANNUALLY",   label: "Annually" },
  { value: "BIANNUALLY", label: "Every 6 months" },
  { value: "QUARTERLY",  label: "Quarterly" },
  { value: "MONTHLY",    label: "Monthly" },
];

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ScoutClient() {
  const router = useRouter();

  // Step 1: key entry
  const [step, setStep] = useState<"key" | "details" | "done">("key");
  const [accessKey, setAccessKey] = useState("");
  const [keyError, setKeyError] = useState("");

  // Step 2: property details
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [lga, setLga] = useState("");
  const [pricePerYear, setPricePerYear] = useState("");
  const [totalPackage, setTotalPackage] = useState("");
  const [rentFrequency, setRentFrequency] = useState("ANNUALLY");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submittedProperty, setSubmittedProperty] = useState<{ id: string; title: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/access-keys/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: accessKey.trim().toUpperCase(),
          title,
          address,
          lga,
          pricePerYear: Number(pricePerYear),
          totalPackage: Number(totalPackage),
          rentFrequency,
          metadata: {
            bedrooms: bedrooms ? Number(bedrooms) : undefined,
            bathrooms: bathrooms ? Number(bathrooms) : undefined,
            propertyType: propertyType || undefined,
            images: imageUrls.length > 0 ? imageUrls : undefined,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error ?? "Submission failed. Please try again.");
        return;
      }

      setSubmittedProperty(data.property);
      setStep("done");
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Done state ─────────────────────────────────────────────────────────

  if (step === "done" && submittedProperty) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Scout</p>
          <h1 className="text-2xl font-extrabold text-zinc-900">Listing Submitted</h1>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-10 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <p className="text-lg font-extrabold text-zinc-900 mb-1">Property submitted!</p>
          <p className="text-sm text-zinc-500 mb-1 max-w-xs">
            <span className="font-bold text-zinc-700">{submittedProperty.title}</span> is now pending admin verification.
          </p>
          <p className="text-xs text-zinc-400 mb-6 max-w-xs">
            Your scout reward will be paid once the listing is verified and goes live. You&apos;ll get a notification.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/tenant/referrals"
              className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors"
            >
              View my rewards →
            </Link>
            <button
              type="button"
              onClick={() => { setStep("key"); setAccessKey(""); setTitle(""); setAddress(""); setLga(""); setPricePerYear(""); setTotalPackage(""); }}
              className="rounded-full border border-zinc-200 text-zinc-700 px-5 py-2.5 text-sm font-bold hover:border-zinc-400 transition-colors"
            >
              Submit another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Heading */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Scout</p>
        <h1 className="text-2xl font-extrabold text-zinc-900">Submit a Listing</h1>
      </div>

      {/* How it works */}
      <div className="bg-zinc-900 rounded-2xl p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">How scouting works</p>
        <ol className="flex flex-col gap-3">
          {[
            "A landlord gives you their unique access key (LAG-XXX-XXX format).",
            "You enter the key and fill in the property details.",
            "Admin verifies the listing with the landlord.",
            "Once live, you earn a scout reward — paid to your wallet.",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white text-xs font-bold mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-zinc-300">{step}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Step 1: Access key */}
      {step === "key" && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Step 1 of 2</p>
          <p className="font-bold text-zinc-900 text-sm mb-5">Enter the landlord&apos;s access key</p>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="accessKey" className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Access Key
              </label>
              <input
                id="accessKey"
                type="text"
                value={accessKey}
                onChange={(e) => {
                  setAccessKey(e.target.value.toUpperCase());
                  setKeyError("");
                }}
                placeholder="LAG-XXX-XXX"
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors font-mono tracking-widest uppercase"
              />
              <p className="text-xs text-zinc-400">The landlord generates this key from their dashboard.</p>
            </div>

            {keyError && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {keyError}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (!accessKey.trim()) {
                  setKeyError("Please enter an access key.");
                  return;
                }
                setStep("details");
              }}
              className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors self-start"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Property details */}
      {step === "details" && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Step 2 of 2</p>
          <p className="font-bold text-zinc-900 text-sm mb-1">Property details</p>
          <p className="text-xs text-zinc-500 mb-5">
            Key: <span className="font-mono font-bold text-zinc-700">{accessKey}</span>
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="title" className="text-xs font-bold uppercase tracking-widest text-zinc-400">Property Title</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 3 Bedroom Flat in Lekki Phase 1"
                required
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
              />
            </div>

            {/* Address */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="address" className="text-xs font-bold uppercase tracking-widest text-zinc-400">Street Address</label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 12 Admiralty Way"
                required
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
              />
            </div>

            {/* LGA */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="lga" className="text-xs font-bold uppercase tracking-widest text-zinc-400">LGA</label>
              <select
                id="lga"
                value={lga}
                onChange={(e) => setLga(e.target.value)}
                required
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-colors"
              >
                <option value="">Select LGA…</option>
                {LAGOS_LGAS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="pricePerYear" className="text-xs font-bold uppercase tracking-widest text-zinc-400">Rent / Year (₦)</label>
                <input
                  id="pricePerYear"
                  type="number"
                  min="0"
                  value={pricePerYear}
                  onChange={(e) => setPricePerYear(e.target.value)}
                  placeholder="e.g. 1200000"
                  required
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
                />
                {pricePerYear && Number(pricePerYear) > 0 && (
                  <p className="text-xs text-zinc-400">{formatNaira(Number(pricePerYear))}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="totalPackage" className="text-xs font-bold uppercase tracking-widest text-zinc-400">Total Package (₦)</label>
                <input
                  id="totalPackage"
                  type="number"
                  min="0"
                  value={totalPackage}
                  onChange={(e) => setTotalPackage(e.target.value)}
                  placeholder="e.g. 1500000"
                  required
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
                />
                {totalPackage && Number(totalPackage) > 0 && (
                  <p className="text-xs text-zinc-400">{formatNaira(Number(totalPackage))}</p>
                )}
              </div>
            </div>

            {/* Rent frequency */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Rent Frequency</label>
              <div className="grid grid-cols-2 gap-2">
                {RENT_FREQUENCIES.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setRentFrequency(f.value)}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-bold text-left transition-colors ${
                      rentFrequency === f.value
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional details */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="bedrooms" className="text-xs font-bold uppercase tracking-widest text-zinc-400">Beds</label>
                <input
                  id="bedrooms"
                  type="number"
                  min="0"
                  max="20"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  placeholder="3"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="bathrooms" className="text-xs font-bold uppercase tracking-widest text-zinc-400">Baths</label>
                <input
                  id="bathrooms"
                  type="number"
                  min="0"
                  max="20"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  placeholder="2"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="propertyType" className="text-xs font-bold uppercase tracking-widest text-zinc-400">Type</label>
                <select
                  id="propertyType"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-colors"
                >
                  <option value="">Any</option>
                  <option value="Flat">Flat</option>
                  <option value="Duplex">Duplex</option>
                  <option value="Bungalow">Bungalow</option>
                  <option value="Terrace">Terrace</option>
                  <option value="Detached">Detached</option>
                  <option value="Semi-Detached">Semi-Detached</option>
                  <option value="Self-Contain">Self-Contain</option>
                  <option value="Room & Parlour">Room & Parlour</option>
                </select>
              </div>
            </div>

            {/* Photos */}
            <ImageUpload onUpload={setImageUrls} maxFiles={10} />

            {submitError && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {submitError}
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting…" : "Submit listing"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("key"); setSubmitError(""); }}
                className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                ← Change key
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
