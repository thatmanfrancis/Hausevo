"use client";

import Link from "next/link";
import Image from "next/image";

const FOOTER_LINKS = [
  {
    heading: "Platform",
    links: [
      { label: "Browse Properties", href: "/properties" },
      { label: "Add Listing", href: "/auth/register" },
      { label: "How It Works", href: "/about" },
      { label: "Blog", href: "/blogs" },
      { label: "Join Waitlist", href: "/waitlist" },
      { label: "Download App", href: "#download", isInstall: true },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Team", href: "/team" },
      { label: "Careers", href: "/careers" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Login / Signup", href: "/auth/login" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Cookie Policy", href: "/cookies" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-white border-t border-zinc-100 mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Top row — brand + link columns */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Image 
                src="/icons/logo-white-bold.png" 
                alt="Shack Logo" 
                width={40} 
                height={40} 
                className="object-contain invert"
              />
              <span className="text-lg font-black tracking-tighter text-zinc-900 uppercase">Shack</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 border border-zinc-200 rounded-full px-2 py-0.5">
                Nigeria
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-[200px]">
              Verified properties. No agents, no markups, transparent pricing.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3 mt-1">
              <a
                href="https://twitter.com/shackng"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="https://instagram.com/shackng"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a
                href="https://linkedin.com/company/shackng"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_LINKS.map((col) => (
            <div key={col.heading} className="flex flex-col gap-3">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
                {col.heading}
              </p>
              <ul className="space-y-2.5">
                {col.links.map((link: any) => (
                  <li key={link.href}>
                    {link.isInstall ? (
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent("trigger-pwa-install"))}
                        className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors text-left"
                      >
                        {link.label}
                      </button>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* SEO Popular Searches */}
        <div className="mt-12 pt-8 border-t border-zinc-100">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-4">Popular Searches</p>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {[
              "Houses for rent in Lagos", "Apartments near me", "Self contain in Lagos",
              "2 Bedroom flats in Ikeja", "Mini flats in Surulere", "Luxury homes in Lekki",
              "Rent house in Lagos no agent", "Verified properties in Nigeria", "Affordable Lagos homes"
            ].map((tag) => (
              <span key={tag} className="text-[10px] font-semibold text-zinc-400 hover:text-zinc-700 cursor-default transition-colors">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-10 pt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-zinc-400">
            © {new Date().getFullYear()} Shack Technologies Ltd. All rights reserved.
          </p>
          <a
            href="https://dev.lemonwares.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors group"
          >
            <span>A product of</span>
            <span className="font-bold text-zinc-500 group-hover:text-zinc-800 transition-colors">
              LemonWares Technologies
            </span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </div>

      </div>
    </footer>
  );
}

