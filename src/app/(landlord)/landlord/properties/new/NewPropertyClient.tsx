"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ImageUpload from "@/app/components/ImageUpload";

// ── Data ───────────────────────────────────────────────────────────────────

const LAGOS_LGAS = [
  "Agege",
  "Ajeromi-Ifelodun",
  "Alimosho",
  "Amuwo-Odofin",
  "Apapa",
  "Badagry",
  "Epe",
  "Eti-Osa",
  "Ibeju-Lekki",
  "Ifako-Ijaiye",
  "Ikeja",
  "Ikorodu",
  "Kosofe",
  "Lagos Island",
  "Lagos Mainland",
  "Mushin",
  "Ojo",
  "Oshodi-Isolo",
  "Shomolu",
  "Surulere",
];

const LISTING_TYPES = [
  { value: "RENT", label: "For Rent", desc: "Monthly or annual rental" },
  { value: "SALE", label: "For Sale", desc: "Outright purchase" },
  { value: "LEASE", label: "Lease", desc: "Long-term lease agreement" },
  { value: "SHORTLET", label: "Shortlet", desc: "Short-term stays" },
];

const RENT_FREQUENCIES = [
  { value: "ANNUALLY", label: "Annually", desc: "1 year upfront" },
  { value: "BIANNUALLY", label: "Every 6 months", desc: "2 payments/year" },
  { value: "QUARTERLY", label: "Quarterly", desc: "4 payments/year" },
  { value: "MONTHLY", label: "Monthly", desc: "12 payments/year" },
];

const PROPERTY_TYPES = [
  "Self Contain",
  "Mini Flat",
  "2 Bedroom Flat",
  "3 Bedroom Flat",
  "Bungalow",
  "Duplex",
  "Semi-Detached",
  "Detached",
  "Terrace",
  "Shortlet Apartment",
  "Room & Parlour",
  "Mansion",
];

const COMMON_AMENITIES = [
  "Borehole",
  "Generator",
  "Security",
  "Parking",
  "CCTV",
  "Boys Quarters",
  "Swimming Pool",
  "Gym",
  "Garden",
  "Solar",
  "Pre-paid Meter",
  "Gated Estate",
  "DSTV",
  "Air Conditioning",
  "Balcony",
];

// ── Helpers ────────────────────────────────────────────────────────────────

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === current
              ? "w-6 bg-zinc-900"
              : i < current
                ? "w-3 bg-zinc-400"
                : "w-3 bg-zinc-200"
          }`}
        />
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
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Proxy / offline landlord
  const [isProxyListing, setIsProxyListing] = useState(false);
  const [landlordName, setLandlordName] = useState("");
  const [landlordPhone, setLandlordPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedVaultDocId, setSelectedVaultDocId] = useState("");

  function toggleAmenity(a: string) {
    setSelectedAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );
  }

  // Step validation
  const step1Valid = title.trim() && address.trim() && lga &&
    (!isProxyListing || (landlordName.trim() && landlordPhone.trim()));
  const step2Valid =
    pricePerYear &&
    Number(pricePerYear) > 0 &&
    totalPackage &&
    Number(totalPackage) > 0;

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    try {
      const endpoint = isProxyListing ? "/api/properties/proxy" : "/api/properties";
      const payload: Record<string, unknown> = {
        title,
        address,
        lga,
        listingType,
        pricePerYear: Number(pricePerYear),
        totalPackage: Number(totalPackage),
        rentFrequency,
        vaultDocId: selectedVaultDocId || undefined,
        metadata: {
          propertyType: propertyType || undefined,
          bedrooms: bedrooms ? Number(bedrooms) : undefined,
          bathrooms: bathrooms ? Number(bathrooms) : undefined,
          description: description || undefined,
          amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
          images: imageUrls.length > 0 ? imageUrls : undefined,
        },
      };

      if (isProxyListing) {
        payload.landlordName = landlordName.trim();
        payload.landlordPhone = landlordPhone.trim();
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
            <Link
              href="/landlord/properties"
              className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              Properties
            </Link>
            <span className="text-xs text-zinc-300">/</span>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              New
            </p>
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-900">
            Add New Listing
          </h1>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <StepDots total={4} current={0} />
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
            Step 1 of 3
          </p>
          <p className="text-base font-extrabold text-zinc-900 mb-5">
            Where is the property?
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="title"
                className="text-xs font-bold uppercase tracking-widest text-zinc-400"
              >
                Property Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 3 Bedroom Flat in Lekki Phase 1"
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="address"
                className="text-xs font-bold uppercase tracking-widest text-zinc-400"
              >
                Street Address
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 12 Admiralty Way, Lekki Phase 1"
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="lga"
                className="text-xs font-bold uppercase tracking-widest text-zinc-400"
              >
                LGA
              </label>
              <select
                id="lga"
                value={lga}
                onChange={(e) => setLga(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-colors"
              >
                <option value="">Select LGA…</option>
                {LAGOS_LGAS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            {/* Proxy / offline landlord toggle */}
            <div className="rounded-xl border border-zinc-200 p-4 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setIsProxyListing((v) => !v)}
                className="flex items-center justify-between w-full"
              >
                <div className="text-left">
                  <p className="text-sm font-bold text-zinc-900">
                    Listing on behalf of an offline landlord
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Scout / proxy submission — landlord has no internet access
                  </p>
                </div>
                {/* Toggle pill */}
                <div
                  className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${
                    isProxyListing ? "bg-zinc-900" : "bg-zinc-200"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      isProxyListing ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </div>
              </button>

              {isProxyListing && (
                <div className="flex flex-col gap-3 pt-1 border-t border-zinc-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Offline Landlord Details
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="landlordName"
                      className="text-xs font-bold uppercase tracking-widest text-zinc-400"
                    >
                      Landlord Full Name
                    </label>
                    <input
                      id="landlordName"
                      type="text"
                      value={landlordName}
                      onChange={(e) => setLandlordName(e.target.value)}
                      placeholder="e.g. Chief Adebayo Okafor"
                      className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="landlordPhone"
                      className="text-xs font-bold uppercase tracking-widest text-zinc-400"
                    >
                      Landlord Phone Number
                    </label>
                    <input
                      id="landlordPhone"
                      type="tel"
                      value={landlordPhone}
                      onChange={(e) => setLandlordPhone(e.target.value)}
                      placeholder="+2348012345678"
                      className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
                    />
                    <p className="text-[10px] text-zinc-400 leading-tight">
                      Admin will call this number to verify ownership before the listing goes live.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Listing Type
              </label>              <div className="grid grid-cols-2 gap-2">
                {LISTING_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setListingType(t.value)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      listingType === t.value
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 hover:border-zinc-400"
                    }`}
                  >
                    <p
                      className={`text-sm font-bold ${listingType === t.value ? "text-white" : "text-zinc-900"}`}
                    >
                      {t.label}
                    </p>
                    <p
                      className={`text-xs mt-0.5 ${listingType === t.value ? "text-zinc-300" : "text-zinc-400"}`}
                    >
                      {t.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={!step1Valid}
              className="rounded-full bg-zinc-900 text-white px-6 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
            <Link
              href="/landlord/properties"
              className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Cancel
            </Link>
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
            <Link
              href="/landlord/properties"
              className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              Properties
            </Link>
            <span className="text-xs text-zinc-300">/</span>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              New
            </p>
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-900">
            Add New Listing
          </h1>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <StepDots total={4} current={1} />
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
            Step 2 of 3
          </p>
          <p className="text-base font-extrabold text-zinc-900 mb-5">
            How much does it cost?
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="pricePerYear"
                className="text-xs font-bold uppercase tracking-widest text-zinc-400"
              >
                {listingType === "SHORTLET"
                  ? "Daily Rate (₦)"
                  : "Annual Rent (₦)"}
              </label>
              <input
                id="pricePerYear"
                type="number"
                min="0"
                value={pricePerYear}
                onChange={(e) => {
                  const val = e.target.value;
                  setPricePerYear(val);
                  if (val && !isNaN(Number(val))) {
                    setTotalPackage(String(Number(val) + 50000));
                  } else {
                    setTotalPackage("");
                  }
                }}
                placeholder="e.g. 1200000"
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
              />
              {pricePerYear && Number(pricePerYear) > 0 && (
                <p className="text-xs text-zinc-400">
                  {formatNaira(Number(pricePerYear))}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="totalPackage"
                className="text-xs font-bold uppercase tracking-widest text-zinc-400"
              >
                Total Package (₦)
              </label>
              <input
                id="totalPackage"
                type="number"
                min="0"
                value={totalPackage}
                readOnly
                placeholder="Rent + ₦50k service fee"
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500 cursor-not-allowed outline-none"
              />
              {totalPackage && Number(totalPackage) > 0 && (
                <p className="text-xs text-zinc-400">
                  {formatNaira(Number(totalPackage))}
                </p>
              )}
              <p className="text-[10px] text-zinc-400 leading-tight">
                Includes annual rent + ₦50,000 standard Hausevo service fee (covers legal and agency).
              </p>
            </div>

            {listingType === "RENT" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Rent Frequency
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {RENT_FREQUENCIES.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setRentFrequency(f.value)}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        rentFrequency === f.value
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 hover:border-zinc-400"
                      }`}
                    >
                      <p
                        className={`text-sm font-bold ${rentFrequency === f.value ? "text-white" : "text-zinc-900"}`}
                      >
                        {f.label}
                      </p>
                      <p
                        className={`text-xs mt-0.5 ${rentFrequency === f.value ? "text-zinc-300" : "text-zinc-400"}`}
                      >
                        {f.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={() => setStep(0)}
              className="rounded-full border border-zinc-200 text-zinc-700 px-6 py-2.5 text-sm font-bold hover:border-zinc-400 transition-colors"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!step2Valid}
              className="rounded-full bg-zinc-900 text-white px-6 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 3: Property details ─────────────────────────────────────────────

  if (step === 2) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/landlord/properties"
              className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              Properties
            </Link>
            <span className="text-xs text-zinc-300">/</span>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              New
            </p>
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-900">
            Add New Listing
          </h1>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <StepDots total={4} current={2} />
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
            Step 3 of 3
          </p>
          <p className="text-base font-extrabold text-zinc-900 mb-5">
            Tell us about the property
          </p>

          <div className="flex flex-col gap-5">
            {/* Property type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Property Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PROPERTY_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setPropertyType(propertyType === t ? "" : t)}
                    className={`rounded-xl border py-2.5 px-3 text-sm font-bold text-left transition-colors ${
                      propertyType === t
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Beds & baths */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Bedrooms
                </label>
                <div className="flex gap-2">
                  {["1", "2", "3", "4", "5+"].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setBedrooms(bedrooms === n ? "" : n)}
                      className={`flex-1 rounded-xl border py-2.5 text-sm font-bold transition-colors ${
                        bedrooms === n
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Bathrooms
                </label>
                <div className="flex gap-2">
                  {["1", "2", "3", "4+"].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setBathrooms(bathrooms === n ? "" : n)}
                      className={`flex-1 rounded-xl border py-2.5 text-sm font-bold transition-colors ${
                        bathrooms === n
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Amenities
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_AMENITIES.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                      selectedAmenities.includes(a)
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="description"
                className="text-xs font-bold uppercase tracking-widest text-zinc-400"
              >
                Description{" "}
                <span className="normal-case font-normal text-zinc-400">
                  (optional)
                </span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Describe the property — location highlights, condition, nearby landmarks…"
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors resize-none"
              />
              <p className="text-xs text-zinc-400 text-right">
                {description.length}/1000
              </p>
            </div>

            {/* Photos */}
            <ImageUpload onUpload={setImageUrls} maxFiles={10} />
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 mt-4">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 mt-0.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-full border border-zinc-200 text-zinc-700 px-6 py-2.5 text-sm font-bold hover:border-zinc-400 transition-colors"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded-full bg-zinc-900 text-white px-6 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors"
            >
              Continue →
            </button>
          </div>
        </div>

        {/* Summary card */}
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
            Summary
          </p>
          <div className="flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Title</span>
              <span className="font-bold text-zinc-900 truncate max-w-[200px]">
                {title}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Location</span>
              <span className="font-bold text-zinc-900">{lga}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Type</span>
              <span className="font-bold text-zinc-900">
                {listingType.charAt(0) + listingType.slice(1).toLowerCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Annual rent</span>
              <span className="font-bold text-zinc-900">
                {pricePerYear ? formatNaira(Number(pricePerYear)) : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Total package</span>
              <span className="font-bold text-zinc-900">
                {totalPackage ? formatNaira(Number(totalPackage)) : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 4: Verification ────────────────────────────────────────────────
  if (step === 3) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/landlord/properties"
              className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              Properties
            </Link>
            <span className="text-xs text-zinc-300">/</span>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              New
            </p>
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-900">
            Final Step: Trust & Verification
          </h1>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <StepDots total={4} current={3} />
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
            Step 4 of 4
          </p>
          <p className="text-base font-extrabold text-zinc-900 mb-5">
            Prove ownership to get the Verified Badge
          </p>

          <div className="flex flex-col gap-6">
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <p className="text-sm font-extrabold text-emerald-900">
                  Why verify now?
                </p>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Verified properties get <strong>10x more inquiries</strong> and
                are featured at the top of search results. Tenants in Nigeria
                prioritize listings with a verified C of O or purchase receipt.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Choose from your Hausevo Vault
              </label>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedVaultDocId("new")}
                  className={`flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                    selectedVaultDocId === "new"
                      ? "border-zinc-900 bg-zinc-50"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div className="h-10 w-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">
                      Upload New Certificate
                    </p>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest">
                      C of O, Deed, or Receipt
                    </p>
                  </div>
                </button>

                <div className="relative">
                  <div
                    className="absolute inset-0 flex items-center"
                    aria-hidden="true"
                  >
                    <div className="w-full border-t border-zinc-100"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                    <span className="bg-white px-2 text-zinc-300 italic">
                      or select existing
                    </span>
                  </div>
                </div>

                <div className="text-center py-4 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                  <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                    No documents in vault yet
                  </p>
                  <p className="text-[10px] text-zinc-300 mt-1">
                    Upload a doc once and use it for all future listings
                  </p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 mt-6">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 mt-0.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 mt-8">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-full border border-zinc-200 text-zinc-700 px-6 py-2.5 text-sm font-bold hover:border-zinc-400 transition-colors"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 rounded-full bg-zinc-900 text-white px-6 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting…" : "Publish Listing"}
            </button>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full mt-4 text-xs font-bold text-zinc-400 hover:text-zinc-900 transition-colors text-center"
          >
            Skip verification for now (Not Recommended)
          </button>
        </div>
      </div>
    );
  }

  return null;
}
