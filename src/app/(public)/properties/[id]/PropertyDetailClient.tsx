"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ── SVG Spinner (no icon library) ─────────────────────────────────────────

function Spinner({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className={`animate-spin ${className}`}
      aria-hidden="true"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────

type SimilarProperty = {
  id: string;
  title: string;
  address: string;
  lga: string;
  listingType: string;
  pricePerYear: number;
  metadata: any;
  deedVerified: boolean;
  images: { url: string }[];
};

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

function ImageWithSpinner({
  src, alt, fill, sizes, className, priority, onClick,
}: {
  src: string; alt: string; fill?: boolean; sizes?: string;
  className?: string; priority?: boolean; onClick?: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative w-full h-full" onClick={onClick}>
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 z-10">
          <Spinner size={28} className="text-zinc-400" />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        fill={fill}
        sizes={sizes}
        className={`${className ?? ""} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        priority={priority}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

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
        <ImageWithSpinner
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
                      className={`relative shrink-0 h-10 w-14 rounded-md overflow-hidden transition-all duration-200 ${realIdx === current
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
      {/* Hero — left half, full height, fully rounded */}
      <div className="relative cursor-pointer group rounded-2xl overflow-hidden">
        {hero?.url ? (
          <ImageWithSpinner
            src={hero.url}
            alt={`${title} — main`}
            fill
            sizes="50vw"
            className="object-cover group-hover:brightness-90 transition-all duration-300"
            priority
            onClick={() => setLightbox(0)}
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
          // All four sides rounded on every cell
          const cornerClass = "rounded-2xl";

          return (
            <div
              key={i}
              className={`relative cursor-pointer group overflow-hidden ${cornerClass}`}
            >
              {img?.url ? (
                <>
                  <ImageWithSpinner
                    src={img.url}
                    alt={`${title} — image ${i + 2}`}
                    fill
                    sizes="25vw"
                    className="object-cover group-hover:brightness-90 transition-all duration-300"
                    onClick={() => setLightbox(i + 1)}
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
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" /><path d="M12 6v6l4 2" /></svg>;

  // Electricity / meter / power
  if (n.includes("meter") || n.includes("electric") || n.includes("power") || n.includes("pre-paid"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;

  // Generator
  if (n.includes("generator"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" /></svg>;

  // Solar
  if (n.includes("solar"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>;

  // Security / CCTV / guard
  if (n.includes("security") || n.includes("cctv") || n.includes("guard") || n.includes("gated"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;

  // Parking
  if (n.includes("parking") || n.includes("garage") || n.includes("car"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>;

  // Pool / swimming
  if (n.includes("pool") || n.includes("swim"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0" /><circle cx="7" cy="7" r="2" /><path d="M7 9v3" /></svg>;

  // Gym / fitness
  if (n.includes("gym") || n.includes("fitness"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5h11M6.5 17.5h11M3 10h3v4H3zM18 10h3v4h-3z" /><line x1="6" y1="12" x2="18" y2="12" /></svg>;

  // Garden / lawn
  if (n.includes("garden") || n.includes("lawn") || n.includes("yard"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12M12 12C12 7 7 3 2 3c0 5 4 9 10 9zM12 12c0-5 5-9 10-9-1 5-5 9-10 9z" /></svg>;

  // Air conditioning / AC
  if (n.includes("air") || n.includes("ac") || n.includes("conditioning"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="8" rx="2" /><path d="M7 11v4M12 11v6M17 11v4M5 19l2-4M12 17l0 4M19 19l-2-4" /></svg>;

  // WiFi / internet
  if (n.includes("wifi") || n.includes("internet") || n.includes("broadband"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" /></svg>;

  // Boys quarters / servant quarters
  if (n.includes("quarter") || n.includes("servant") || n.includes("boys"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;

  // Fence / gate / wall
  if (n.includes("fence") || n.includes("gate") || n.includes("wall") || n.includes("compound"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>;

  // Balcony / terrace / rooftop
  if (n.includes("balcony") || n.includes("terrace") || n.includes("rooftop") || n.includes("porch"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7" /><rect x="5" y="9" width="14" height="12" /><line x1="5" y1="14" x2="19" y2="14" /></svg>;

  // TV / DSTV / cable
  if (n.includes("tv") || n.includes("dstv") || n.includes("cable") || n.includes("satellite"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" /><polyline points="17 2 12 7 7 2" /></svg>;

  // Laundry / washing
  if (n.includes("laundry") || n.includes("washing") || n.includes("dryer"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2" /><circle cx="12" cy="13" r="4" /><line x1="8" y1="6" x2="8.01" y2="6" /><line x1="12" y1="6" x2="12.01" y2="6" /></svg>;

  // Store / storage
  if (n.includes("store") || n.includes("storage"))
    return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>;

  // Default — generic checkmark for anything unrecognised
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
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
  similarProperties = [],
}: {
  property: PropertyDetail;
  session: any;
  similarProperties?: SimilarProperty[];
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [viewingRequested, setViewingRequested] = useState(false);
  const [viewingLoading, setViewingLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Handle pending save action after login redirect — read URL client-side only
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("pendingAction") === "save" && session?.user) {
      fetch(`/api/properties/${property.id}/save`, { method: "POST" })
        .then(() => setSaved(true))
        .catch(() => {});
      const url = new URL(window.location.href);
      url.searchParams.delete("pendingAction");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const meta = property.metadata ?? {};
  const price = formatPrice(property);
  const badge = listingTypeBadge(property.listingType);
  const tier = tierLabel(property.landlord.verificationTier);
  const amenities: string[] = Array.isArray(meta.amenities) ? meta.amenities : [];

  async function toggleSave() {
    if (!session?.user) {
      // Redirect to login with callback — after auth, return here with pendingAction=save
      const callbackUrl = encodeURIComponent(
        `/properties/${property.id}?pendingAction=save`
      );
      router.push(`/auth/login?callbackUrl=${callbackUrl}`);
      return;
    }
    setSaved((s) => !s);
    await fetch(`/api/properties/${property.id}/save`, { method: "POST" });
  }

  async function requestViewing() {
    if (!session?.user) {
      const callbackUrl = encodeURIComponent(`/properties/${property.id}`);
      router.push(`/auth/login?callbackUrl=${callbackUrl}`);
      return;
    }
    setViewingLoading(true);
    try {
      await fetch(`/api/properties/${property.id}/viewing`, { method: "POST" });
      setViewingRequested(true);
    } catch {
      // Silent fail
    } finally {
      setViewingLoading(false);
    }
  }

  async function copyUrl() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  }

  const propertyUrl = typeof window !== "undefined" ? window.location.href : `https://hausevo.com.ng/properties/${property.id}`;
  const shareText = encodeURIComponent(`${property.title} — ${formatPrice(property).primary} | Hausevo`);
  const shareUrl = encodeURIComponent(propertyUrl);

  const loginHref = `/auth/login?callbackUrl=${encodeURIComponent(`/properties/${property.id}`)}`;

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
            className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition-colors ${saved
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
            onClick={() => setShowShareModal(true)}
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
              <span className="text-zinc-500 font-medium">Hausevo Score</span>
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

            {property.status === "AVAILABLE" && (
              <button
                type="button"
                onClick={requestViewing}
                disabled={viewingLoading || viewingRequested}
                className={`flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-bold transition-colors ${viewingRequested
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 cursor-default"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"
                  } disabled:opacity-70`}
              >
                {viewingRequested ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Viewing Requested
                  </>
                ) : viewingLoading ? (
                  "Requesting…"
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    Request Viewing
                  </>
                )}
              </button>
            )}

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

      {/* ── AI Property Chatbot (floating) ── */}
      <PropertyAIChatbot property={property} />

      {/* ── Similar properties ── */}
      <SimilarProperties properties={similarProperties} lga={property.lga} listingType={property.listingType} />

      {/* ── Share modal ── */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setShowShareModal(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-extrabold text-zinc-900">Share this property</p>
                <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-[240px]">{property.title}</p>
              </div>
              <button onClick={() => setShowShareModal(false)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-400 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Copy URL */}
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="flex-1 text-xs text-zinc-500 truncate font-mono">{propertyUrl}</p>
              <button
                onClick={copyUrl}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${copied ? "bg-emerald-900 text-white" : "bg-zinc-900 text-white hover:bg-zinc-700"}`}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* Social share links */}
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Share via</p>
              <div className="grid grid-cols-2 gap-2">
                {/* WhatsApp */}
                <a
                  href={`https://wa.me/?text=${shareText}%20${shareUrl}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-2.5 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-bold text-zinc-700 hover:border-zinc-400 transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </a>
                {/* X / Twitter */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-2.5 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-bold text-zinc-700 hover:border-zinc-400 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  X / Twitter
                </a>
                {/* Facebook */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-2.5 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-bold text-zinc-700 hover:border-zinc-400 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </a>
                {/* Email */}
                <a
                  href={`mailto:?subject=${shareText}&body=Check out this property on Hausevo: ${propertyUrl}`}
                  className="flex items-center gap-2.5 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-bold text-zinc-700 hover:border-zinc-400 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                  Email
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

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
        className={`flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-bold transition-colors ${joined
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

// ── AI Property Chatbot (floating) ────────────────────────────────────────

type ChatMessage = { role: "user" | "ai"; text: string };

function renderBold(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("*") && part.endsWith("*"))) {
      return <strong key={i} className="font-extrabold">{part.replace(/^\*+|\*+$/g, "")}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function PropertyAIChatbot({ property }: { property: PropertyDetail }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setLoading(true);
    const meta = property.metadata ?? {};
    const propertyContext = [
      `Property: ${property.title}`,
      `Location: ${property.address}, ${property.lga}`,
      `Type: ${meta.propertyType ?? property.listingType}`,
      `Price: ₦${property.pricePerYear > 0 ? property.pricePerYear.toLocaleString("en-NG") + "/yr" : (meta.salePrice ? meta.salePrice.toLocaleString("en-NG") : "on request")}`,
      `Bedrooms: ${meta.bedrooms ?? "N/A"}, Bathrooms: ${meta.bathrooms ?? "N/A"}`,
      `Amenities: ${(meta.amenities ?? []).slice(0, 8).join(", ") || "None listed"}`,
      `Deed verified: ${property.deedVerified ? "Yes" : "No"}, Health score: ${property.healthScore}/100`,
    ].join(". ");
    try {
      const res = await fetch("/api/ai/property-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          propertyContext,
          history: messages.slice(-6).map((m) => ({ role: m.role === "user" ? "user" : "model", text: m.text })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "ai", text: data.reply ?? "Sorry, I could not generate a response." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", text: "Network error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  const SUGGESTIONS = [
    "Is this price fair for this area?",
    "What should I check during inspection?",
    "What are the hidden costs?",
    "How does this compare to similar listings?",
  ];

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-bold shadow-lg transition-all duration-200 ${
          open ? "bg-zinc-700 text-white scale-95" : "bg-zinc-900 text-white hover:bg-zinc-700 hover:scale-105"
        }`}
        aria-label="Ask AI about this property"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M12 3C12 3 13.2 7.8 15.5 10.5C17.8 13.2 22 12 22 12C22 12 17.8 12.8 15.5 15.5C13.2 18.2 12 22 12 22C12 22 10.8 18.2 8.5 15.5C6.2 12.8 2 12 2 12C2 12 6.2 11.2 8.5 8.5C10.8 5.8 12 3 12 3Z" />
        </svg>
        {!open && <span className="hidden sm:block">Ask AI</span>}
        {open && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed top-16 right-0 bottom-0 z-40 flex flex-col w-full sm:w-[380px] sm:top-20 sm:bottom-20 sm:right-6 sm:rounded-2xl bg-white border-l sm:border border-zinc-200 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-100 shrink-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 shrink-0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                  <path d="M12 3C12 3 13.2 7.8 15.5 10.5C17.8 13.2 22 12 22 12C22 12 17.8 12.8 15.5 15.5C13.2 18.2 12 22 12 22C12 22 10.8 18.2 8.5 15.5C6.2 12.8 2 12 2 12C2 12 6.2 11.2 8.5 8.5C10.8 5.8 12 3 12 3Z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-zinc-900 leading-none">Property AI</p>
                <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{property.title}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-zinc-400">Gemini</span>
                </div>
                {messages.length > 0 && (
                  <button onClick={() => setMessages([])} title="Clear chat"
                    className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
              {messages.length === 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-zinc-500 text-center mb-2">Ask anything about this property.</p>
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => sendMessage(s)}
                      className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-semibold text-zinc-600 hover:border-zinc-400 hover:bg-white transition-colors text-left">
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    m.role === "user" ? "bg-zinc-900 text-white rounded-br-sm" : "bg-white border border-zinc-200 text-zinc-900 rounded-bl-sm"
                  }`}>
                    {m.role === "ai" ? renderBold(m.text) : m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-zinc-200 rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                    <div className="flex gap-1">
                      {[0,1,2].map((i) => <span key={i} className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            {/* Input */}
            <div className="border-t border-zinc-100 px-3 py-3 shrink-0">
              <div className="flex items-center gap-2">
                <input ref={inputRef} type="text" value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                  placeholder="Ask about this property…"
                  className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 transition-colors"
                />
                <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ── Similar properties ─────────────────────────────────────────────────────

function SimilarProperties({
  properties,
  lga,
  listingType,
}: {
  properties: SimilarProperty[];
  lga: string;
  listingType: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll state on mount and on scroll
  function checkScroll() {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }

  useEffect(() => {
    checkScroll();
    const el = trackRef.current;
    el?.addEventListener("scroll", checkScroll, { passive: true });
    return () => el?.removeEventListener("scroll", checkScroll);
  }, [properties]);

  function scroll(dir: "left" | "right") {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "right" ? 280 : -280, behavior: "smooth" });
  }

  const formatNairaShort = (n: number) => {
    if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}k`;
    return `₦${n}`;
  };

  return (
    <div className="mt-5 bg-white rounded-2xl border border-zinc-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-extrabold uppercase tracking-widest text-zinc-400">
          Similar in {lga}
        </h2>
        <div className="flex items-center gap-2">
          {properties.length > 1 && (
            <>
              <button
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Scroll left"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Scroll right"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </>
          )}
          <Link
            href={`/properties?lga=${encodeURIComponent(lga)}&listingType=${listingType}`}
            className="text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            View all →
          </Link>
        </div>
      </div>

      {properties.length === 0 ? (
        <p className="text-sm text-zinc-400">No other listings in {lga} right now.</p>
      ) : (
        /* Scrollable carousel track — hide scrollbar visually */
        <div
          ref={trackRef}
          className="flex gap-3 overflow-x-auto pb-1 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {properties.map((p) => {
            const meta = p.metadata ?? {};
            const imgUrl = p.images[0]?.url ?? null;
            const priceLabel =
              p.listingType === "RENT"
                ? `${formatNairaShort(p.pricePerYear)}/yr`
                : p.listingType === "SHORTLET"
                ? `${formatNairaShort(meta.shortlet?.dailyRate ?? 0)}/day`
                : formatNairaShort(meta.salePrice ?? p.pricePerYear);

            return (
              <Link
                key={p.id}
                href={`/properties/${p.id}`}
                className="group shrink-0 w-56 flex flex-col rounded-2xl border border-zinc-200 overflow-hidden hover:border-zinc-400 transition-colors"
              >
                {/* Image */}
                <div className="relative h-32 bg-zinc-100 overflow-hidden">
                  {imgUrl ? (
                    <Image
                      src={imgUrl}
                      alt={p.title}
                      fill
                      sizes="224px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <HouseIcon className="w-8 h-8 text-zinc-300" />
                    </div>
                  )}
                  {p.deedVerified && (
                    <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-white/90 backdrop-blur-sm text-[9px] font-bold text-emerald-700 px-1.5 py-0.5 rounded-full">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Verified
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 flex flex-col gap-1">
                  <p className="text-xs font-extrabold text-zinc-900 leading-snug line-clamp-2">
                    {p.title}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate">{p.lga}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-extrabold text-zinc-900">{priceLabel}</span>
                    {meta.bedrooms != null && (
                      <span className="text-[10px] text-zinc-400 font-semibold">
                        {meta.bedrooms} bed
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
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
