"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { adminCreateProperty } from "../../actions";

// ── Constants ──────────────────────────────────────────────────────────────

const LAGOS_LGAS = [
  "Agege","Ajeromi-Ifelodun","Alimosho","Amuwo-Odofin","Apapa","Badagry","Epe",
  "Eti-Osa","Ibeju-Lekki","Ifako-Ijaiye","Ikeja","Ikorodu","Kosofe","Lagos Island",
  "Lagos Mainland","Mushin","Ojo","Oshodi-Isolo","Somolu","Surulere",
];

const LISTING_TYPES = [
  { value: "RENT",     label: "For Rent",  desc: "Monthly or annual rental" },
  { value: "SALE",     label: "For Sale",  desc: "Outright purchase" },
  { value: "LEASE",    label: "Lease",     desc: "Long-term lease agreement" },
  { value: "SHORTLET", label: "Shortlet",  desc: "Short-term stays" },
];

const PROPERTY_TYPES = [
  "Self Contain","Room & Parlour","Mini Flat","Studio Apartment","1 Bedroom Flat",
  "2 Bedroom Flat","3 Bedroom Flat","4 Bedroom Flat","5+ Bedroom Flat","Penthouse",
  "Bungalow","Semi-Detached Bungalow","Detached Bungalow","Duplex","Semi-Detached Duplex",
  "Detached Duplex","Terrace","Terrace Duplex","Mansion","Office Space","Shop","Warehouse","Land",
];

const COMMON_AMENITIES = [
  "Borehole","Generator","Security","Parking","CCTV","Boys Quarters","Swimming Pool",
  "Gym","Garden","Solar","Pre-paid Meter","Gated Estate","DSTV","Air Conditioning","Balcony",
];

const STATUSES = ["AVAILABLE","PENDING","RENTED","FLAGGED"];

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">{label}</label>
      {children}
    </div>
  );
}

// ── Image upload ───────────────────────────────────────────────────────────

function ImageUploadGrid({
  images,
  onAdd,
  onRemove,
  uploading,
  error,
}: {
  images: string[];
  onAdd: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (i: number) => void;
  uploading: boolean;
  error: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Property Photos</label>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {images.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200 bg-zinc-50 group">
            <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" />
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-white/90 text-zinc-900 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-zinc-200"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        ))}
        {images.length < 10 && (
          <label className={`relative aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
            uploading ? "border-zinc-200 bg-zinc-50" : "border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50"
          }`}>
            <input type="file" accept="image/*" multiple onChange={onAdd} disabled={uploading} className="hidden" />
            {uploading ? (
              <div className="flex flex-col items-center gap-1.5">
                <div className="h-5 w-5 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
                <p className="text-[10px] font-bold text-zinc-400">Uploading…</p>
              </div>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 mb-1">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                <p className="text-[10px] font-bold text-zinc-400">Add Photo</p>
              </>
            )}
          </label>
        )}
      </div>
      {error && <p className="text-xs font-bold text-red-500">{error}</p>}
      <p className="text-[10px] text-zinc-400">Max 10 photos · JPG or PNG</p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function AdminCreatePropertyPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Mode
  const [mode, setMode] = useState<"standalone" | "user">("standalone");
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState<{ id: string; fullName: string; email: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState<{ id: string; fullName: string; email: string } | null>(null);
  const [searchingUser, setSearchingUser] = useState(false);

  // Step 1 — location & type
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [lga, setLga] = useState("");
  const [listingType, setListingType] = useState("RENT");
  const [status, setStatus] = useState("AVAILABLE");

  // Step 2 — pricing
  const [pricePerYear, setPricePerYear] = useState("");
  const [totalPackage, setTotalPackage] = useState("");

  // Step 3 — details + images
  const [propertyType, setPropertyType] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Debounced landlord search
  useEffect(() => {
    if (mode !== "user" || userSearch.length < 2) { setUserResults([]); return; }
    const t = setTimeout(async () => {
      setSearchingUser(true);
      try {
        const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(userSearch)}`);
        if (res.ok) setUserResults(await res.json());
      } catch { /* silent */ } finally { setSearchingUser(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [userSearch, mode]);

  function toggleAmenity(a: string) {
    setSelectedAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  }

  async function handleImageAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (imageUrls.length + files.length > 10) { setUploadError("Max 10 photos."); return; }
    setUploading(true); setUploadError("");
    try {
      const sigRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "shack/listings" }),
      });
      if (!sigRes.ok) throw new Error("Failed to get upload authorization");
      const { signature, timestamp, apiKey, cloudName, folder } = await sigRes.json();
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        form.append("signature", signature);
        form.append("timestamp", timestamp);
        form.append("api_key", apiKey);
        form.append("folder", folder);
        const up = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: form });
        if (!up.ok) throw new Error("Upload failed");
        const data = await up.json();
        newUrls.push(data.secure_url);
      }
      setImageUrls(prev => [...prev, ...newUrls]);
    } catch (err: any) {
      setUploadError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit() {
    setSaving(true); setError("");
    const landlordId = mode === "user" ? (selectedUser?.id ?? "") : "__admin__";
    if (mode === "user" && !selectedUser) { setError("Please select a landlord."); setSaving(false); return; }
    try {
      const res = await adminCreateProperty({
        title: title.trim(),
        address: address.trim(),
        lga,
        state: "Lagos",
        listingType,
        pricePerYear: parseFloat(pricePerYear),
        totalPackage: parseFloat(totalPackage || pricePerYear),
        landlordId,
        bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
        bathrooms: bathrooms ? parseInt(bathrooms) : undefined,
        propertyType: propertyType || undefined,
        status,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
        description: description.trim() || undefined,
      } as any);
      if (res.success) router.push("/admin/properties");
      else setError(res.message ?? "Failed to create property.");
    } catch { setError("Something went wrong."); }
    finally { setSaving(false); }
  }

  const step1Valid = title.trim() && address.trim() && lga;
  const step2Valid = pricePerYear && Number(pricePerYear) > 0;

  const breadcrumb = (
    <div className="flex items-center gap-2 mb-1">
      <Link href="/admin/dashboard" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600">Admin</Link>
      <span className="text-xs text-zinc-300">/</span>
      <Link href="/admin/properties" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600">Properties</Link>
      <span className="text-xs text-zinc-300">/</span>
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">New Listing</p>
    </div>
  );

  // ── STEP 0 — Owner & Location ────────────────────────────────────────────
  if (step === 0) return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>{breadcrumb}<h1 className="text-2xl font-extrabold text-zinc-900">Create Listing</h1></div>
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <StepDots total={4} current={0} />
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Step 1 of 4</p>
        <p className="text-base font-extrabold text-zinc-900 mb-5">Who owns this listing?</p>

        <div className="flex flex-col gap-5">
          {/* Mode toggle */}
          <div className="flex gap-2">
            {[
              { value: "standalone", label: "Admin-owned" },
              { value: "user",       label: "Tie to a Landlord" },
            ].map((m) => (
              <button key={m.value} type="button"
                onClick={() => { setMode(m.value as any); setSelectedUser(null); setUserSearch(""); }}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-colors border ${
                  mode === m.value ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                }`}
              >{m.label}</button>
            ))}
          </div>

          {mode === "user" && (
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1.5">Search User / Landlord</p>
              {selectedUser ? (
                <div className="flex items-center justify-between bg-zinc-50 rounded-xl border border-zinc-200 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{selectedUser.fullName}</p>
                    <p className="text-xs text-zinc-500">{selectedUser.email}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedUser(null)} className="text-xs font-bold text-zinc-400 hover:text-zinc-700">Change</button>
                </div>
              ) : (
                <>
                  <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                    placeholder="Search by name or email…"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors" />
                  {(userResults.length > 0 || searchingUser) && (
                    <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white rounded-xl border border-zinc-200 overflow-hidden">
                      {searchingUser
                        ? <p className="px-4 py-3 text-xs text-zinc-400">Searching…</p>
                        : userResults.map(u => (
                          <button key={u.id} type="button"
                            onClick={() => { setSelectedUser(u); setUserSearch(""); setUserResults([]); }}
                            className="w-full text-left px-4 py-3 hover:bg-zinc-50 border-b border-zinc-50 last:border-0">
                            <p className="text-sm font-bold text-zinc-900">{u.fullName}</p>
                            <p className="text-xs text-zinc-400">{u.email}</p>
                          </button>
                        ))
                      }
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <Field label="Property Title *">
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. 3 Bedroom Flat in Lekki Phase 1"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors" />
          </Field>

          <Field label="Street Address *">
            <input type="text" value={address} onChange={e => setAddress(e.target.value)}
              placeholder="e.g. 12 Admiralty Way, Lekki Phase 1"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors" />
          </Field>

          <Field label="LGA *">
            <select value={lga} onChange={e => setLga(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-colors">
              <option value="">Select LGA…</option>
              {LAGOS_LGAS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </Field>

          <Field label="Listing Type">
            <div className="grid grid-cols-2 gap-2">
              {LISTING_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => setListingType(t.value)}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    listingType === t.value ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 hover:border-zinc-400"
                  }`}>
                  <p className={`text-sm font-bold ${listingType === t.value ? "text-white" : "text-zinc-900"}`}>{t.label}</p>
                  <p className={`text-xs mt-0.5 ${listingType === t.value ? "text-zinc-300" : "text-zinc-400"}`}>{t.desc}</p>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Initial Status">
            <div className="flex gap-2 flex-wrap">
              {STATUSES.map(s => (
                <button key={s} type="button" onClick={() => setStatus(s)}
                  className={`rounded-full px-4 py-2 text-xs font-bold transition-colors border ${
                    status === s ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                  }`}>{s}</button>
              ))}
            </div>
          </Field>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button type="button" onClick={() => setStep(1)} disabled={!step1Valid}
            className="rounded-full bg-zinc-900 text-white px-6 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Continue →
          </button>
          <Link href="/admin/properties" className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">Cancel</Link>
        </div>
      </div>
    </div>
  );

  // ── STEP 1 — Pricing ─────────────────────────────────────────────────────
  if (step === 1) return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>{breadcrumb}<h1 className="text-2xl font-extrabold text-zinc-900">Create Listing</h1></div>
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <StepDots total={4} current={1} />
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Step 2 of 4</p>
        <p className="text-base font-extrabold text-zinc-900 mb-5">How much does it cost?</p>
        <div className="flex flex-col gap-4">
          <Field label={listingType === "SHORTLET" ? "Daily Rate (₦) *" : "Annual Rent / Price (₦) *"}>
            <input type="number" min="0" value={pricePerYear}
              onChange={e => {
                setPricePerYear(e.target.value);
                if (e.target.value && !isNaN(Number(e.target.value)))
                  setTotalPackage(String(Number(e.target.value) + 50000));
                else setTotalPackage("");
              }}
              placeholder="e.g. 1200000"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors" />
            {pricePerYear && Number(pricePerYear) > 0 && (
              <p className="text-xs text-zinc-400">{formatNaira(Number(pricePerYear))}</p>
            )}
          </Field>
          <Field label="Total Package (₦)">
            <input type="number" min="0" value={totalPackage} onChange={e => setTotalPackage(e.target.value)}
              placeholder="Defaults to price + ₦50k service fee"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors" />
            {totalPackage && Number(totalPackage) > 0 && (
              <p className="text-xs text-zinc-400">{formatNaira(Number(totalPackage))}</p>
            )}
            <p className="text-[10px] text-zinc-400 leading-tight">Includes rent + ₦50,000 standard Hausevo service fee</p>
          </Field>
        </div>
        <div className="flex items-center gap-3 mt-6">
          <button type="button" onClick={() => setStep(0)}
            className="rounded-full border border-zinc-200 text-zinc-700 px-6 py-2.5 text-sm font-bold hover:border-zinc-400 transition-colors">← Back</button>
          <button type="button" onClick={() => setStep(2)} disabled={!step2Valid}
            className="rounded-full bg-zinc-900 text-white px-6 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Continue →</button>
        </div>
      </div>
    </div>
  );

  // ── STEP 2 — Details + Photos ────────────────────────────────────────────
  if (step === 2) return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>{breadcrumb}<h1 className="text-2xl font-extrabold text-zinc-900">Create Listing</h1></div>
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <StepDots total={4} current={2} />
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Step 3 of 4</p>
        <p className="text-base font-extrabold text-zinc-900 mb-5">Tell us about the property</p>
        <div className="flex flex-col gap-5">
          <Field label="Property Type">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PROPERTY_TYPES.map(t => (
                <button key={t} type="button" onClick={() => setPropertyType(propertyType === t ? "" : t)}
                  className={`rounded-xl border py-2.5 px-3 text-sm font-bold text-left transition-colors ${
                    propertyType === t ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                  }`}>{t}</button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Bedrooms">
              <div className="flex gap-1.5">
                {["1","2","3","4","5+"].map(n => (
                  <button key={n} type="button" onClick={() => setBedrooms(bedrooms === n ? "" : n)}
                    className={`flex-1 rounded-xl border py-2.5 text-sm font-bold transition-colors ${
                      bedrooms === n ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                    }`}>{n}</button>
                ))}
              </div>
            </Field>
            <Field label="Bathrooms">
              <div className="flex gap-1.5">
                {["1","2","3","4+"].map(n => (
                  <button key={n} type="button" onClick={() => setBathrooms(bathrooms === n ? "" : n)}
                    className={`flex-1 rounded-xl border py-2.5 text-sm font-bold transition-colors ${
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
                    selectedAmenities.includes(a) ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                  }`}>{a}</button>
              ))}
            </div>
          </Field>

          <Field label="Description (optional)">
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} maxLength={1000}
              placeholder="Describe the property — location highlights, condition, nearby landmarks…"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors resize-none" />
            <p className="text-xs text-zinc-400 text-right">{description.length}/1000</p>
          </Field>

          <ImageUploadGrid
            images={imageUrls}
            onAdd={handleImageAdd}
            onRemove={i => setImageUrls(prev => prev.filter((_, idx) => idx !== i))}
            uploading={uploading}
            error={uploadError}
          />
        </div>
        <div className="flex items-center gap-3 mt-6">
          <button type="button" onClick={() => setStep(1)}
            className="rounded-full border border-zinc-200 text-zinc-700 px-6 py-2.5 text-sm font-bold hover:border-zinc-400 transition-colors">← Back</button>
          <button type="button" onClick={() => setStep(3)}
            className="rounded-full bg-zinc-900 text-white px-6 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors">Continue →</button>
        </div>
      </div>

      {/* Summary card */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">So far</p>
        <div className="flex flex-col gap-1.5 text-sm">
          {[
            { label: "Title",    value: title },
            { label: "Location", value: lga },
            { label: "Type",     value: listingType.charAt(0) + listingType.slice(1).toLowerCase() },
            { label: "Price",    value: pricePerYear ? formatNaira(Number(pricePerYear)) : "—" },
          ].map(r => (
            <div key={r.label} className="flex justify-between">
              <span className="text-zinc-500">{r.label}</span>
              <span className="font-bold text-zinc-900 truncate max-w-[200px]">{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── STEP 3 — Review & Submit ─────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>{breadcrumb}<h1 className="text-2xl font-extrabold text-zinc-900">Create Listing</h1></div>
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <StepDots total={4} current={3} />
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Step 4 of 4</p>
        <p className="text-base font-extrabold text-zinc-900 mb-5">Review &amp; publish</p>

        <div className="flex flex-col gap-3">
          {[
            { label: "Title",          value: title },
            { label: "Address",        value: `${address}, ${lga}` },
            { label: "Listing Type",   value: listingType },
            { label: "Status",         value: status },
            { label: "Price",          value: formatNaira(Number(pricePerYear)) },
            { label: "Total Package",  value: formatNaira(Number(totalPackage || pricePerYear)) },
            { label: "Property Type",  value: propertyType || "Not specified" },
            { label: "Bedrooms",       value: bedrooms || "Not specified" },
            { label: "Bathrooms",      value: bathrooms || "Not specified" },
            { label: "Amenities",      value: selectedAmenities.length > 0 ? selectedAmenities.join(", ") : "None" },
            { label: "Photos",         value: `${imageUrls.length} uploaded` },
            { label: "Owner",          value: mode === "standalone" ? "Admin (standalone)" : (selectedUser?.fullName ?? "—") },
          ].map(r => (
            <div key={r.label} className="flex items-start justify-between gap-4 text-sm border-b border-zinc-50 pb-2.5 last:border-0">
              <span className="text-zinc-400 font-semibold shrink-0">{r.label}</span>
              <span className="font-bold text-zinc-900 text-right">{r.value}</span>
            </div>
          ))}
        </div>

        {imageUrls.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-2">
            {imageUrls.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200">
                <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="flex items-center gap-3 mt-6">
          <button type="button" onClick={() => setStep(2)}
            className="rounded-full border border-zinc-200 text-zinc-700 px-6 py-2.5 text-sm font-bold hover:border-zinc-400 transition-colors">← Back</button>
          <button type="button" onClick={handleSubmit} disabled={saving}
            className="flex-1 rounded-full bg-zinc-900 text-white px-6 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? "Creating…" : "Publish Listing →"}
          </button>
        </div>
      </div>
    </div>
  );
}
