"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

const LAGOS_LGAS = [
  "Alimosho", "Ajeromi-Ifelodun", "Kosofe", "Mushin", "Oshodi-Isolo",
  "Ojo", "Ikorodu", "Surulere", "Agege", "Ifako-Ijaiye",
  "Somolu", "Amuwo-Odofin", "Lagos Island", "Eti-Osa", "Badagry",
  "Apapa", "Lagos Mainland", "Ikeja", "Ibeju-Lekki", "Epe",
];

const PROPERTY_TYPES = [
  "Self Contain", "Room & Parlour", "Mini Flat",
  "2 Bedroom Flat", "3 Bedroom Flat", "4+ Bedroom Flat",
  "Bungalow", "Duplex", "Mansion", "Penthouse",
];

const PRICE_RANGES = [
  "Under ₦500k / yr",
  "₦500k – ₦1M / yr",
  "₦1M – ₦2M / yr",
  "₦2M – ₦5M / yr",
  "₦5M – ₦10M / yr",
  "Above ₦10M / yr",
];

export default function HomePageClient() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [priceRange, setPriceRange] = useState("");

  function handleSearch() {
    const params = new URLSearchParams();
    if (location) params.set("lga", location);
    if (propertyType) params.set("propertyType", propertyType);
    if (priceRange) params.set("priceRange", priceRange);
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <div className="flex-1 flex items-center justify-center p-3 sm:p-5">
      {/* ── Outer card ── */}
      <div className="w-full max-w-[1380px] bg-white rounded-[2.5rem] shadow-sm overflow-hidden relative flex flex-col min-h-[80vh]">

        {/* ── Hero ── */}
        <section className="flex-1 flex flex-col md:flex-row items-center px-8 md:px-14 pt-12 pb-8 relative z-10 overflow-hidden">

          {/* Left: copy */}
          <div className="w-full md:w-[46%] flex flex-col items-start gap-7 z-20 md:pb-16">
            <div className="space-y-1">
              <h1 className="leading-[1.05] tracking-tight text-zinc-900">
                <span className="block text-5xl md:text-6xl lg:text-7xl font-light">
                  Your Gateway to
                </span>
                <strong className="block text-5xl md:text-6xl lg:text-7xl font-extrabold">
                  Dream Homes
                </strong>
              </h1>
            </div>

            <p className="text-zinc-400 text-base md:text-lg max-w-xs leading-relaxed">
              Discover verified Lagos properties — no agents, no markups,
              transparent pricing.
            </p>

            <div className="flex items-center gap-6 mt-2">
              <Link
                href="/properties"
                className="rounded-full bg-zinc-900 px-9 py-4 text-sm font-bold text-white hover:bg-zinc-700 transition-colors shadow-lg"
              >
                Discover Now
              </Link>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-3 text-sm font-bold text-zinc-800 hover:opacity-60 transition-opacity group"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-zinc-900 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                  <svg width="11" height="13" viewBox="0 0 11 13" fill="currentColor">
                    <path d="M11 6.5L0 13V0L11 6.5Z" />
                  </svg>
                </span>
                Watch Demo
              </button>
            </div>
          </div>

          {/* Right: house image — bleeds to the right edge */}
          <div
            className="hidden md:block absolute right-0 top-0 bottom-0 w-[62%] pointer-events-none"
            aria-hidden="true"
          >
            <Image
              src="/hero_house.png"
              alt="Modern house"
              fill
              sizes="62vw"
              className="object-contain object-bottom-right"
              priority
            />
          </div>

          {/* Mobile image */}
          <div className="md:hidden w-full mt-6 relative h-56 rounded-2xl overflow-hidden">
            <Image
              src="/hero_house.png"
              alt="Modern house"
              fill
              sizes="100vw"
              className="object-cover object-center"
              priority
            />
          </div>
        </section>

        {/* ── Search bar ── */}
        <div className="px-8 md:px-14 pb-12 relative z-30">
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-md flex flex-col md:flex-row items-stretch md:items-center p-2 gap-2 md:gap-0 max-w-3xl">

            <SearchField
              icon={<LocationIcon />}
              label="Location"
              divider
            >
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-transparent text-sm font-bold outline-none cursor-pointer text-zinc-800 w-full"
              >
                <option value="">All Lagos LGAs</option>
                {LAGOS_LGAS.map((lga) => (
                  <option key={lga} value={lga}>{lga}</option>
                ))}
              </select>
            </SearchField>

            <SearchField
              icon={<HomeIcon />}
              label="Property Type"
              divider
            >
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="bg-transparent text-sm font-bold outline-none cursor-pointer text-zinc-800 w-full"
              >
                <option value="">Any Type</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </SearchField>

            <SearchField
              icon={<PriceIcon />}
              label="Price Range"
            >
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="bg-transparent text-sm font-bold outline-none cursor-pointer text-zinc-800 w-full"
              >
                <option value="">Any Budget</option>
                {PRICE_RANGES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </SearchField>

            <button
              onClick={handleSearch}
              className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-zinc-900 text-white flex items-center justify-center shrink-0 mx-2 hover:bg-zinc-700 transition-colors shadow-lg self-center"
              aria-label="Search properties"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>
        </div>

      </div>

      {/* ── Demo modal ── */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl rounded-4xl bg-white p-10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-7 top-7 text-zinc-400 hover:text-zinc-900 transition-colors"
              aria-label="Close modal"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <h2 className="text-2xl font-extrabold mb-5 text-zinc-900">Watch Demo</h2>
            <div className="aspect-video w-full rounded-2xl bg-zinc-100 flex items-center justify-center border border-zinc-200">
              <span className="text-zinc-400 font-semibold text-sm tracking-wide">
                Video Coming Soon
              </span>
            </div>
            <p className="mt-5 text-zinc-400 text-sm leading-relaxed">
              See how Shack makes finding a verified Lagos home simple, fast, and agent-free.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Search field wrapper ───────────────────────────────────────────────────
function SearchField({
  icon, label, divider = false, children,
}: {
  icon: React.ReactNode;
  label: string;
  divider?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex-1 flex items-center px-5 py-3 ${divider ? "border-b md:border-b-0 md:border-r border-zinc-100" : ""}`}>
      <div className="flex flex-col gap-1 w-full">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
          {icon}{label}
        </span>
        {children}
      </div>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────
function LocationIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function HomeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
function PriceIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
