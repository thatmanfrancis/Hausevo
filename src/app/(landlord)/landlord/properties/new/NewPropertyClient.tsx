"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── Data ───────────────────────────────────────────────────────────────────

const LAGOS_LGAS = [
  "Agege","Ajeromi-Ifelodun","Alimosho","Amuwo-Odofin","Apapa",
  "Badagry","Epe","Eti-Osa","Ibeju-Lekki","Ifako-Ijaiye",
  "Ikeja","Ikorodu","Kosofe","Lagos Island","Lagos Mainland",
  "Mushin","Ojo","Oshodi-Isolo","Shomolu","Surulere",
];

const LISTING_TYPES = [
  { value: "RENT",     label: "For Rent",  desc: "Monthly or annual rental" },
  { value: "SALE",     label: "For Sale",  desc: "Outright purchase" },
  { value: "LEASE",    label: "Lease",     desc: "Long-term lease agreement" },
  { value: "SHORTLET", label: "Shortlet",  desc: "Short-term stays" },
];

const RENT_FREQUENCIES = [
  { value: "ANNUALLY",   label: "Annually",      desc: "1 year upfront" },
  { value: "BIANNUALLY", label: "Every 6 months", desc: "2 payments/year" },
  { value: "QUARTERLY",  label: "Quarterly",     desc: "4 payments/year" },
  { value: "MONTHLY",    label: "Monthly",       desc: "12 payments/year" },
];

const PROPERTY_TYPES = [
  "Self Contain","Mini Flat","2 Bedroom Flat","3 Bedroom Flat",
  "Bungalow","Duplex","Semi-Detached","Detached","Terrace",
  "Shortlet Apartment","Room & Parlour","Mansion",
];

const COMMON_AMENITIES = [
  "Borehole","Generator","Security","Parking","CCTV",
  "Boys Quarters","Swimming Pool","Gym","Garden","Solar",
  "Pre-paid Meter","Gated Estate","DSTV","Air Conditioning","Balcony",
];

// ── Helpers ────────────────────────────────────────────────────────────────

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
}

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

// ── Main component ─────────────────────────────────────────────────────────

export default function NewPropertyClient() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Step 1 — Location & type
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [lga, setLga] = useState("");
  const [listingType, setListingType] = useState("RENT");

  // Step 2 — Pricing
  const [pricePerYear, setPricePerYear] = useState("");
  const [totalPackage, setTotalPackage] = useState("");
  const [rentFrequency, setRentFrequency] = useState("ANNUALLY");

  // Step 3 — Details
  const [propertyType, setPropertyType] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function toggleAmenity(a: string) {
    setSelectedAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  }

  // Step validation
  const step1Valid = title.trim() && address.trim() && lga;
  const step2Valid = pricePerYear && Number(pricePerYear) > 0 && totalPackage && Number(totalPackage) > 0;

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          address,
          lga,
          listingType,
          pricePerYear: Number(pricePerYear),
          totalPackage: Number(totalPackage),
          rentFrequency,
          metadata: {
            propertyType: propertyType || undefined,
            bedrooms: bedrooms ? Number(bedrooms) : undefined,
            bathrooms: bathrooms ? Number(bathrooms) : undefined,
            description: description || undefined,
            amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create listing. Please try again.");
        setSubmitting(false);
        return;
      }

      router.push(`/landlord/properties/${data.property.id}`);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  // ── Step 1: Location & Type ──────────────────────────────────────────────

  if (step === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/landlord/properties" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors">Properties</Link>
            <span className="text-xs text-zinc-300">/</span>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">New</p>
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-900">Add New Listing</h1>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <StepDots total={3} current={0} />
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Step 1 of 3</p>
          <p className="text-base font-extrabold text-zinc-900 mb-5">Where is the property?</p>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="title" className="text-xs font-bold uppercase tracking-widest text-zinc-400">Property Title</label>
              <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 3 Bedroom Flat in Lekki Phase 1"
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="address" className="text-xs font-bold uppercase tracking-widest text-zinc-400">Street Address</label>
              <input id="address" type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 12 Admiralty Way, Lekki Phase 1"
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="lga" className="text-xs font-bold uppercase tracking-widest text-zinc-400">LGA</label>
              <select id="lga" value={lga} onChange={(e) => setLga(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-colors">
                <option value="">Select LGA…</option>
                {LAGOS_LGAS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Listing Type</label>
              <div className="grid grid-cols-2 gap-2">
                {LISTING_TYPES.map((t) => (
                  <button key={t.value} type="button" onClick={() => setListingType(t.value)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      listingType === t.value ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 hover:border-zinc-400"
                    }`}>
                    <p className={`text-sm font-bold ${listingType === t.value ? "text-white" : "text-zinc-900"}`}>{t.label}</p>
                    <p className={`text-xs mt-0.5 ${listingType === t.value ? "text-zinc-300" : "text-zinc-400"}`}>{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button type="button" onClick={() => setStep(1)} disabled={!step1Valid}
              className="rounded-full bg-zinc-900 text-white px-6 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Continue →
            </button>
            <Link href="/landlord/properties" className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">Cancel</Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Pricing ──────────────────────────────────────────────────────

  if (step === 1) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/landlord/properties" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors">Properties</Link>
            <span className="text-xs text-zinc-300">/</span>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">New</p>
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-900">Add New Listing</h1>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <StepDots total={3} current={1} />
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Step 2 of 3</p>
          <p className="text-base font-extrabold text-zinc-900 mb-5">How much does it cost?</p>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pricePerYear" className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                {listingType === "SHORTLET" ? "Daily Rate (₦)" : "Annual Rent (₦)"}
              </label>
              <input id="pricePerYear" type="number" min="0" value={pricePerYear}
                onChange={(e) => setPricePerYear(e.target.value)}
                placeholder="e.g. 1200000"
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors" />
              {pricePerYear && Number(pricePerYear) > 0 && (
                <p className="text-xs text-zinc-400">{formatNaira(Number(pricePerYear))}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="totalPackage" className="text-xs font-bold uppercase tracking-widest text-zinc-400">Total Package (₦)</label>
              <input id="totalPackage" type="number" min="0" value={totalPackage}
                onChange={(e) => setTotalPackage(e.target.value)}
                placeholder="Rent + agency + caution deposit"
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors" />
              {totalPackage && Number(totalPackage) > 0 && (
                <p className="text-xs text-zinc-400">{formatNaira(Number(totalPackage))}</p>
              )}
              <p className="text-xs text-zinc-400">Include all upfront costs — rent, agency fee, caution deposit.</p>
            </div>

            {listingType === "RENT" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Rent Frequency</label>
                <div className="grid grid-cols-2 gap-2">
                  {RENT_FREQUENCIES.map((f) => (
                    <button key={f.value} type="button" onClick={() => setRentFrequency(f.value)}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        rentFrequency === f.value ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 hover:border-zinc-400"
                      }`}>
                      <p className={`text-sm font-bold ${rentFrequency === f.value ? "text-white" : "text-zinc-900"}`}>{f.label}</p>
                      <p className={`text-xs mt-0.5 ${rentFrequency === f.value ? "text-zinc-300" : "text-zinc-400"}`}>{f.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button type="button" onClick={() => setStep(0)}
              className="rounded-full border border-zinc-200 text-zinc-700 px-6 py-2.5 text-sm font-bold hover:border-zinc-400 transition-colors">
              ← Back
            </button>
            <button type="button" onClick={() => setStep(2)} disabled={!step2Valid}
              className="rounded-full bg-zinc-900 text-white px-6 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Continue →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 3: Property details ─────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/landlord/properties" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors">Properties</Link>
          <span className="text-xs text-zinc-300">/</span>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">New</p>
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900">Add New Listing</h1>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <StepDots total={3} current={2} />
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Step 3 of 3</p>
        <p className="text-base font-extrabold text-zinc-900 mb-5">Tell us about the property</p>

        <div className="flex flex-col gap-5">
          {/* Property type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Property Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PROPERTY_TYPES.map((t) => (
                <button key={t} type="button" onClick={() => setPropertyType(propertyType === t ? "" : t)}
                  className={`rounded-xl border py-2.5 px-3 text-sm font-bold text-left transition-colors ${
                    propertyType === t ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Beds & baths */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Bedrooms</label>
              <div className="flex gap-2">
                {["1","2","3","4","5+"].map((n) => (
                  <button key={n} type="button" onClick={() => setBedrooms(bedrooms === n ? "" : n)}
                    className={`flex-1 rounded-xl border py-2.5 text-sm font-bold transition-colors ${
                      bedrooms === n ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                    }`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Bathrooms</label>
              <div className="flex gap-2">
                {["1","2","3","4+"].map((n) => (
                  <button key={n} type="button" onClick={() => setBathrooms(bathrooms === n ? "" : n)}
                    className={`flex-1 rounded-xl border py-2.5 text-sm font-bold transition-colors ${
                      bathrooms === n ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                    }`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {COMMON_AMENITIES.map((a) => (
                <button key={a} type="button" onClick={() => toggleAmenity(a)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                    selectedAmenities.includes(a) ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                  }`}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Description <span className="normal-case font-normal text-zinc-400">(optional)</span>
            </label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)}
              rows={3} maxLength={1000}
              placeholder="Describe the property — location highlights, condition, nearby landmarks…"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors resize-none" />
            <p className="text-xs text-zinc-400 text-right">{description.length}/1000</p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 mt-4">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 mt-6">
          <button type="button" onClick={() => setStep(1)}
            className="rounded-full border border-zinc-200 text-zinc-700 px-6 py-2.5 text-sm font-bold hover:border-zinc-400 transition-colors">
            ← Back
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting}
            className="rounded-full bg-zinc-900 text-white px-6 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? "Submitting…" : "Submit for review"}
          </button>
        </div>
      </div>

      {/* Summary card */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Summary</p>
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between"><span className="text-zinc-500">Title</span><span className="font-bold text-zinc-900 truncate max-w-[200px]">{title}</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Location</span><span className="font-bold text-zinc-900">{lga}</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Type</span><span className="font-bold text-zinc-900">{listingType.charAt(0) + listingType.slice(1).toLowerCase()}</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Annual rent</span><span className="font-bold text-zinc-900">{pricePerYear ? formatNaira(Number(pricePerYear)) : "—"}</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Total package</span><span className="font-bold text-zinc-900">{totalPackage ? formatNaira(Number(totalPackage)) : "—"}</span></div>
        </div>
      </div>
    </div>
  );
}
