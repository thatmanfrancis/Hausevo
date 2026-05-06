"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────

type Application = {
  id: string; status: string; message: string | null;
  shackScoreAtApplication: number | null; createdAt: Date;
  tenant: { id: string; fullName: string; verificationTier: number; shackScore: { score: number } | null };
};

type Property = {
  id: string; title: string; address: string; lga: string; state: string;
  listingType: string; pricePerYear: number; totalPackage: number;
  rentFrequency: string; status: string; healthScore: number;
  deedVerified: boolean; priceVerified: boolean; metadata: any;
  createdAt: Date; updatedAt: Date;
  images: { id: string; url: string; isPrimary: boolean; order: number }[];
  applications: Application[];
  tenancy: {
    id: string; status: string; startDate: Date; endDate: Date;
    tenant: { id: string; fullName: string };
    rentSchedules: { id: string; dueDate: Date; amount: number; status: string }[];
  } | null;
  _count: { waitlist: number };
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatNaira(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
}
function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}
function daysUntil(d: Date) {
  return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  PENDING:     { label: "Pending review", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  AVAILABLE:   { label: "Available",      cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
  RENTED:      { label: "Rented",         cls: "bg-blue-50 text-blue-700 border border-blue-200" },
  MAINTENANCE: { label: "Maintenance",    cls: "bg-orange-50 text-orange-700 border border-orange-200" },
  FLAGGED:     { label: "Flagged",        cls: "bg-red-50 text-red-700 border border-red-200" },
};

const APP_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: "Pending",   cls: "bg-amber-50 text-amber-700" },
  REVIEWING: { label: "Reviewing", cls: "bg-blue-50 text-blue-700" },
  ACCEPTED:  { label: "Accepted",  cls: "bg-emerald-50 text-emerald-700" },
  REJECTED:  { label: "Rejected",  cls: "bg-red-50 text-red-700" },
  WITHDRAWN: { label: "Withdrawn", cls: "bg-zinc-100 text-zinc-500" },
};

// ── Add images modal ───────────────────────────────────────────────────────

function AddImagesModal({ propertyId, onClose, onAdded }: {
  propertyId: string;
  onClose: () => void;
  onAdded: (urls: string[]) => void;
}) {
  const [urls, setUrls] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const imageUrls = urls.split("\n").map((u) => u.trim()).filter(Boolean);
    if (!imageUrls.length) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/properties/${propertyId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: imageUrls.map((url, i) => ({ url, isPrimary: i === 0, order: i })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to add images.");
        return;
      }
      onAdded(imageUrls);
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-base font-extrabold text-zinc-900">Add Images</p>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100 transition-colors text-zinc-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Image URLs (one per line)</label>
            <textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              rows={5}
              required
              placeholder={"https://example.com/image1.jpg\nhttps://example.com/image2.jpg"}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors resize-none font-mono"
            />
            <p className="text-xs text-zinc-400">The first URL will be set as the primary image.</p>
          </div>
          {error && <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={submitting}
              className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50">
              {submitting ? "Adding…" : "Add images"}
            </button>
            <button type="button" onClick={onClose} className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function PropertyDetailClient({ property }: { property: Property }) {
  const router = useRouter();
  const [images, setImages] = useState(property.images);
  const [showAddImages, setShowAddImages] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentImg, setCurrentImg] = useState(0);

  const meta = property.metadata ?? {};
  const s = STATUS_CONFIG[property.status] ?? { label: property.status, cls: "bg-zinc-100 text-zinc-600" };
  const primaryImg = images.find((i) => i.isPrimary) ?? images[0];
  const pendingApps = property.applications.filter((a) => a.status === "PENDING" || a.status === "REVIEWING");

  async function handleDelete() {
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/properties/${property.id}`, { method: "DELETE" });
      if (res.ok) router.push("/landlord/properties");
    } catch {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Breadcrumb + heading */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/landlord/properties" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors">
              Properties
            </Link>
            <span className="text-xs text-zinc-300">/</span>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 truncate max-w-[200px]">{property.title}</p>
          </div>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-extrabold text-zinc-900 leading-tight">{property.title}</h1>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${s.cls}`}>{s.label}</span>
          </div>
          <p className="text-sm text-zinc-500 mt-1">{property.address}, {property.lga}</p>
        </div>

        {/* Images */}
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          {images.length > 0 ? (
            <div>
              <div className="relative h-64 bg-zinc-100">
                <Image
                  src={images[currentImg]?.url ?? primaryImg?.url ?? ""}
                  alt={property.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 600px"
                />
                {images.length > 1 && (
                  <>
                    <button onClick={() => setCurrentImg((c) => (c - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-zinc-700 hover:bg-white transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <button onClick={() => setCurrentImg((c) => (c + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-zinc-700 hover:bg-white transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      {currentImg + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {images.map((img, i) => (
                    <button key={img.id} onClick={() => setCurrentImg(i)}
                      className={`relative h-14 w-20 shrink-0 rounded-lg overflow-hidden transition-all ${i === currentImg ? "ring-2 ring-zinc-900" : "opacity-60 hover:opacity-100"}`}>
                      <Image src={img.url} alt="" fill className="object-cover" sizes="80px" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center gap-3 text-zinc-400">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <p className="text-sm font-semibold">No images yet</p>
            </div>
          )}
          <div className="px-5 py-3 border-t border-zinc-100">
            <button type="button" onClick={() => setShowAddImages(true)}
              className="rounded-full border border-zinc-200 text-zinc-700 px-4 py-2 text-xs font-bold hover:border-zinc-400 transition-colors">
              + Add images
            </button>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Pricing */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Pricing</p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Annual rent</span>
                <span className="text-sm font-extrabold text-zinc-900">{formatNaira(property.pricePerYear)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Total package</span>
                <span className="text-sm font-bold text-zinc-700">{formatNaira(property.totalPackage)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Frequency</span>
                <span className="text-sm font-bold text-zinc-700">{property.rentFrequency.charAt(0) + property.rentFrequency.slice(1).toLowerCase()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Listing type</span>
                <span className="text-sm font-bold text-zinc-700">{property.listingType.charAt(0) + property.listingType.slice(1).toLowerCase()}</span>
              </div>
            </div>
          </div>

          {/* Property info */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Details</p>
            <div className="flex flex-col gap-2">
              {meta.propertyType && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Type</span>
                  <span className="text-sm font-bold text-zinc-700">{meta.propertyType}</span>
                </div>
              )}
              {meta.bedrooms != null && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Bedrooms</span>
                  <span className="text-sm font-bold text-zinc-700">{meta.bedrooms}</span>
                </div>
              )}
              {meta.bathrooms != null && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Bathrooms</span>
                  <span className="text-sm font-bold text-zinc-700">{meta.bathrooms}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Health score</span>
                <span className="text-sm font-bold text-zinc-700">{property.healthScore}/100</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Waitlist</span>
                <span className="text-sm font-bold text-zinc-700">{property._count.waitlist} interested</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verification badges */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Verification</p>
          <div className="flex flex-wrap gap-3">
            <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 ${property.deedVerified ? "bg-emerald-50 border border-emerald-200" : "bg-zinc-50 border border-zinc-200"}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className={property.deedVerified ? "text-emerald-600" : "text-zinc-400"}>
                {property.deedVerified ? <polyline points="20 6 9 17 4 12"/> : <circle cx="12" cy="12" r="10"/>}
              </svg>
              <span className={`text-xs font-bold ${property.deedVerified ? "text-emerald-700" : "text-zinc-500"}`}>
                Deed {property.deedVerified ? "verified" : "not verified"}
              </span>
            </div>
            <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 ${property.priceVerified ? "bg-emerald-50 border border-emerald-200" : "bg-zinc-50 border border-zinc-200"}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className={property.priceVerified ? "text-emerald-600" : "text-zinc-400"}>
                {property.priceVerified ? <polyline points="20 6 9 17 4 12"/> : <circle cx="12" cy="12" r="10"/>}
              </svg>
              <span className={`text-xs font-bold ${property.priceVerified ? "text-emerald-700" : "text-zinc-500"}`}>
                Price {property.priceVerified ? "verified" : "not verified"}
              </span>
            </div>
          </div>
          {(!property.deedVerified || !property.priceVerified) && (
            <p className="text-xs text-zinc-400 mt-3">
              Our team will verify your listing within 24–48 hours of submission.
            </p>
          )}
        </div>

        {/* Active tenancy */}
        {property.tenancy && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Active Tenancy</p>
              <Link href={`/landlord/tenancies/${property.tenancy.id}`} className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors">
                View →
              </Link>
            </div>
            <p className="text-sm font-bold text-zinc-900">{property.tenancy.tenant.fullName}</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {formatDate(property.tenancy.startDate)} – {formatDate(property.tenancy.endDate)}
              <span className="ml-2 font-semibold text-zinc-600">({daysUntil(property.tenancy.endDate)}d remaining)</span>
            </p>
            {property.tenancy.rentSchedules.length > 0 && (
              <div className="mt-3 flex flex-col gap-1.5">
                {property.tenancy.rentSchedules.map((r) => {
                  const isPending = r.status === "PENDING";
                  return (
                    <div key={r.id} className="flex items-center justify-between text-xs">
                      <span className={isPending ? "text-zinc-700 font-semibold" : "text-zinc-400"}>{formatDate(r.dueDate)}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-700">{formatNaira(r.amount)}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isPending ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                          {isPending ? "Due" : "Paid"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Applications */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Applications ({property.applications.length})
            </p>
            {pendingApps.length > 0 && (
              <Link href="/landlord/applications" className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors">
                Manage →
              </Link>
            )}
          </div>
          {property.applications.length === 0 ? (
            <p className="text-sm text-zinc-500">No applications yet. Your listing will receive applications once it&apos;s live.</p>
          ) : (
            <div className="flex flex-col divide-y divide-zinc-100">
              {property.applications.map((app) => {
                const as = APP_STATUS[app.status] ?? { label: app.status, cls: "bg-zinc-100 text-zinc-600" };
                return (
                  <div key={app.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{app.tenant.fullName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {app.tenant.verificationTier >= 1 && (
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">Verified</span>
                        )}
                        {app.shackScoreAtApplication && (
                          <span className="text-xs text-zinc-400">Score: <span className="font-bold text-zinc-600">{app.shackScoreAtApplication}</span></span>
                        )}
                        <span className="text-xs text-zinc-400">{formatDate(app.createdAt)}</span>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${as.cls}`}>{as.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Danger zone */}
        {(property.status === "PENDING" || property.status === "AVAILABLE") && (
          <div className="bg-white rounded-2xl border border-red-100 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-3">Danger Zone</p>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-zinc-900">Delete listing</p>
                <p className="text-xs text-zinc-500 mt-0.5">Permanently remove this property. Cannot be undone.</p>
              </div>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-full border border-red-200 text-red-600 px-4 py-2 text-xs font-bold hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        )}
      </div>

      {showAddImages && (
        <AddImagesModal
          propertyId={property.id}
          onClose={() => setShowAddImages(false)}
          onAdded={(urls) => {
            setImages((prev) => [
              ...prev,
              ...urls.map((url, i) => ({
                id: `new-${i}`,
                url,
                isPrimary: prev.length === 0 && i === 0,
                order: prev.length + i,
              })),
            ]);
          }}
        />
      )}
    </>
  );
}
