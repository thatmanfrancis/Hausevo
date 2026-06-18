"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

// ── Constants ──────────────────────────────────────────────────────────────

const LAGOS_LGAS = [
  "Alimosho",
  "Ajeromi-Ifelodun",
  "Kosofe",
  "Mushin",
  "Oshodi-Isolo",
  "Ojo",
  "Ikorodu",
  "Surulere",
  "Agege",
  "Ifako-Ijaiye",
  "Somolu",
  "Amuwo-Odofin",
  "Lagos Island",
  "Eti-Osa",
  "Badagry",
  "Apapa",
  "Lagos Mainland",
  "Ikeja",
  "Ibeju-Lekki",
  "Epe",
];

const PROPERTY_TYPES = [
  "Self Contain",
  "Room & Parlour",
  "Mini Flat",
  "Studio Apartment",
  "1 Bedroom Flat",
  "2 Bedroom Flat",
  "3 Bedroom Flat",
  "4 Bedroom Flat",
  "5+ Bedroom Flat",
  "Penthouse",
  "Bungalow",
  "Semi-Detached Bungalow",
  "Detached Bungalow",
  "Duplex",
  "Semi-Detached Duplex",
  "Detached Duplex",
  "Terrace",
  "Terrace Duplex",
  "Mansion",
  "Office Space",
  "Shop",
  "Warehouse",
  "Land",
];

const LISTING_TYPES = [
  { value: "", label: "All" },
  { value: "RENT", label: "Rent" },
  { value: "SALE", label: "Buy" },
  { value: "SHORTLET", label: "Shortlet" },
  { value: "LEASE", label: "Lease" },
];

const PRICE_RANGES = [
  { value: "", label: "Any Price" },
  { value: "0-500000", label: "Under ₦500k/yr" },
  { value: "500000-1000000", label: "₦500k – ₦1M/yr" },
  { value: "1000000-2000000", label: "₦1M – ₦2M/yr" },
  { value: "2000000-5000000", label: "₦2M – ₦5M/yr" },
  { value: "5000000-10000000", label: "₦5M – ₦10M/yr" },
  { value: "10000000-999999999", label: "Above ₦10M/yr" },
];

// ── Types ──────────────────────────────────────────────────────────────────

type Property = {
  id: string;
  title: string;
  address: string;
  lga: string;
  state: string;
  listingType: string;
  pricePerYear: number;
  totalPackage: number;
  metadata: any;
  isBoosted: boolean;
  deedVerified: boolean;
  priceVerified: boolean;
  images: { url: string }[];
  landlord: { id: string; fullName: string; verificationTier: number };
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

function formatPrice(property: Property) {
  const meta = (property.metadata as any) ?? {};

  // Shortlet — show daily rate from metadata, with weekly too
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

  // Sale — just the price, no frequency
  if (property.listingType === "SALE") {
    const salePrice = meta.salePrice ?? property.pricePerYear;
    if (!salePrice) return { primary: "Price on request", secondary: null };
    return { primary: formatNaira(salePrice), secondary: null };
  }

  // Rent / Lease — show annual + derived monthly
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

  // ANNUALLY (default) — show annual + monthly breakdown
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

const LGA_OPTIONS = [
  { value: "", label: "All Lagos LGAs" },
  ...LAGOS_LGAS.map((l) => ({ value: l, label: l })),
];

const PROPERTY_TYPE_OPTIONS = [
  { value: "", label: "Any Type" },
  ...PROPERTY_TYPES.map((t) => ({ value: t, label: t })),
];

interface CustomSelectOption {
  value: string;
  label: string;
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  isSearchable = false,
}: {
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  placeholder: string;
  searchPlaceholder?: string;
  isSearchable?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const currentOption = options.find((o) => o.value === value);
  const displayLabel = currentOption ? currentOption.label : placeholder;

  const filteredOptions = isSearchable && searchTerm
    ? options.filter((o) =>
        o.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-transparent text-sm font-semibold text-zinc-800 outline-none cursor-pointer text-left py-0.5"
      >
        <span className="truncate">{displayLabel}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`text-zinc-500 transition-transform duration-200 shrink-0 ml-1 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop close layer */}
          <div
            className="fixed inset-0 z-30"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              setSearchTerm("");
            }}
          />
          {/* Dropdown Menu */}
          <div
            className="absolute top-[calc(100%+12px)] -left-4 -right-4 z-40 bg-white border border-zinc-200 rounded-xl shadow-xl max-h-60 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {isSearchable && (
              <div className="p-2 border-b border-zinc-100 bg-zinc-50">
                <input
                  type="text"
                  placeholder={searchPlaceholder || "Search..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg outline-none focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 transition-all font-medium"
                />
              </div>
            )}
            <div className="overflow-y-auto flex-1 py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-xs text-zinc-400 italic text-center">
                  No options found
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                        setSearchTerm("");
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between hover:bg-zinc-50 transition-colors ${
                        isSelected
                          ? "bg-zinc-50 text-zinc-950"
                          : "text-zinc-600 hover:text-zinc-900"
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && (
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          className="text-zinc-900 shrink-0 ml-2"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function PropertiesClient({
  initialProperties,
  totalProperties,
  totalPages,
  currentPage,
  userLga,
  userState,
  locationSource,
  session,
  searchParams,
  children,
  isHomePage = false,
  savedPropertyIds = [],
}: {
  initialProperties: Property[];
  totalProperties?: number;
  totalPages?: number;
  currentPage?: number;
  userLga?: string;
  userState?: string;
  locationSource: "search" | "wishlist" | "geo" | "all";
  session: any;
  searchParams: Record<string, string | undefined>;
  children?: React.ReactNode;
  isHomePage?: boolean;
  savedPropertyIds?: string[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [lga, setLga] = useState(searchParams.lga ?? userLga ?? "");
  const [listingType, setListingType] = useState(
    searchParams.listingType ?? "",
  );
  const [propertyType, setPropertyType] = useState(
    searchParams.propertyType ?? "",
  );
  const [priceRange, setPriceRange] = useState(searchParams.priceRange ?? "");
  const [q, setQ] = useState(searchParams.q ?? "");
  const [savedIds, setSavedIds] = useState<Set<string>>(
    new Set(savedPropertyIds ?? []),
  );

  // Handle pending save action after login redirect — read from URL client-side only
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pendingSave = params.get("pendingSave");
    if (pendingSave && session?.user) {
      setSavedIds((prev) => {
        const next = new Set(prev);
        next.add(pendingSave);
        return next;
      });
      fetch(`/api/properties/${pendingSave}/save`, { method: "POST" }).catch(
        () => {},
      );
      const url = new URL(window.location.href);
      url.searchParams.delete("pendingSave");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const isFiltered = !!(lga || listingType || propertyType || priceRange || q);

  function applySearch() {
    const params = new URLSearchParams();
    if (lga) params.set("lga", lga);
    if (listingType) params.set("listingType", listingType);
    if (propertyType) params.set("propertyType", propertyType);
    if (priceRange) params.set("priceRange", priceRange);
    if (q) params.set("q", q);
    startTransition(() => router.push(`/properties?${params.toString()}`));
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams as any);
    params.set("page", String(p));
    startTransition(() => router.push(`/properties?${params.toString()}`));
  }

  function clearSearch() {
    setLga("");
    setListingType("");
    setPropertyType("");
    setPriceRange("");
    setQ("");
    startTransition(() => router.push("/properties"));
  }

  async function toggleSave(propertyId: string) {
    if (!session?.user) {
      router.push(
        `/auth/login?callbackUrl=${encodeURIComponent(`/properties?pendingSave=${propertyId}`)}`,
      );
      return;
    }
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.has(propertyId) ? next.delete(propertyId) : next.add(propertyId);
      return next;
    });
    await fetch(`/api/properties/${propertyId}/save`, { method: "POST" });
  }

  // Dynamic heading based on how we know the location
  // On /properties, we only show location context for explicit searches to avoid
  // the flicker caused by LocationDetector injecting geo params after SSR.
  const headingLocation =
    locationSource === "search" && lga
      ? `in ${lga}`
      : isHomePage && locationSource === "geo"
        ? `near you`
        : isHomePage && locationSource === "wishlist" && userLga
          ? `in ${userLga}`
          : "in Lagos";

  const headingSubtitle =
    isHomePage && locationSource === "geo"
      ? "Discover verified homes near your current location"
      : isHomePage && locationSource === "wishlist"
        ? "Homes for rent in your preferred Lagos neighbourhoods"
        : locationSource === "search" && lga
          ? `Verified listings in ${lga} — no agents, no markups`
          : "Verified homes for rent and sale across Lagos — no agents, no markups";

  const [searchModalOpen, setSearchModalOpen] = useState(false);

  return (
    <div>
      {children}
      <div className="py-10">
        {/* ── Section header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-zinc-900 tracking-tight">
              Popular Listings{" "}
              <span className="text-zinc-400 font-semibold">
                {headingLocation}
              </span>
            </h1>
            <p className="mt-1.5 text-zinc-500 text-sm">{headingSubtitle}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Search icon button */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:cursor-pointer border border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition-colors"
              aria-label="Search properties"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
            {isHomePage ? (
              <Link
                href="/properties"
                className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold text-zinc-700 hover:border-zinc-400 hover:text-zinc-900 transition-colors whitespace-nowrap"
              >
                Explore All
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            ) : (
              <button
                onClick={clearSearch}
                className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold text-zinc-700 hover:border-zinc-400 hover:text-zinc-900 transition-colors whitespace-nowrap"
              >
                Explore All
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* ── Search modal ── */}
        {searchModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setSearchModalOpen(false)}
          >
            <div
              className="bg-white rounded-2xl border border-zinc-200 w-full max-w-lg p-6 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <p className="text-base font-extrabold text-zinc-900">
                  Search Properties
                </p>
                <button
                  onClick={() => setSearchModalOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100 transition-colors text-zinc-400"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Keyword Search Input */}
              <div className="relative mb-5 bg-zinc-50 rounded-xl px-4 py-3.5 border border-zinc-100 flex items-center gap-2 focus-within:border-zinc-300 transition-all">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-zinc-400 shrink-0"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by title, location, or keywords..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-zinc-800 outline-none placeholder-zinc-400"
                />
                {q && (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="text-zinc-400 hover:text-zinc-700 text-xs font-bold transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <FilterField label="Location" icon={<LocationIcon />}>
                  <CustomSelect
                    value={lga}
                    onChange={setLga}
                    options={LGA_OPTIONS}
                    placeholder="All Lagos LGAs"
                    searchPlaceholder="Search LGA..."
                    isSearchable={true}
                  />
                </FilterField>
                <FilterField label="Listing Type" icon={<TagIcon />}>
                  <CustomSelect
                    value={listingType}
                    onChange={setListingType}
                    options={LISTING_TYPES}
                    placeholder="All"
                  />
                </FilterField>
                <FilterField label="Property Type" icon={<HomeIcon />}>
                  <CustomSelect
                    value={propertyType}
                    onChange={setPropertyType}
                    options={PROPERTY_TYPE_OPTIONS}
                    placeholder="Any Type"
                    searchPlaceholder="Search type..."
                    isSearchable={true}
                  />
                </FilterField>
                <FilterField label="Price Range" icon={<PriceIcon />}>
                  <CustomSelect
                    value={priceRange}
                    onChange={setPriceRange}
                    options={PRICE_RANGES}
                    placeholder="Any Price"
                  />
                </FilterField>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSearchModalOpen(false);
                    applySearch();
                  }}
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 rounded-full bg-zinc-900 px-6 py-3.5 text-sm font-bold text-white hover:bg-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Search
                </button>
                {isFiltered && (
                  <button
                    onClick={() => {
                      setSearchModalOpen(false);
                      clearSearch();
                    }}
                    className="text-sm font-semibold text-zinc-500 hover:text-zinc-950 transition-colors px-4 py-2"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Listing type tabs ── */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
          {LISTING_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setListingType(t.value);
                const params = new URLSearchParams();
                if (lga) params.set("lga", lga);
                if (t.value) params.set("listingType", t.value);
                if (propertyType) params.set("propertyType", propertyType);
                if (priceRange) params.set("priceRange", priceRange);
                startTransition(() =>
                  router.push(`/properties?${params.toString()}`),
                );
              }}
              className={`shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-colors ${
                listingType === t.value
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-400 hover:text-zinc-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Property grid / mobile carousel ── */}
        {initialProperties.length === 0 ? (
          <EmptyState onClear={clearSearch} isFiltered={isFiltered} />
        ) : (
          <>
            {/* Desktop: 3-col grid */}
            <div
              className={`hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5 transition-opacity ${isPending ? "opacity-50" : "opacity-100"}`}
            >
              {initialProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  isSaved={savedIds.has(property.id)}
                  onSave={() => toggleSave(property.id)}
                />
              ))}
            </div>
            {/* Mobile: auto-scrolling carousel */}
            <MobileCarousel
              properties={initialProperties}
              savedIds={savedIds}
              onSave={toggleSave}
              isPending={isPending}
            />
          </>
        )}

        {/* ── Pagination ── */}
        {!isHomePage &&
          totalPages != null &&
          totalPages >= 1 &&
          (totalProperties ?? 0) > 0 && (
            <div className="mt-10 flex items-center justify-between">
              <p className="text-sm text-zinc-500">
                Showing {((currentPage ?? 1) - 1) * 12 + 1}–
                {Math.min((currentPage ?? 1) * 12, totalProperties ?? 0)} of{" "}
                {totalProperties} properties
              </p>
              <div className="flex items-center gap-1">
                {/* Prev */}
                <button
                  onClick={() => goToPage((currentPage ?? 1) - 1)}
                  disabled={(currentPage ?? 1) <= 1 || isPending}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    const cur = currentPage ?? 1;
                    return (
                      p === 1 || p === totalPages || Math.abs(p - cur) <= 1
                    );
                  })
                  .reduce<(number | "...")[]>((acc, p, i, arr) => {
                    if (
                      i > 0 &&
                      typeof arr[i - 1] === "number" &&
                      (p as number) - (arr[i - 1] as number) > 1
                    ) {
                      acc.push("...");
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span
                        key={`ellipsis-${i}`}
                        className="px-1 text-zinc-400 text-sm"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => goToPage(p as number)}
                        disabled={isPending}
                        className={`h-9 w-9 rounded-full text-sm font-bold transition-colors ${
                          p === (currentPage ?? 1)
                            ? "bg-zinc-900 text-white"
                            : "border border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900"
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}

                {/* Next */}
                <button
                  onClick={() => goToPage((currentPage ?? 1) + 1)}
                  disabled={
                    (currentPage ?? 1) >= (totalPages ?? 1) || isPending
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>
          )}

        {/* ── Search / Filter bar ── */}
        <div className="mt-12">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <h2 className="text-base font-extrabold text-zinc-900 mb-5">
              Refine your search
            </h2>

            {/* Keyword Search Input */}
            <div className="relative mb-5 bg-zinc-50 rounded-xl px-4 py-3.5 border border-zinc-100 flex items-center gap-2 focus-within:border-zinc-300 transition-all">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-zinc-400 shrink-0"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search by title, location, or keywords..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-zinc-800 outline-none placeholder-zinc-400"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  className="text-zinc-400 hover:text-zinc-700 text-xs font-bold transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <FilterField label="Location" icon={<LocationIcon />}>
                <CustomSelect
                  value={lga}
                  onChange={setLga}
                  options={LGA_OPTIONS}
                  placeholder="All Lagos LGAs"
                  searchPlaceholder="Search LGA..."
                  isSearchable={true}
                />
              </FilterField>
              <FilterField label="Listing Type" icon={<TagIcon />}>
                <CustomSelect
                  value={listingType}
                  onChange={setListingType}
                  options={LISTING_TYPES}
                  placeholder="All"
                />
              </FilterField>
              <FilterField label="Property Type" icon={<HomeIcon />}>
                <CustomSelect
                  value={propertyType}
                  onChange={setPropertyType}
                  options={PROPERTY_TYPE_OPTIONS}
                  placeholder="Any Type"
                  searchPlaceholder="Search type..."
                  isSearchable={true}
                />
              </FilterField>
              <FilterField label="Price Range" icon={<PriceIcon />}>
                <CustomSelect
                  value={priceRange}
                  onChange={setPriceRange}
                  options={PRICE_RANGES}
                  placeholder="Any Price"
                />
              </FilterField>
            </div>
            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={applySearch}
                disabled={isPending}
                className="flex items-center gap-2 rounded-full bg-zinc-900 px-8 py-3 text-sm font-bold text-white hover:bg-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="shrink-0"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Search Properties
              </button>
              {isFiltered && (
                <button
                  onClick={clearSearch}
                  className="text-sm font-semibold text-zinc-500 hover:text-zinc-950 transition-colors px-4 py-2"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Lagos → Nigeria statement ── */}
        <div className="mt-10 rounded-2xl bg-zinc-900 text-white px-8 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">
              Starting from Lagos
            </p>
            <h3 className="text-xl md:text-2xl font-extrabold leading-snug">
              We&apos;re building the most trusted
              <br className="hidden md:block" />
              property platform in Nigeria.
            </h3>
            <p className="mt-2 text-zinc-400 text-sm max-w-md">
              No agents. No markups. Every listing verified. Lagos first — then
              Abuja, Port Harcourt, and every city in between.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <Link
              href="/auth/register"
              className="rounded-full bg-white text-zinc-900 px-7 py-3 text-sm font-bold hover:bg-zinc-100 transition-colors"
            >
              Join Hausevo →
            </Link>
            <Link
              href="/waitlist"
              className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Join the waitlist
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Property Card ──────────────────────────────────────────────────────────

function PropertyCard({
  property,
  isSaved,
  onSave,
}: {
  property: Property;
  isSaved: boolean;
  onSave: () => void;
}) {
  const meta = (property.metadata as any) ?? {};
  const badge = listingTypeBadge(property.listingType);
  const imageUrl = property.images[0]?.url ?? null;
  const price = formatPrice(property);

  return (
    <Link
      href={`/properties/${property.id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-zinc-200 hover:border-zinc-400 transition-colors flex flex-col"
    >
      <div className="relative h-48 bg-zinc-100 overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={property.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-zinc-300"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
        )}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${badge.className}`}
          >
            {badge.label}
          </span>
          {property.isBoosted && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-400 text-amber-900">
              Featured
            </span>
          )}
        </div>
        {property.deedVerified && (
          <div className="absolute top-4 right-12 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-emerald-600"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-[10px] font-bold text-emerald-700">
              Verified
            </span>
          </div>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            onSave();
          }}
          className={`absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isSaved ? "bg-zinc-900 text-white" : "bg-white/90 backdrop-blur-sm text-zinc-500 hover:text-zinc-900"}`}
          aria-label={isSaved ? "Unsave" : "Save"}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill={isSaved ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        {/* Price — primary + secondary breakdown */}
        <div className="flex items-baseline gap-2">
          <p className="text-base font-extrabold text-zinc-900">
            {price.primary}
          </p>
          {price.secondary && (
            <span className="text-xs text-zinc-400 font-semibold">
              {price.secondary}
            </span>
          )}
        </div>
        <h3 className="text-sm font-bold text-zinc-800 leading-snug line-clamp-2 group-hover:text-zinc-600 transition-colors">
          {property.title}
        </h3>
        <p className="text-xs text-zinc-400 flex items-center gap-1 line-clamp-1">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {property.address}, {property.lga}
        </p>
        <div className="flex items-center gap-3 mt-auto pt-3 border-t border-zinc-100 text-xs text-zinc-500 font-semibold">
          {meta.bedrooms != null && (
            <span className="flex items-center gap-1">
              <BedIcon /> {meta.bedrooms} Bed{meta.bedrooms !== 1 ? "s" : ""}
            </span>
          )}
          {meta.bathrooms != null && (
            <span className="flex items-center gap-1">
              <BathIcon /> {meta.bathrooms} Bath
              {meta.bathrooms !== 1 ? "s" : ""}
            </span>
          )}
          {meta.propertyType && (
            <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              {meta.propertyType}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Mobile Carousel ────────────────────────────────────────────────────────

function MobileCarousel({
  properties,
  savedIds,
  onSave,
  isPending,
}: {
  properties: Property[];
  savedIds: Set<string>;
  onSave: (id: string) => void;
  isPending: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const autoScrollRef = useRef<NodeJS.Timeout | null>(null);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  // Auto-scroll every 3s, pauses on user interaction
  const startAutoScroll = useCallback(() => {
    if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    autoScrollRef.current = setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      const cardW = el.firstElementChild
        ? (el.firstElementChild as HTMLElement).offsetWidth + 16
        : 300;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      el.scrollBy({
        left: atEnd ? -el.scrollWidth : cardW,
        behavior: "smooth",
      });
    }, 3000);
  }, []);

  const resetAutoScroll = useCallback(() => {
    if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    // Restart after 5s of inactivity
    setTimeout(startAutoScroll, 5000);
  }, [startAutoScroll]);

  useEffect(() => {
    startAutoScroll();
    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    };
  }, [startAutoScroll]);

  function scrollBy(dir: "left" | "right") {
    const el = trackRef.current;
    if (!el) return;
    const cardW = el.firstElementChild
      ? (el.firstElementChild as HTMLElement).offsetWidth + 16
      : 300;
    el.scrollBy({ left: dir === "right" ? cardW : -cardW, behavior: "smooth" });
    resetAutoScroll();
  }

  return (
    <div
      className={`sm:hidden relative transition-opacity ${isPending ? "opacity-50" : "opacity-100"}`}
    >
      {/* Left arrow */}
      <button
        onClick={() => scrollBy("left")}
        aria-label="Scroll left"
        className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400 transition-all ${canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {/* Track */}
      <div
        ref={trackRef}
        onScroll={updateScrollState}
        className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {properties.map((property) => (
          <div
            key={property.id}
            className="snap-start shrink-0 w-[88vw] min-[360px]:w-[82vw] min-[420px]:w-[76vw] max-w-[320px]"
          >
            <PropertyCard
              property={property}
              isSaved={savedIds.has(property.id)}
              onSave={() => onSave(property.id)}
            />
          </div>
        ))}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scrollBy("right")}
        aria-label="Scroll right"
        className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400 transition-all ${canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState({
  onClear,
  isFiltered,
}: {
  onClear: () => void;
  isFiltered: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 mb-4">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-zinc-400"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-zinc-800 mb-1">
        No properties found
      </h3>
      <p className="text-sm text-zinc-400 max-w-xs mb-5">
        {isFiltered
          ? "Try adjusting your filters or clearing them to see all available listings."
          : "No listings are available right now. Check back soon."}
      </p>
      {isFiltered && (
        <button
          onClick={onClear}
          className="rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-zinc-700 transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

// ── Filter field wrapper ───────────────────────────────────────────────────

function FilterField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col gap-1.5 bg-zinc-50 rounded-xl px-4 py-3 border border-zinc-100">
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      {children}
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────

function LocationIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function HomeIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function TagIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}
function PriceIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
function BedIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 16h20M6 8v8" />
    </svg>
  );
}
function BathIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
      <line x1="10" y1="5" x2="8" y2="7" />
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  );
}
