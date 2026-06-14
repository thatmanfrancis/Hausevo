"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { updatePropertyDetails, adminBoostProperty, adminRemoveBoost } from "../../actions";

// ── Constants ──────────────────────────────────────────────────────────────

const LAGOS_LGAS = [
  "Agege","Ajeromi-Ifelodun","Alimosho","Amuwo-Odofin","Apapa","Badagry","Epe",
  "Eti-Osa","Ibeju-Lekki","Ifako-Ijaiye","Ikeja","Ikorodu","Kosofe","Lagos Island",
  "Lagos Mainland","Mushin","Ojo","Oshodi-Isolo","Somolu","Surulere",
];

const LISTING_TYPES = ["RENT","SALE","LEASE","SHORTLET"];
const STATUSES      = ["AVAILABLE","PENDING","RENTED","MAINTENANCE","FLAGGED"];

const PROPERTY_TYPES = [
  "Self Contain","Room & Parlour","Mini Flat","Studio Apartment",
  "1 Bedroom Flat","2 Bedroom Flat","3 Bedroom Flat","4 Bedroom Flat","5+ Bedroom Flat","Penthouse",
  "Bungalow","Semi-Detached Bungalow","Detached Bungalow",
  "Duplex","Semi-Detached Duplex","Detached Duplex",
  "Terrace","Terrace Duplex","Mansion","Office Space","Shop","Warehouse","Land",
];

const COMMON_AMENITIES = [
  "Borehole","Generator","Security","Parking","CCTV","Boys Quarters","Swimming Pool",
  "Gym","Garden","Solar","Pre-paid Meter","Gated Estate","DSTV","Air Conditioning","Balcony",
];

// ── Helpers ────────────────────────────────────────────────────────────────

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</label>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full"
    >
      <span className="text-sm font-semibold text-zinc-900">{label}</span>
      <div className={`relative h-6 w-11 rounded-full transition-colors shrink-0 ${checked ? "bg-zinc-900" : "bg-zinc-200"}`}>
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </div>
    </button>
  );
}

const statusColors: Record<string, string> = {
  AVAILABLE:   "bg-emerald-100 text-emerald-700",
  PENDING:     "bg-amber-100 text-amber-700",
  RENTED:      "bg-blue-100 text-blue-700",
  MAINTENANCE: "bg-purple-100 text-purple-700",
  FLAGGED:     "bg-red-100 text-red-700",
};

// ── Component ──────────────────────────────────────────────────────────────

export default function AdminPropertyDetailsClient({ property }: { property: any }) {
  const meta = (property.metadata as any) ?? {};

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving,  setIsSaving]  = useState(false);
  const [saveError, setSaveError] = useState("");

  // Editable fields
  const [title,         setTitle]         = useState(property.title);
  const [address,       setAddress]       = useState(property.address);
  const [lga,           setLga]           = useState(property.lga);
  const [listingType,   setListingType]   = useState(property.listingType);
  const [status,        setStatus]        = useState(property.status);
  const [pricePerYear,  setPricePerYear]  = useState(String(property.pricePerYear));
  const [totalPackage,  setTotalPackage]  = useState(String(property.totalPackage));
  const [healthScore,   setHealthScore]   = useState(String(property.healthScore));
  const [deedVerified,  setDeedVerified]  = useState(property.deedVerified  ?? false);
  const [priceVerified, setPriceVerified] = useState(property.priceVerified ?? false);
  const [propertyType,  setPropertyType]  = useState(meta.propertyType ?? "");
  const [bedrooms,      setBedrooms]      = useState(meta.bedrooms   != null ? String(meta.bedrooms)  : "");
  const [bathrooms,     setBathrooms]     = useState(meta.bathrooms  != null ? String(meta.bathrooms) : "");
  const [amenities,     setAmenities]     = useState<string[]>(meta.amenities ?? []);
  const [description,   setDescription]  = useState(meta.description ?? "");

  function toggleAmenity(a: string) {
    setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true); setSaveError("");
    try {
      const res = await updatePropertyDetails(property.id, {
        title, address, lga, listingType, status,
        pricePerYear, totalPackage, healthScore,
        deedVerified, priceVerified,
        propertyType: propertyType || null,
        bedrooms:  bedrooms  ? parseInt(bedrooms)  : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        amenities: amenities.length > 0 ? amenities : null,
        description: description.trim() || null,
      });
      if (res.success) setIsEditing(false);
      else setSaveError(res.message ?? "Failed to save.");
    } catch { setSaveError("Something went wrong."); }
    finally  { setIsSaving(false); }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/admin/dashboard" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600">Admin</Link>
          <span className="text-xs text-zinc-300">/</span>
          <Link href="/admin/properties" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600">Properties</Link>
          <span className="text-xs text-zinc-300">/</span>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 truncate max-w-[160px]">{property.title}</p>
        </div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-extrabold text-zinc-900">{property.title}</h1>
          <div className="flex items-center gap-2 shrink-0">
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)}
                className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-xs font-bold hover:bg-zinc-700 transition-colors">
                Edit Listing
              </button>
            ) : (
              <button onClick={() => { setIsEditing(false); setSaveError(""); }}
                className="rounded-full border border-zinc-200 text-zinc-600 px-5 py-2.5 text-xs font-bold hover:border-zinc-400 transition-colors">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left col ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Images */}
          {property.images?.length > 0 && !isEditing && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-3">
              <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1" style={{ scrollbarWidth: "none" }}>
                {property.images.map((img: any) => (
                  <div key={img.id} className="relative h-56 w-72 shrink-0 snap-center rounded-xl overflow-hidden bg-zinc-100 border border-zinc-100">
                    <Image src={img.url} alt="Property photo" fill className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* View mode */}
          {!isEditing && (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col gap-5">
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${statusColors[property.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                  {property.status}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-500">
                  {property.listingType}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                  Health {property.healthScore}/100
                </span>
                {meta.propertyType && (
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-500">
                    {meta.propertyType}
                  </span>
                )}
              </div>

              {/* Core details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Price per Year</p>
                  <p className="text-lg font-extrabold text-zinc-900">{formatNaira(property.pricePerYear)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Total Package</p>
                  <p className="text-lg font-extrabold text-zinc-900">{formatNaira(property.totalPackage)}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Address</p>
                  <p className="text-sm font-semibold text-zinc-900">{property.address}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{property.lga}, Lagos</p>
                </div>
                {(meta.bedrooms != null || meta.bathrooms != null) && (
                  <>
                    {meta.bedrooms != null && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Bedrooms</p>
                        <p className="text-sm font-semibold text-zinc-900">{meta.bedrooms}</p>
                      </div>
                    )}
                    {meta.bathrooms != null && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Bathrooms</p>
                        <p className="text-sm font-semibold text-zinc-900">{meta.bathrooms}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Amenities */}
              {meta.amenities?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-1.5">
                    {meta.amenities.map((a: string) => (
                      <span key={a} className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-bold text-zinc-600">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {meta.description && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Description</p>
                  <p className="text-sm text-zinc-600 leading-relaxed">{meta.description}</p>
                </div>
              )}

              {/* Verifications */}
              <div className="pt-4 border-t border-zinc-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Verifications</p>
                <div className="flex gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${property.deedVerified ? "bg-emerald-500" : "bg-zinc-300"}`} />
                    <span className="text-xs font-semibold text-zinc-700">Deed {property.deedVerified ? "Verified" : "Unverified"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${property.priceVerified ? "bg-emerald-500" : "bg-zinc-300"}`} />
                    <span className="text-xs font-semibold text-zinc-700">Price {property.priceVerified ? "Verified" : "Unverified"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit mode form */}
          {isEditing && (
            <form onSubmit={handleSave} className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col gap-5">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Edit Listing</p>

              <Field label="Title *">
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-colors" />
              </Field>

              <Field label="Street Address *">
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} required
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-colors" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="LGA *">
                  <select value={lga} onChange={e => setLga(e.target.value)} required
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-colors">
                    <option value="">Select LGA…</option>
                    {LAGOS_LGAS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </Field>
                <Field label="Listing Type">
                  <select value={listingType} onChange={e => setListingType(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-colors">
                    {LISTING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Status">
                <div className="flex gap-2 flex-wrap">
                  {STATUSES.map(s => (
                    <button key={s} type="button" onClick={() => setStatus(s)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors border ${
                        status === s ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                      }`}>{s}</button>
                  ))}
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Price Per Year (₦) *">
                  <input type="number" min="0" value={pricePerYear} onChange={e => setPricePerYear(e.target.value)} required
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-colors" />
                </Field>
                <Field label="Total Package (₦) *">
                  <input type="number" min="0" value={totalPackage} onChange={e => setTotalPackage(e.target.value)} required
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-colors" />
                </Field>
              </div>

              <Field label="Health Score (0–100)">
                <input type="number" min="0" max="100" value={healthScore} onChange={e => setHealthScore(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-colors" />
                <p className="text-[10px] text-zinc-400">Affects ranking. 100 = excellent.</p>
              </Field>

              <Field label="Property Type">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PROPERTY_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => setPropertyType(propertyType === t ? "" : t)}
                      className={`rounded-xl border py-2 px-3 text-xs font-bold text-left transition-colors ${
                        propertyType === t ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                      }`}>{t}</button>
                  ))}
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Bedrooms">
                  <div className="flex gap-1.5">
                    {["1","2","3","4","5+"].map(n => (
                      <button key={n} type="button" onClick={() => setBedrooms(bedrooms === n ? "" : n)}
                        className={`flex-1 rounded-xl border py-2 text-sm font-bold transition-colors ${
                          bedrooms === n ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                        }`}>{n}</button>
                    ))}
                  </div>
                </Field>
                <Field label="Bathrooms">
                  <div className="flex gap-1.5">
                    {["1","2","3","4+"].map(n => (
                      <button key={n} type="button" onClick={() => setBathrooms(bathrooms === n ? "" : n)}
                        className={`flex-1 rounded-xl border py-2 text-sm font-bold transition-colors ${
                          bathrooms === n ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                        }`}>{n}</button>
                    ))}
                  </div>
                </Field>
              </div>

              <Field label="Amenities">
                <div className="flex flex-wrap gap-2">
                  {COMMON_AMENITIES.map(a => (
                    <button key={a} type="button" onClick={() => toggleAmenity(a)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                        amenities.includes(a) ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                      }`}>{a}</button>
                  ))}
                </div>
              </Field>

              <Field label="Description (optional)">
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} maxLength={1000}
                  placeholder="Describe the property…"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors resize-none" />
                <p className="text-[10px] text-zinc-400 text-right">{description.length}/1000</p>
              </Field>

              <div className="pt-4 border-t border-zinc-100 flex flex-col gap-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Verifications</p>
                <Toggle checked={deedVerified}  onChange={setDeedVerified}  label="Deed Verified"  />
                <Toggle checked={priceVerified} onChange={setPriceVerified} label="Price Verified" />
              </div>

              {saveError && (
                <p className="text-xs text-red-600 font-semibold">{saveError}</p>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button type="submit" disabled={isSaving}
                  className="rounded-full bg-zinc-900 text-white px-6 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50">
                  {isSaving ? "Saving…" : "Save Changes"}
                </button>
                <button type="button" onClick={() => { setIsEditing(false); setSaveError(""); }}
                  className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Right col ── */}
        <div className="flex flex-col gap-6">

          {/* Owner */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Owner</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
                <span className="text-sm font-extrabold text-zinc-500">{property.landlord.fullName.charAt(0)}</span>
              </div>
              <div className="min-w-0">
                <Link href={`/admin/users/${property.landlord.id}`}
                  className="text-sm font-bold text-zinc-900 hover:underline truncate block">
                  {property.landlord.fullName}
                </Link>
                {property.landlord.isVerified
                  ? <span className="text-[10px] font-bold text-emerald-600">✓ Verified</span>
                  : <span className="text-[10px] font-bold text-amber-600">Unverified</span>
                }
              </div>
            </div>
            <div className="flex flex-col gap-3 pt-3 border-t border-zinc-100">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Email</p>
                <p className="text-xs font-semibold text-zinc-700 truncate">{property.landlord.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">Phone</p>
                <p className="text-xs font-semibold text-zinc-700">{property.landlord.phoneNumber || "—"}</p>
              </div>
            </div>

            {property.landlord.bankAccounts?.length > 0 && (
              <div className="flex flex-col gap-2 pt-3 mt-3 border-t border-zinc-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Bank Accounts</p>
                {property.landlord.bankAccounts.map((acc: any) => (
                  <div key={acc.id} className="bg-zinc-50 rounded-xl p-3 border border-zinc-200">
                    <p className="text-[10px] font-bold text-zinc-800">{acc.bankName}</p>
                    <p className="text-sm font-semibold tracking-widest text-zinc-600 my-0.5">{acc.accountNumber}</p>
                    <p className="text-[10px] font-bold uppercase text-zinc-400">{acc.accountName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Property quick stats */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Property Info</p>
            <div className="flex flex-col gap-3">
              {[
                { label: "Listing Type",  value: property.listingType },
                { label: "Status",        value: property.status },
                { label: "Health Score",  value: `${property.healthScore} / 100` },
                { label: "LGA",           value: property.lga },
                { label: "Deed Verified", value: property.deedVerified  ? "Yes" : "No" },
                { label: "Price Verified",value: property.priceVerified ? "Yes" : "No" },
                { label: "Boosted",       value: property.isBoosted ? "Yes" : "No" },
                { label: "Created",       value: new Date(property.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) },
              ].map(f => (
                <div key={f.label} className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{f.label}</span>
                  <span className="text-xs font-bold text-zinc-900 text-right">{f.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Boost management */}
          <BoostCard property={property} />

          {/* Vault documents */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Vault Documents</p>
            {property.vaultItems?.length > 0 ? (
              <div className="flex flex-col gap-2">
                {property.vaultItems.map((item: any) => (
                  <a key={item.id} href={item.fileUrl} target="_blank" rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-white hover:border-zinc-300 transition-colors">
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-zinc-700 truncate">{item.title}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{item.category}</p>
                    </div>
                    {item.isVerified
                      ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-500 shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber-500 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    }
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 text-center py-6 bg-zinc-50 rounded-xl border border-zinc-100">No documents uploaded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Boost Card ─────────────────────────────────────────────────────────────

const BOOST_LGAS = [
  "Agege","Ajeromi-Ifelodun","Alimosho","Amuwo-Odofin","Apapa","Badagry","Epe",
  "Eti-Osa","Ibeju-Lekki","Ifako-Ijaiye","Ikeja","Ikorodu","Kosofe","Lagos Island",
  "Lagos Mainland","Mushin","Ojo","Oshodi-Isolo","Somolu","Surulere",
];

const DURATIONS = [
  { days: 7,  label: "7 days",  desc: "1 week" },
  { days: 14, label: "14 days", desc: "2 weeks" },
  { days: 30, label: "30 days", desc: "1 month" },
  { days: 60, label: "60 days", desc: "2 months" },
  { days: 90, label: "90 days", desc: "3 months" },
];

function BoostCard({ property }: { property: any }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [duration, setDuration]   = useState(30);
  const [boostLGA, setBoostLGA]   = useState(property.boostLGA ?? "");

  const isActive = property.isBoosted && property.boostExpiresAt
    ? new Date(property.boostExpiresAt) > new Date()
    : false;

  const daysRemaining = isActive
    ? Math.ceil((new Date(property.boostExpiresAt).getTime() - Date.now()) / 86400000)
    : 0;

  async function handleBoost() {
    setSaving(true); setError("");
    const res = await adminBoostProperty(property.id, { durationDays: duration, boostLGA: boostLGA || undefined });
    setSaving(false);
    if (res.success) setModalOpen(false);
    else setError(res.message ?? "Failed");
  }

  async function handleRemove() {
    setSaving(true); setError("");
    const res = await adminRemoveBoost(property.id);
    setSaving(false);
    if (!res.success) setError(res.message ?? "Failed");
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-zinc-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Boost</p>
          {isActive && (
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              Featured
            </span>
          )}
        </div>

        {isActive ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
              <p className="text-xs font-bold text-amber-900">Active boost</p>
              <p className="text-xs text-amber-700 mt-0.5">
                {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining · expires{" "}
                {new Date(property.boostExpiresAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
              </p>
              {property.boostLGA && (
                <p className="text-xs text-amber-600 mt-0.5">Targeting: <span className="font-bold">{property.boostLGA}</span></p>
              )}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setModalOpen(true)}
                className="flex-1 rounded-full border border-zinc-200 text-zinc-700 px-4 py-2 text-xs font-bold hover:border-zinc-400 transition-colors">
                Extend
              </button>
              <button type="button" onClick={handleRemove} disabled={saving}
                className="flex-1 rounded-full border border-red-200 text-red-500 px-4 py-2 text-xs font-bold hover:bg-red-50 transition-colors disabled:opacity-50">
                {saving ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-zinc-500 leading-relaxed">
              Boosted listings appear at the top of search results and are marked as "Featured". Useful when a landlord has paid for promotion.
            </p>
            <button type="button" onClick={() => setModalOpen(true)}
              className="rounded-full bg-amber-500 text-white px-4 py-2.5 text-xs font-bold hover:bg-amber-600 transition-colors flex items-center justify-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              Boost this listing
            </button>
          </div>
        )}

        {error && <p className="text-xs text-red-600 font-semibold mt-2">{error}</p>}
      </div>

      {/* Boost modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-zinc-200 w-full max-w-sm max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-100 shrink-0">
              <p className="text-sm font-extrabold text-zinc-900">
                {isActive ? "Extend Boost" : "Boost Listing"}
              </p>
              <button type="button" onClick={() => setModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100 transition-colors text-zinc-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 overflow-y-auto">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {DURATIONS.map(d => (
                    <button key={d.days} type="button" onClick={() => setDuration(d.days)}
                      className={`rounded-xl border p-2.5 text-center transition-colors ${
                        duration === d.days ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                      }`}>
                      <p className={`text-sm font-bold ${duration === d.days ? "text-white" : "text-zinc-900"}`}>{d.label}</p>
                      <p className={`text-[10px] mt-0.5 ${duration === d.days ? "text-zinc-400" : "text-zinc-400"}`}>{d.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Target LGA <span className="normal-case font-normal text-zinc-400">(optional)</span>
                </label>
                <select value={boostLGA} onChange={e => setBoostLGA(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-colors">
                  <option value="">All Lagos (no LGA filter)</option>
                  {BOOST_LGAS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <p className="text-[10px] text-zinc-400 leading-tight">
                  Restricts boosted visibility to tenants searching in a specific LGA. Leave blank to boost sitewide.
                </p>
              </div>

              <div className="rounded-xl bg-zinc-50 border border-zinc-200 px-4 py-3 text-xs text-zinc-600 leading-relaxed">
                <p className="font-bold text-zinc-900 mb-1">What boosting does</p>
                <ul className="flex flex-col gap-1 text-zinc-500">
                  <li>· Pins listing to the top of search results</li>
                  <li>· Adds a "Featured" amber badge on the card</li>
                  <li>· Expires automatically after the chosen duration</li>
                </ul>
              </div>

              {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

              <div className="flex items-center gap-3 pt-1">
                <button type="button" onClick={handleBoost} disabled={saving}
                  className="flex-1 rounded-full bg-amber-500 text-white py-2.5 text-sm font-bold hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                  {saving ? "Applying…" : isActive ? "Extend boost" : "Apply boost"}
                </button>
                <button type="button" onClick={() => setModalOpen(false)}
                  className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
