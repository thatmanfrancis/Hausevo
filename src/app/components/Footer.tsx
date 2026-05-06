import Link from "next/link";

const FOOTER_LINKS = [
  {
    heading: "Platform",
    links: [
      { label: "Browse Properties", href: "/properties" },
      { label: "Add Listing", href: "/auth/register" },
      { label: "How It Works", href: "/about" },
      { label: "Blog", href: "/blogs" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Contact Us", href: "/contact" },
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-zinc-900">Shack</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 border border-zinc-200 rounded-full px-2 py-0.5">
                Nigeria
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-[200px]">
              Verified properties. No agents, no markups, transparent pricing.
            </p>
            {/* Social links placeholder */}
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
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row — copyright */}
        <div className="mt-10 pt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-zinc-400">
            © {new Date().getFullYear()} Shack Technologies Ltd. All rights reserved.
          </p>
          <p className="text-xs text-zinc-400">
            Starting from Lagos — expanding across Nigeria.
          </p>
        </div>

      </div>
    </footer>
  );
}
