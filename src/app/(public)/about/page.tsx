import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Hausevo — Nigeria's Most Trusted Property Platform",
  description: "Learn how Hausevo is fixing Nigeria's broken rental market. No agents, no inflated prices, no fake listings. Every property verified. Lagos first.",
  alternates: { canonical: "https://hausevo.com.ng/about" },
  openGraph: {
    title: "About Hausevo — Nigeria's Most Trusted Property Platform",
    description: "No agents. No markups. Every listing verified. We're building the most trusted property platform in Nigeria, starting in Lagos.",
    url: "https://hausevo.com.ng/about",
    siteName: "Hausevo",
    images: [{ url: "https://hausevo.com.ng/hausevofinal.png", width: 500, height: 500, alt: "Hausevo" }],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Hausevo — Nigeria's Most Trusted Property Platform",
    description: "No agents. No markups. Every listing verified. We're building the most trusted property platform in Nigeria.",
    images: ["https://hausevo.com.ng/hausevofinal.png"],
    creator: "@hausevong",
  },
  keywords: [
    "about Hausevo",
    "Nigerian property platform",
    "rent house Nigeria no agent",
    "verified listings Nigeria",
    "Lagos rental platform",
    "real estate startup Nigeria",
  ],
};

const STATS = [
  { value: "Lagos", label: "Starting city" },
  { value: "0%", label: "Agent fees" },
  { value: "100%", label: "Verified listings" },
  { value: "₦0", label: "Hidden markups" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Landlords list directly",
    body: "No agents in the middle. Landlords submit their properties, we verify ownership and price, then it goes live.",
  },
  {
    step: "02",
    title: "We verify everything",
    body: "Every listing is checked — deed documents, landlord identity, and market price. If it doesn't pass, it doesn't go live.",
  },
  {
    step: "03",
    title: "Tenants apply with confidence",
    body: "Browse verified listings, chat directly with landlords, and apply with your Hausevo Score. No surprises.",
  },
  {
    step: "04",
    title: "Move in, stay protected",
    body: "Digital tenancy agreements, rent schedules, dispute resolution, and a vault for all your documents.",
  },
];

const PROBLEMS = [
  {
    problem: "Agent fees of 10–15%",
    solution: "Zero agent fees. Ever.",
  },
  {
    problem: "Fake listings everywhere",
    solution: "Every listing verified before it goes live.",
  },
  {
    problem: "Inflated prices",
    solution: "Market price verified by our team.",
  },
  {
    problem: "No paper trail",
    solution: "Digital agreements, receipts, and a document vault.",
  },
  {
    problem: "Landlords hard to reach",
    solution: "Direct chat with every landlord on the platform.",
  },
  {
    problem: "No tenant credit history",
    solution: "Hausevo Score — a rental credit score built for Nigeria.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-16 py-4">

      {/* Hero */}
      <div className="bg-zinc-900 rounded-2xl p-8 md:p-12">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">About Hausevo</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-4 max-w-2xl">
          We&apos;re building the most trusted property platform in Nigeria.
        </h1>
        <p className="text-base text-zinc-400 leading-relaxed max-w-xl mb-8">
          No agents. No markups. Every listing verified. Lagos first — then Abuja, Port Harcourt, and every city in between.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-white/5 rounded-xl p-4">
              <p className="text-2xl font-extrabold text-white mb-0.5">{s.value}</p>
              <p className="text-xs font-semibold text-zinc-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* The problem */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">The problem</p>
        <h2 className="text-2xl font-extrabold text-zinc-900 mb-6">
          Renting in Nigeria is broken. We&apos;re fixing it.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PROBLEMS.map((p) => (
            <div key={p.problem} className="bg-white rounded-2xl border border-zinc-200 p-5 flex gap-4">
              <div className="flex flex-col gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </span>
                  <p className="text-xs font-bold text-red-600">{p.problem}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <p className="text-xs font-bold text-emerald-700">{p.solution}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">How it works</p>
        <h2 className="text-2xl font-extrabold text-zinc-900 mb-6">Simple. Transparent. Verified.</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.step} className="bg-white rounded-2xl border border-zinc-200 p-6 flex gap-5">
              <span className="text-3xl font-extrabold text-zinc-200 shrink-0 leading-none">{step.step}</span>
              <div>
                <p className="text-sm font-extrabold text-zinc-900 mb-1.5">{step.title}</p>
                <p className="text-sm text-zinc-500 leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mission */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-8 md:p-10">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Our mission</p>
        <p className="text-2xl font-extrabold text-zinc-900 leading-snug max-w-2xl mb-6">
          &ldquo;Make renting in Nigeria as simple, safe, and transparent as it should be.&rdquo;
        </p>
        <p className="text-sm text-zinc-500 leading-relaxed max-w-xl">
          We started Hausevo because we&apos;ve been tenants. We&apos;ve paid agent fees we didn&apos;t owe, moved into properties that didn&apos;t match the listing, and had no recourse when things went wrong. Hausevo is the platform we wish existed.
        </p>
      </div>

      {/* CTAs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <a
          href="/properties"
          className="bg-zinc-900 rounded-2xl p-6 text-white hover:bg-zinc-800 transition-colors group"
        >
          <p className="text-sm font-extrabold mb-1">Browse properties</p>
          <p className="text-xs text-zinc-400 mb-4">Find your next home on Hausevo</p>
          <span className="text-xs font-bold group-hover:translate-x-1 transition-transform inline-block">Browse →</span>
        </a>
        <a
          href="/team"
          className="bg-white rounded-2xl border border-zinc-200 p-6 hover:border-zinc-400 transition-colors group"
        >
          <p className="text-sm font-extrabold text-zinc-900 mb-1">Meet the team</p>
          <p className="text-xs text-zinc-500 mb-4">The people building Hausevo</p>
          <span className="text-xs font-bold text-zinc-700 group-hover:translate-x-1 transition-transform inline-block">Team →</span>
        </a>
        <a
          href="/careers"
          className="bg-white rounded-2xl border border-zinc-200 p-6 hover:border-zinc-400 transition-colors group"
        >
          <p className="text-sm font-extrabold text-zinc-900 mb-1">Join us</p>
          <p className="text-xs text-zinc-500 mb-4">We&apos;re hiring across all functions</p>
          <span className="text-xs font-bold text-zinc-700 group-hover:translate-x-1 transition-transform inline-block">Careers →</span>
        </a>
      </div>

      {/* LemonWares */}
      {/* <div className="flex items-center justify-center pt-2">
        <a
          href="https://dev.lemonwares.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          A product of <span className="font-bold">LemonWares Technologies</span>
        </a>
      </div> */}

    </div>
  );
}
