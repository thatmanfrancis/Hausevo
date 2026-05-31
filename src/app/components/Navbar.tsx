"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";

// ── Types ──────────────────────────────────────────────────────────────────
type DropdownItem = { label: string; href: string };
type NavItem =
  | { label: string; href: string; dropdown?: never }
  | { label: string; href?: never; dropdown: DropdownItem[] };

// ── Nav config ─────────────────────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "Listing",
    dropdown: [
      { label: "All Listings", href: "/properties" },
      { label: "For Rent", href: "/properties?listingType=RENT" },
      { label: "For Sale", href: "/properties?listingType=SALE" },
      { label: "Shortlet", href: "/properties?listingType=SHORTLET" },
      { label: "Lease", href: "/properties?listingType=LEASE" },
    ],
  },
  {
    label: "Property",
    dropdown: [
      { label: "Self Contain", href: "/properties?propertyType=Self+Contain" },
      { label: "Mini Flat", href: "/properties?propertyType=Mini+Flat" },
      { label: "2 Bedroom Flat", href: "/properties?propertyType=2+Bedroom+Flat" },
      { label: "3 Bedroom Flat", href: "/properties?propertyType=3+Bedroom+Flat" },
      { label: "Bungalow", href: "/properties?propertyType=Bungalow" },
      { label: "Semi-Detached", href: "/properties?propertyType=Semi-Detached+Duplex" },
      { label: "Detached Duplex", href: "/properties?propertyType=Detached+Duplex" },
      { label: "Duplex", href: "/properties?propertyType=Duplex" },
      { label: "Terrace", href: "/properties?propertyType=Terrace" },
      { label: "Mansion", href: "/properties?propertyType=Mansion" },
    ],
  },
  {
    label: "Pages",
    dropdown: [
      { label: "About Us", href: "/about" },
      { label: "Team", href: "/team" },
      { label: "Careers", href: "/careers" },
      { label: "Blog", href: "/blogs" },
      { label: "Contact", href: "/contact" },
      { label: "FAQ", href: "/faq" },
      { label: "Waitlist", href: "/waitlist" },
    ],
  },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function Navbar({ session }: { session: any }) {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setOpenDropdown(null);
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <header 
      ref={navRef}
      className="w-full bg-white border-b border-zinc-100 sticky top-0 z-50"
    >
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
        <Link href="/" className="flex items-center shrink-0">
          <Image 
            src="/hausevofinal.png" 
            alt="Hausevo Logo" 
            width={64} 
            height={64} 
            className="object-contain"
            priority
          />
        </Link>

        {/* ── Desktop nav ── */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href
              ? pathname === item.href
              : item.dropdown?.some((d) => pathname === d.href);
            const isOpen = openDropdown === item.label;

            if (item.href) {
              // Plain link
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? "text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            }

            // Dropdown link
            return (
              <div key={item.label} className="relative">
                <button
                  onClick={() => setOpenDropdown(isOpen ? null : item.label)}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive || isOpen
                      ? "text-zinc-900"
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                  }`}
                >
                  {item.label}
                  <ChevronIcon
                    className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown panel */}
                {isOpen && item.dropdown && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-zinc-100 py-1.5 z-50">
                    {item.dropdown.map((d) => (
                      <Link
                        key={d.href}
                        href={d.href}
                        className={`block px-4 py-2.5 text-sm font-semibold transition-colors ${
                          pathname === d.href
                            ? "text-zinc-900 bg-zinc-50"
                            : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                        }`}
                      >
                        {d.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Right actions ── */}
        <div className="hidden md:flex items-center gap-3">
          {session?.user ? (
            // Logged in — chat icon + notifications bell + compact avatar dropdown
            <>
              <Link
                href="/chat"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition-colors"
                aria-label="Messages"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </Link>
              <Link
                href="/notifications"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition-colors"
                aria-label="Notifications"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </Link>
              <UserMenu session={session} />
            </>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-1.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Login / Signup
            </Link>
          )}

          {/* Add Listing CTA */}
          <Link
            href={session?.user ? "/landlord/properties/new" : "/auth/register"}
            className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-zinc-700 transition-colors"
          >
            Add Listing
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block h-0.5 w-5 bg-zinc-900 transition-transform duration-200 ${isMobileOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block h-0.5 w-5 bg-zinc-900 transition-opacity duration-200 ${isMobileOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-5 bg-zinc-900 transition-transform duration-200 ${isMobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </nav>

      {/* ── Mobile menu ── */}
      {isMobileOpen && (
        <div className="md:hidden border-t border-zinc-100 bg-white px-6 py-4 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            if (item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="px-3 py-2.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  {item.label}
                </Link>
              );
            }
            return (
              <div key={item.label}>
                <button
                  onClick={() =>
                    setOpenDropdown(openDropdown === item.label ? null : item.label)
                  }
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-50 transition-colors"
                >
                  {item.label}
                  <ChevronIcon
                    className={`transition-transform duration-200 ${openDropdown === item.label ? "rotate-180" : ""}`}
                  />
                </button>
                {openDropdown === item.label && item.dropdown && (
                  <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l-2 border-zinc-100 pl-3">
                    {item.dropdown.map((d) => (
                      <Link
                        key={d.href}
                        href={d.href}
                        className="py-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
                      >
                        {d.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="mt-3 pt-3 border-t border-zinc-100 flex flex-col gap-1">
            {session?.user ? (
              <>
                {/* User info header */}
                <div className="flex items-center gap-3 px-3 py-3 mb-1">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-white text-sm font-bold shrink-0">
                    {session.user.name?.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase() ?? "U"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-900 truncate">{session.user.name}</p>
                    <p className="text-xs text-zinc-400 truncate">{session.user.email}</p>
                  </div>
                </div>
                <Link href="/dashboard" className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-50 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  Dashboard
                </Link>
                <Link href="/profile" className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-50 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Profile
                </Link>
                <Link href="/wallet" className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-50 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                  Wallet
                </Link>
                <Link href="/settings" className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-50 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  Settings
                </Link>
                <div className="pt-1 mt-1 border-t border-zinc-100">
                  <LogoutButton compact />
                </div>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="px-3 py-2.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                Login / Signup
              </Link>
            )}
            <Link
              href={session?.user ? "/landlord/properties/new" : "/auth/register"}
              className="flex items-center justify-center gap-1.5 rounded-full bg-zinc-900 px-5 py-3 text-sm font-bold text-white hover:bg-zinc-700 transition-colors mt-2"
            >
              Add Listing
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

// ── User menu (logged in) ──────────────────────────────────────────────────
// Compact avatar + dropdown — replaces Dashboard + LogOut inline buttons

function UserMenu({ session }: { session: any }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-zinc-200 pl-1 pr-3 py-1 hover:border-zinc-400 transition-colors"
        aria-label="User menu"
      >
        {/* Avatar circle */}
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-white text-xs font-bold">
          {initials}
        </span>
        <span className="text-sm font-semibold text-zinc-700 max-w-[100px] truncate">
          {session?.user?.name?.split(" ")[0] ?? "Account"}
        </span>
        <ChevronIcon className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-xl border border-zinc-100 shadow-lg py-1.5 z-50">
          <div className="px-4 py-2.5 border-b border-zinc-100 mb-1">
            <p className="text-xs font-bold text-zinc-900 truncate">{session?.user?.name}</p>
            <p className="text-xs text-zinc-400 truncate">{session?.user?.email}</p>
          </div>
          <Link href="/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Dashboard
          </Link>
          <Link href="/profile" className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            Profile
          </Link>
          <Link href="/wallet" className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
            Wallet
          </Link>
          <div className="border-t border-zinc-100 mt-1 pt-1">
            <LogoutButton compact />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Chevron icon ───────────────────────────────────────────────────────────
function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
