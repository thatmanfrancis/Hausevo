"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────

type PropertyDetail = {
  id: string;
  title: string;
  address: string;
  lga: string;
  state: string;
  listingType: string;
  pricePerYear: number;
  totalPackage: number;
  rentFrequency: string | null;
  metadata: any;
  isBoosted: boolean;
  deedVerified: boolean;
  priceVerified: boolean;
  healthScore: number;
  images: { id: string; url: string; isPrimary: boolean; order: number }[];
  landlord: {
    id: string;
    fullName: string;
    verificationTier: number;
    shackScore?: { score: number } | null;
  };
  reviews: {
    rating: number;
    comment: string | null;
    createdAt: string;
    reviewer: { id: string; fullName: string };
  }[];
  _count: { savedBy: number; waitlist: number };
  status: string;
  createdAt: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPrice(property: PropertyDetail) {
  const meta = property.metadata ?? {};

  if (property.listingType === "SHORTLET") {
    const daily = meta.shortlet?.dailyRate;
    const weekly = meta.shortlet?.weeklyRate;
    if (daily) {
      return {
        primary: `${formatNaira(daily)}/day`,
        secondary: weekly ? `${formatNaira(weekly)}/week` : null,
      };
    }
    return { primary: "Price on request", secondary: null };
  }

  if (property.listingType === "SALE") {
    const salePrice = meta.salePrice ?? property.pricePerYear;
    if (!salePrice) return { primary: "Price on request", secondary: null };
    return { primary: formatNaira(salePrice), secondary: null };
  }

  const annual = property.pricePerYear;
  if (!annual) return { primary: "Price on request", secondary: null };

  const freq = meta.rentFrequency ?? "ANNUALLY";

  if (freq === "MONTHLY") {
    return {
      primary: `${formatNaira(annual)}/mo`,
      secondary: `${formatNaira(annual * 12)}/yr`,
    };
  }
  if (freq === "QUARTERLY") {
    return {
      primary: `${formatNaira(annual / 4)}/qtr`,
      secondary: `${formatNaira(annual)}/yr`,
    };
  }
  if (freq === "BIANNUALLY") {
    return {
      primary: `${formatNaira(annual / 2)}/6mo`,
      secondary: `${formatNaira(annual)}/yr`,
    };
  }

  return {
    primary: `${formatNaira(annual)}/yr`,
    secondary: `≈ ${formatNaira(Math.round(annual / 12))}/mo`,
  };
}

function listingTypeBadge(type: string) {
  const map: Record<string, { label: string; className: string }> = {
    RENT: { label: "Rent", className: "bg-blue-50 text-blue-700" },
    SALE: { label: "Buy", className: "bg-emerald-50 text-emerald-700" },
    SHORTLET: { label: "Shortlet", className: "bg-amber-50 text-amber-700" },
    LEASE: { label: "Lease", className: "bg-purple-50 text-purple-700" },
  };
  return map[type] ?? { label: type, className: "bg-zinc-100 text-zinc-600" };
}

function tierLabel(tier: number) {
  if (tier >= 3) return { label: "Gold", className: "bg-amber-50 text-amber-700" };
  if (tier === 2) return { label: "Verified", className: "bg-emerald-50 text-emerald-700" };
  return { label: "Basic", className: "bg-zinc-100 text-zinc-500" };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Image Gallery ──────────────────────────────────────────────────────────
// Desktop: masonry-style grid (hero left + up to 4 smaller right)
// Mobile:  swipeable carousel with counter

function ImageGallery({ images, title }: { images: PropertyDetail["images"]; title: string }) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const total = images.length;

  // ── Mobile carousel ──────────────────────────────────────────────────────
  const MobileCarousel = () => (
    <div className="md:hidden relative w-full h-72 bg-zinc-100 overflow-hidden rounded-2xl">
      {images[current]?.url ? (
        <Image
          src={images[current].url}
          alt={`${title} — image ${current + 1}`}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <HouseIcon className="w-12 h-12 text-zinc-300" />
        </div>
      )}

      {total > 1 && (
        <>
          <button
            onClick={() => setCurrent((c) => (c - 1 + total) % total)}
            aria-label="Previous"
            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-zinc-700"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={() => setCurrent((c) => (c + 1) % total)}
            aria-label="Next"
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-zinc-700"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Thumbnail strip overlaid at the bottom — max 5 visible, centered on active */}
          {(() => {
            const MAX = 5;
            const half = Math.floor(MAX / 2);
            let start = Math.max(0, current - half);
            let end = start + MAX;
            if (end > total) {
              end = total;
              start = Math.max(0, end - MAX);
            }
            const visible = images.slice(start, end);
            const hiddenAfter = total - end;

            return (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2">
                {visible.map((img, idx) => {
                  const realIdx = start + idx;
                  return (
                    <button
                      key={realIdx}
                      onClick={() => setCurrent(realIdx)}
                      aria-label={`Go to image ${realIdx + 1}`}
                      className={`relative shrink-0 h-10 w-14 rounded-md overflow-hidden transition-all duration-200 ${
                        realIdx === current
                          ? "ring-2 ring-white opacity-100"
                          : "opacity-50 hover:opacity-80"
                      }`}
                    >
                      <Image
                        src={img.url}
                        alt={`Thumbnail ${realIdx + 1}`}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </button>
                  );
                })}

                {/* +N overflow badge */}
                {hiddenAfter > 0 && (
                  <button
                    onClick={() => setCurrent(end)}
                    aria-label={`Show more images`}
                    className="shrink-0 h-10 w-14 rounded-md bg-black/60 backdrop-blur-sm flex items-center justify-center text-white text-xs font-bold hover:bg-black/80 transition-colors"
                  >
                    +{hiddenAfter}
                  </button>
                )}
              </div>
            );
          })()}

          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {current + 1} / {total}
          </div>
        </>
      )}
    </div>
  );

  // ── Desktop masonry ───────────────────────────────────────────────────────
  // Layout: hero (left, full height) + up to 4 thumbnails (right, 2×2 grid)
  const hero = images[0];
  const thumbs = images.slice(1, 5); // max 4 right-side images
  const remaining = total - 5; // how many are hidden

  const DesktopMasonry = () => (
    <div className="hidden md:grid grid-cols-2 gap-2 h-[480px]">
      {/* Hero — left half, full height, rounded left corners */}
      <div
        className="relative cursor-pointer group rounded-l-2xl overflow-hidden"
        onClick={() => setLightbox(0)}
      >
        {hero?.url ? (
          <Image
            src={hero.url}
            alt={`${title} — main`}
            fill
            sizes="50vw"
            className="object-cover group-hover:brightness-90 transition-all duration-300"
            priority
          />
        ) : (
          <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
            <HouseIcon className="w-16 h-16 text-zinc-300" />
          </div>
        )}
      </div>

      {/* Right side — 2×2 grid */}
      <div className="grid grid-cols-2 grid-rows-2 gap-2">
        {[0, 1, 2, 3].map((i) => {
          const img = thumbs[i];
          const isLast = i === 3 && remaining > 0;
          // Round the two right-side corners
          const cornerClass =
            i === 1 ? "rounded-tr-2xl" :
            i === 3 ? "rounded-br-2xl" : "";

          return (
            <div
              key={i}
              className={`relative cursor-pointer group overflow-hidden ${cornerClass}`}
              onClick={() => img && setLightbox(i + 1)}
            >
              {img?.url ? (
                <>
                  <Image
                    src={img.url}
                    alt={`${title} — image ${i + 2}`}
                    fill
                    sizes="25vw"
                    className="object-cover group-hover:brightness-90 transition-all duration-300"
                  />
                  {/* "Show all" overlay on last visible thumb */}
                  {isLast && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">+{remaining + 1} photos</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-zinc-100" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Lightbox ──────────────────────────────────────────────────────────────
  const Lightbox = () => {
    if (lightbox === null) return null;
    return (
      <div
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
        onClick={() => setLightbox(null)}
      >
        <div
          className="relative w-full max-w-4xl aspect-video"
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={images[lightbox]?.url ?? ""}
            alt={`${title} — image ${lightbox + 1}`}
            fill
            sizes="90vw"
            className="object-contain"
          />
          {/* Prev / Next */}
          {total > 1 && (
            <>
              <button
                onClick={() => setLightbox((l) => ((l ?? 0) - 1 + total) % total)}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
                aria-label="Previous"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                onClick={() => setLightbox((l) => ((l ?? 0) + 1) % total)}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
                aria-label="Next"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </>
          )}
          {/* Counter + close */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <span className="bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {(lightbox ?? 0) + 1} / {total}
            </span>
            <button
              onClick={() => setLightbox(null)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <MobileCarousel />
      <DesktopMasonry />
      <Lightbox />
    </>
  );
}

// ── Amenity icon map ───────────────────────────────────────────────────────
// Maps amenity name keywords → an appropriate SVG path

function AmenityIcon({ name }: { name: string }) {
  const n = name.toLowerCase();

  // Water / plumbing
  if (n.includes("water") || n.includes("borehole") || n.includes("well"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 6v6l4 2"/></svg>;

  // Electricity / meter / power
  if (n.includes("meter") || n.includes("electric") || n.includes("power") || n.includes("pre-paid"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;

  // Generator
  if (n.includes("generator"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>;

  // Solar
  if (n.includes("solar"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;

  // Security / CCTV / guard
  if (n.includes("security") || n.includes("cctv") || n.includes("guard") || n.includes("gated"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;

  // Parking
  if (n.includes("parking") || n.includes("garage") || n.includes("car"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;

  // Pool / swimming
  if (n.includes("pool") || n.includes("swim"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><circle cx="7" cy="7" r="2"/><path d="M7 9v3"/></svg>;

  // Gym / fitness
  if (n.includes("gym") || n.includes("fitness"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5h11M6.5 17.5h11M3 10h3v4H3zM18 10h3v4h-3z"/><line x1="6" y1="12" x2="18" y2="12"/></svg>;

  // Garden / lawn
  if (n.includes("garden") || n.includes("lawn") || n.includes("yard"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12M12 12C12 7 7 3 2 3c0 5 4 9 10 9zM12 12c0-5 5-9 10-9-1 5-5 9-10 9z"/></svg>;

  // Air conditioning / AC
  if (n.includes("air") || n.includes("ac") || n.includes("conditioning"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="8" rx="2"/><path d="M7 11v4M12 11v6M17 11v4M5 19l2-4M12 17l0 4M19 19l-2-4"/></svg>;

  // WiFi / internet
  if (n.includes("wifi") || n.includes("internet") || n.includes("broadband"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>;

  // Boys quarters / servant quarters
  if (n.includes("quarter") || n.includes("servant") || n.includes("boys"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;

  // Fence / gate / wall
  if (n.includes("fence") || n.includes("gate") || n.includes("wall") || n.includes("compound"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;

  // Balcony / terrace / rooftop
  if (n.includes("balcony") || n.includes("terrace") || n.includes("rooftop") || n.includes("porch"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7"/><rect x="5" y="9" width="14" height="12"/><line x1="5" y1="14" x2="19" y2="14"/></svg>;

  // TV / DSTV / cable
  if (n.includes("tv") || n.includes("dstv") || n.includes("cable") || n.includes("satellite"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>;

  // Laundry / washing
  if (n.includes("laundry") || n.includes("washing") || n.includes("dryer"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="12" cy="13" r="4"/><line x1="8" y1="6" x2="8.01" y2="6"/><line x1="12" y1="6" x2="12.01" y2="6"/></svg>;

  // Store / storage
  if (n.includes("store") || n.includes("storage"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>;

  // Default — generic checkmark for anything unrecognised
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}

function HealthBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color =
    pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-zinc-600 w-8 text-right">{pct}</span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function PropertyDetailClient({
  property,
  session,
}: {
  property: PropertyDetail;
  session: any;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  const meta = property.metadata ?? {};
  const price = formatPrice(property);
  const badge = listingTypeBadge(property.listingType);
  const tier = tierLabel(property.landlord.verificationTier);
  const amenities: string[] = Array.isArray(meta.amenities) ? meta.amenities : [];

  async function toggleSave() {
    if (!session?.user) {
      router.push("/auth/login");
      return;
    }
    setSaved((s) => !s);
    await fetch(`/api/properties/${property.id}/save`, { method: "POST" });
  }

  function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: property.title, url: window.location.href }).catch(() => {});
    } else if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
  }

  const loginHref = "/auth/login";

  return (
    <div className="py-8">

        {/* ── Back button ── */}
        <button
          onClick={() => router.back()}
          className="group mb-5 flex hover:cursor-pointer items-center gap-1.5 text-sm font-semibold text-zinc-400 hover:text-zinc-900 transition-colors"
          aria-label="Go back"
        >
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            className="group-hover:-translate-x-1 transition-transform duration-150"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>

        {/* ── Gallery ── */}
        <ImageGallery images={property.images} title={property.title} />

        {/* ── Title + price row ── */}
        <div className="mt-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${badge.className}`}>
                {badge.label}
              </span>
              {property.deedVerified && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  Deed Verified
                </span>
              )}
              {property.priceVerified && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                  Price Verified
                </span>
              )}
            </div>

            <h1 className="text-3xl font-extrabold text-zinc-900 leading-tight">
              {property.title}
            </h1>

            <p className="mt-2 flex items-center gap-1.5 text-sm text-zinc-500">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              {property.address}, {property.lga}, {property.state}
            </p>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-zinc-900">{price.primary}</span>
              {price.secondary && (
                <span className="text-sm text-zinc-400 font-semibold">{price.secondary}</span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleSave}
              aria-label={saved ? "Unsave property" : "Save property"}
              className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition-colors ${
                saved
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400"
              }`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {saved ? "Saved" : "Save"}
            </button>
            <button
              onClick={handleShare}
              aria-label="Share property"
              className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold text-zinc-700 hover:border-zinc-400 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Share
            </button>
          </div>
        </div>

        {/* ── 3-column info grid ── */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Column 1 — Overview */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-zinc-400 mb-4">Overview</h2>
            <dl className="space-y-3">
              {meta.bedrooms != null && (
                <InfoRow label="Bedrooms" value={`${meta.bedrooms} Bedroom${meta.bedrooms !== 1 ? "s" : ""}`} />
              )}
              {meta.bathrooms != null && (
                <InfoRow label="Bathrooms" value={`${meta.bathrooms} Bathroom${meta.bathrooms !== 1 ? "s" : ""}`} />
              )}
              {meta.size != null && (
                <InfoRow label="Size" value={`${meta.size} sqm`} />
              )}
              {meta.propertyType && (
                <InfoRow label="Property Type" value={meta.propertyType} />
              )}
              {property.listingType === "RENT" && (
                <InfoRow
                  label="Rent Frequency"
                  value={
                    meta.rentFrequency
                      ? meta.rentFrequency.charAt(0) + meta.rentFrequency.slice(1).toLowerCase()
                      : "Annually"
                  }
                />
              )}
              <div>
                <dt className="text-xs font-semibold text-zinc-400 mb-1.5">Health Score</dt>
                <HealthBar score={property.healthScore ?? 0} />
              </div>
              <InfoRow label="Listed" value={formatDate(property.createdAt)} />
              <InfoRow label="Waitlist" value={`${property._count.waitlist} interested`} />
            </dl>
          </div>

          {/* Column 2 — Amenities */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-zinc-400 mb-4">Amenities</h2>
            {amenities.length > 0 ? (
              <AmenitiesList amenities={amenities} />
            ) : (
              <p className="text-sm text-zinc-400">Contact landlord for details.</p>
            )}
          </div>

          {/* Column 3 — Landlord / Contact */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col gap-4">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-zinc-400">Landlord</h2>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 font-bold text-base shrink-0">
                {property.landlord.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-zinc-900 truncate">{property.landlord.fullName}</p>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${tier.className}`}>
                  {tier.label}
                </span>
              </div>
            </div>

            {property.landlord.shackScore?.score != null && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 font-medium">ShackScore</span>
                <span className="font-extrabold text-zinc-900">{property.landlord.shackScore.score}</span>
              </div>
            )}

            <div className="flex flex-col gap-2 mt-auto">
              <Link
                href={session?.user ? `/chat?landlord=${property.landlord.id}&property=${property.id}` : loginHref}
                className="flex items-center justify-center gap-2 rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold text-white hover:bg-zinc-700 transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Chat with Landlord
              </Link>

              {property.status === "AVAILABLE" ? (
                <Link
                  href={session?.user ? `/applications/new?property=${property.id}` : loginHref}
                  className="flex items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-700 hover:border-zinc-400 transition-colors"
                >
                  Apply Now
                </Link>
              ) : (
                <JoinWaitlistButton propertyId={property.id} session={session} status={property.status} />
              )}
            </div>
          </div>
        </div>

        {/* ── Description / About ── */}
        {meta.description && (
          <div className="mt-5 bg-white rounded-2xl border border-zinc-200 p-6">
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-zinc-400 mb-3">About this property</h2>
            <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-line">{meta.description}</p>
          </div>
        )}

        {/* ── Similar properties strip (placeholder) ── */}
        <div className="mt-5 bg-white rounded-2xl border border-zinc-200 p-6">
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-zinc-400 mb-1">Similar Properties</h2>
          <p className="text-sm text-zinc-400">More listings in {property.lga} coming soon.</p>
        </div>

    </div>
  );
}

// ── Amenities list with show more ─────────────────────────────────────────

const AMENITIES_LIMIT = 6;

function AmenitiesList({ amenities }: { amenities: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = amenities.length > AMENITIES_LIMIT;
  const visible = expanded ? amenities : amenities.slice(0, AMENITIES_LIMIT);
  const hiddenCount = amenities.length - AMENITIES_LIMIT;

  return (
    <div>
      <ul className="space-y-2.5">
        {visible.map((a) => (
          <li key={a} className="flex items-center gap-2.5 text-sm text-zinc-700 font-medium">
            <span className="text-zinc-500 shrink-0">
              <AmenityIcon name={a} />
            </span>
            {a}
          </li>
        ))}
      </ul>
      {hasMore && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="mt-4 flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          {expanded ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              Show less
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
              Show {hiddenCount} more
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ── Info row ───────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-xs font-semibold text-zinc-400 shrink-0">{label}</dt>
      <dd className="text-sm font-bold text-zinc-800 text-right">{value}</dd>
    </div>
  );
}

function JoinWaitlistButton({ propertyId, session, status }: { propertyId: string; session: any; status: string }) {
  const router = useRouter();
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    if (!session?.user) {
      router.push("/auth/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/waitlist`, { method: "POST" });
      if (res.ok) setJoined(true);
    } finally {
      setLoading(false);
    }
  }

  const statusLabel: Record<string, string> = {
    RENTED: "Currently rented",
    MAINTENANCE: "Under maintenance",
    PENDING: "Pending approval",
    FLAGGED: "Flagged",
  };

  return (
    <div className="flex flex-col gap-1.5">
      {statusLabel[status] && (
        <p className="text-center text-xs font-semibold text-zinc-400">
          {statusLabel[status]}
        </p>
      )}
      <button
        onClick={handleJoin}
        disabled={joined || loading}
        className={`flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-bold transition-colors ${
          joined
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 cursor-default"
            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
        } disabled:opacity-60`}
      >
        {joined ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            On Waitlist
          </>
        ) : loading ? (
          "Joining..."
        ) : (
          "Join Waitlist"
        )}
      </button>
    </div>
  );
}

function HouseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
