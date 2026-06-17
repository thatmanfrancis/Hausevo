import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BackButton from "@/app/components/BackButton";
import Link from "next/link";

// ── Post content ───────────────────────────────────────────────────────────

type Post = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  content: React.ReactNode;
};

const CATEGORY_COLORS: Record<string, string> = {
  Market: "bg-amber-50 text-amber-700",
  Product: "bg-blue-50 text-blue-700",
  Guide: "bg-emerald-50 text-emerald-700",
};

const POSTS: Post[] = [
  {
    slug: "why-agent-fees-are-killing-lagos-renters",
    category: "Market",
    title: "Why Agent Fees Are Killing Lagos Renters",
    excerpt:
      "Tenants in Lagos pay 10–15% of annual rent to agents who add zero value. Here's the data, and why it has to stop.",
    date: "May 12, 2026",
    readTime: "8 min read",
    content: (
      <>
        <p>
          Chisom had been searching for a flat in Yaba for three weeks. She found one she liked —
          a clean 2-bedroom on a quiet street, ₦750,000 a year, directly from the landlord's
          WhatsApp status. She called the number. A man picked up. He wasn't the landlord. He was
          an agent. And before she could even see the flat, he told her his fee: 10%.
        </p>
        <p>
          That's ₦75,000. For what? She found the listing herself. The landlord set the price.
          The agent's only contribution was answering a phone call.
        </p>
        <p>
          Chisom's story isn't unusual. It's Tuesday in Lagos.
        </p>

        {/* Stat callout */}
        <div className="my-8 bg-zinc-900 rounded-2xl p-6 md:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">By the numbers</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-3xl font-extrabold text-white mb-1">10–15%</p>
              <p className="text-xs text-zinc-400 leading-relaxed">Standard agent fee charged on top of annual rent — unregulated, non-negotiable</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-white mb-1">₦0</p>
              <p className="text-xs text-zinc-400 leading-relaxed">Value added by most Lagos agents beyond showing a property the tenant already found</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-white mb-1">2 years</p>
              <p className="text-xs text-zinc-400 leading-relaxed">Typical upfront payment demanded — rent + caution + agency fee before you move in</p>
            </div>
          </div>
        </div>

        <h2>The real cost of renting in Lagos</h2>
        <p>
          Let's do the actual maths. You find a 2-bedroom flat in Surulere for ₦800,000 a year.
          Here's what you're actually paying before you touch a single light switch:
        </p>

        {/* Cost breakdown */}
        <div className="my-6 bg-white rounded-2xl border border-zinc-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-100">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Move-in cost breakdown — 2-bed flat, Surulere</p>
          </div>
          <div className="divide-y divide-zinc-100">
            {[
              { label: "1 year rent (upfront)", amount: "₦800,000" },
              { label: "Caution deposit (refundable — in theory)", amount: "₦800,000" },
              { label: "Agency fee (10%)", amount: "₦80,000" },
              { label: "Agreement / legal fee", amount: "₦20,000–₦50,000" },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-zinc-600">{row.label}</span>
                <span className="text-sm font-bold text-zinc-900">{row.amount}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-5 py-3 bg-zinc-50">
              <span className="text-sm font-extrabold text-zinc-900">Total before moving in</span>
              <span className="text-sm font-extrabold text-zinc-900">≈ ₦1.7m</span>
            </div>
          </div>
        </div>

        <p>
          For a flat in Lekki Phase 1 at ₦3.5m per year, that total climbs past ₦7.5 million.
          For a young professional earning ₦300,000 a month, that's more than two years of
          take-home pay — gone before you've unpacked.
        </p>
        <p>
          And that's before we talk about the caution deposit. In theory it's refundable. In
          practice, landlords find reasons not to return it. Cracked tile. Faded paint. A door
          handle that was already loose when you moved in. There's no inspection report, no
          baseline, no recourse. The money just disappears.
        </p>

        {/* Pull quote */}
        <blockquote className="my-8 border-l-4 border-zinc-900 pl-6">
          <p className="text-lg font-extrabold text-zinc-900 leading-snug mb-2">
            &ldquo;The agent is a toll booth on a road they didn&apos;t build.&rdquo;
          </p>
          <p className="text-xs text-zinc-400 font-semibold uppercase tracking-widest">Hausevo Research, 2026</p>
        </blockquote>

        <h2>What agents actually do — and don't do</h2>
        <p>
          In a functioning property market, agents earn their commission. They know the
          neighbourhood. They negotiate on your behalf. They review the tenancy agreement for
          unfair clauses. They manage disputes. They're accountable.
        </p>
        <p>
          In Lagos, the typical agent transaction looks like this:
        </p>
        <ul>
          <li>Tenant finds a listing on Jiji, Facebook Marketplace, or a WhatsApp group</li>
          <li>Agent intercepts the inquiry and claims to represent the landlord</li>
          <li>Agent shows the property — sometimes the landlord does this themselves anyway</li>
          <li>Agent collects 10% fee</li>
          <li>Agent is unreachable within 48 hours of move-in</li>
        </ul>
        <p>
          No contract review. No dispute resolution. No accountability. And critically — no
          verification. The agent has no idea if the landlord actually owns the property. They
          haven't checked the deed. They haven't confirmed the price is real. They're just
          collecting a toll.
        </p>
        <p>
          We've spoken to hundreds of Lagos tenants. The most common complaint isn't even the
          fee itself — it's the disappearing act. The moment money changes hands, the agent
          vanishes. Leaking roof? Call the landlord yourself. Faulty wiring? Figure it out.
          The agent who collected ₦80,000 from you is already showing another flat to someone else.
        </p>

        <h2>Why landlords go along with it</h2>
        <p>
          Here's the part that surprises people: most landlords don't love agents either.
        </p>
        <p>
          We've talked to landlords across Lagos — Surulere, Ikeja, Lekki, Ajah, Gbagada. The
          consistent story is the same: they use agents because they don't have a better option.
          They don't know how to reach verified tenants. They don't have a way to check if an
          applicant is who they say they are. They don't have a platform that handles the
          paperwork. So they hand the keys to an agent and hope for the best.
        </p>
        <p>
          The agent fills a real gap — badly, expensively, with zero accountability — but they
          fill it. Until there's a better alternative, landlords keep using them. And tenants
          keep paying for it.
        </p>

        {/* Comparison callout */}
        <div className="my-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-red-50 rounded-2xl border border-red-100 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-3">The old way</p>
            <ul className="space-y-2 text-sm text-red-700">
              {[
                "10–15% agency fee, non-negotiable",
                "No identity verification",
                "No deed check",
                "Verbal agreements, no paper trail",
                "Agent disappears after payment",
                "Caution deposit rarely returned",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400 shrink-0 mt-0.5">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3">The Hausevo way</p>
            <ul className="space-y-2 text-sm text-emerald-700">
              {[
                "Zero agency fees. Ever.",
                "NIN + BVN + biometric verification",
                "Deed documents checked before listing",
                "Digital tenancy agreements",
                "Direct landlord contact, always",
                "Condition reports protect your deposit",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 shrink-0 mt-0.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <h2>The deeper problem: it's a poverty trap</h2>
        <p>
          Agent fees don't just hurt — they trap people. When you're spending ₦1.7 million to
          move into a ₦800,000 flat, you're not building savings. You're not investing. You're
          not moving up. You're starting from zero every two years, handing money to people who
          contributed nothing to the transaction.
        </p>
        <p>
          The people most hurt by this system are the people who can least afford it. Young
          professionals moving to Lagos for their first job. Families relocating from other
          states. People who saved for months to afford a decent flat, only to find that the
          real cost is double what was advertised.
        </p>
        <p>
          Meanwhile, the agents — many of whom have no formal training, no licence, no
          accountability — pocket billions of naira annually from a city that's already one of
          the most expensive in Africa to live in.
        </p>

        <h2>What changes when you remove the agent</h2>
        <p>
          Hausevo was built on a simple premise: the agent shouldn't exist in this transaction.
          Not because agents are bad people — but because the role they play in Lagos adds no
          value and extracts enormous cost.
        </p>
        <p>
          When you remove the agent, the landlord gets more. The tenant pays less. The
          transaction is faster, cleaner, and documented. Both sides have verified identities.
          The price is confirmed against market rate. The agreement is digital and enforceable.
        </p>
        <p>
          The one-time ₦1,500 verification fee on Hausevo covers NIN verification, biometric
          selfie matching, and BVN financial signal. That's it. No percentage. No finder's fee.
          No caution deposit held hostage. No agent who disappears.
        </p>
        <p>
          Chisom eventually found her flat — through Hausevo. She paid ₦750,000 for the year.
          Not ₦825,000. Not ₦1.6 million. ₦750,000, plus ₦1,500 to verify her identity.
          She moved in two weeks after she started looking.
        </p>
        <p>
          That's what renting in Lagos should feel like.
        </p>

        {/* CTA */}
        <div className="my-8 bg-zinc-900 rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <p className="text-base font-extrabold text-white mb-1">Ready to rent without the agent?</p>
            <p className="text-sm text-zinc-400">Browse verified properties in Lagos. No fees, no markups, no middlemen.</p>
          </div>
          <a
            href="/properties"
            className="rounded-full bg-white text-zinc-900 px-6 py-3 text-sm font-bold hover:bg-zinc-100 transition-colors whitespace-nowrap self-start sm:self-auto shrink-0"
          >
            Browse properties →
          </a>
        </div>
      </>
    ),
  },
  {
    slug: "what-is-shackscore",
    category: "Product",
    title: "What Is Hausevo Score and Why It Matters",
    excerpt:
      "Nigeria's first rental credit score. How it's built, what it measures, and why landlords are already using it.",
    date: "May 8, 2026",
    readTime: "4 min read",
    content: (
      <>
        <p>
          In most countries, landlords check your credit score before renting to you. In Nigeria,
          there's no equivalent for rental history. A tenant who has paid rent on time for five
          years has no way to prove it. A tenant who trashed a flat and disappeared has no record
          against them. Hausevo Score changes that.
        </p>

        <h2>What Hausevo Score measures</h2>
        <p>
          Hausevo Score is a trust signal built from your activity on the Hausevo platform. It's not a
          financial credit score — it doesn't pull from your bank account or penalise you for
          loans. It measures rental-specific behaviour:
        </p>
        <ul>
          <li><strong>Payment history</strong> — did you pay rent on time through the platform?</li>
          <li><strong>Clean exits</strong> — did you leave properties in good condition with no disputes?</li>
          <li><strong>Dispute record</strong> — have you had unresolved complaints raised against you?</li>
          <li><strong>Verification tier</strong> — is your identity fully verified?</li>
          <li><strong>Profile completeness</strong> — have you filled in your employment and income details?</li>
        </ul>

        <h2>How landlords use it</h2>
        <p>
          When a tenant applies for a property on Hausevo, the landlord sees their Hausevo Score
          alongside their verified name and profile. A higher score means the tenant has a track
          record of being a good tenant. It doesn't guarantee anything — landlords still make
          their own decisions — but it gives them real signal instead of gut feel.
        </p>

        <h2>Building your score</h2>
        <p>
          If you're new to Hausevo, your score starts at zero. The fastest way to build it is to
          complete Tier 1 verification (NIN + BVN + selfie), fill in your profile, and — if
          you're already renting — ask your current landlord to join Hausevo so your payment
          history can be recorded going forward.
        </p>
        <p>
          Hausevo Score is still early. We're building it carefully, and we'll be transparent about
          how it's calculated as it evolves. The goal is simple: give good tenants a way to prove
          it.
        </p>
      </>
    ),
  },
  {
    slug: "how-to-verify-a-property-before-paying",
    category: "Guide",
    title: "How to Verify a Property Before Paying Anything",
    excerpt:
      "A practical checklist — what to check, what to ask, and the red flags that should make you walk away.",
    date: "May 3, 2026",
    readTime: "6 min read",
    content: (
      <>
        <p>
          Fake listings are a real problem in Lagos. Properties that don't exist, landlords who
          aren't landlords, prices that double once you show up. Here's how to protect yourself
          before you hand over a single naira.
        </p>

        <h2>Before you visit</h2>
        <ul>
          <li>
            <strong>Reverse-search the photos.</strong> Drag the listing images into Google Images.
            If the same photos appear on five different listings with different addresses, walk away.
          </li>
          <li>
            <strong>Verify the address exists.</strong> Drop the address into Google Maps. Does the
            street exist? Does the building look like the photos?
          </li>
          <li>
            <strong>Call the number independently.</strong> Don't use a link or button — type the
            number manually. Scammers sometimes intercept clicks.
          </li>
        </ul>

        <h2>At the viewing</h2>
        <ul>
          <li>
            <strong>Ask to see the title document.</strong> A legitimate landlord will have a
            Certificate of Occupancy (C of O), a Deed of Assignment, or a Governor's Consent.
            If they can't produce any document, that's a red flag.
          </li>
          <li>
            <strong>Confirm who you're dealing with.</strong> Is the person showing you the flat
            the landlord, a caretaker, or an agent? Ask directly. If it's an agent, ask for the
            landlord's contact and call them.
          </li>
          <li>
            <strong>Check the utilities.</strong> Turn on taps. Test the lights. Check if there's
            a prepaid meter or a shared meter. Shared meters are a common source of disputes.
          </li>
          <li>
            <strong>Look at the condition honestly.</strong> Cracks in walls, water stains on
            ceilings, mould in bathrooms — these don't fix themselves. Factor in repair costs.
          </li>
        </ul>

        <h2>Before you pay</h2>
        <ul>
          <li>
            <strong>Get everything in writing.</strong> The rent amount, what's included, the
            payment schedule, and the notice period. A verbal agreement is not an agreement.
          </li>
          <li>
            <strong>Never pay cash without a receipt.</strong> Pay by bank transfer where possible.
            If you must pay cash, get a signed receipt immediately.
          </li>
          <li>
            <strong>Don't pay to "hold" a property.</strong> Legitimate landlords don't ask for
            holding fees before you've signed anything. This is a common scam.
          </li>
        </ul>

        <h2>On Hausevo</h2>
        <p>
          Every listing on Hausevo has been through our verification process — deed documents
          checked, landlord identity confirmed, price verified against market rate. You still
          do your own due diligence, but you're starting from a much safer baseline.
        </p>
      </>
    ),
  },
  {
    slug: "the-scout-programme-explained",
    category: "Product",
    title: "The Scout Programme, Explained",
    excerpt:
      "Earn ₦2,000–₦3,000 per verified listing by submitting properties on behalf of landlords.",
    date: "April 22, 2026",
    readTime: "3 min read",
    content: (
      <>
        <p>
          Not every landlord in Lagos is online. Some are older, some are busy, some just don't
          know Hausevo exists yet. The Scout Programme is how we reach them — through people who
          already know them.
        </p>

        <h2>How it works</h2>
        <p>
          If you know a landlord with a vacant property, you can submit that property on their
          behalf using an Access Key. The Access Key is a unique code the landlord generates
          (or you request on their behalf) that authorises you to submit their listing.
        </p>
        <p>
          Once the listing is submitted and verified by our team — deed checked, price confirmed,
          landlord contacted — you earn a reward of ₦2,000 to ₦3,000 paid directly to your
          registered bank account.
        </p>

        <h2>Who can be a scout?</h2>
        <p>
          Anyone with a verified Hausevo account. You don't need a real estate licence. You don't
          need to be an agent. You just need to know landlords with vacant properties and be
          willing to do the legwork of submitting accurate information.
        </p>

        <h2>What scouts are not</h2>
        <p>
          Scouts are not agents. You don't charge tenants anything. You don't negotiate rent.
          You don't collect fees from landlords. Your only job is to submit accurate listings.
          The reward comes from Hausevo, not from the landlord or tenant.
        </p>

        <h2>Fraud policy</h2>
        <p>
          Submitting false listings — fake properties, inflated prices, properties you don't have
          permission to list — results in immediate account termination and forfeiture of any
          pending rewards. We verify every listing before it goes live, so fraudulent submissions
          don't earn anything anyway.
        </p>
        <p>
          If you're honest and you know the Lagos rental market, this is a straightforward way
          to earn on the side while helping fix a broken system.
        </p>
      </>
    ),
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) return { title: "Not Found — Hausevo" };

  const pageUrl = `https://hausevo.com.ng/blogs/${post.slug}`;
  const ogImage = "https://hausevo.com.ng/hausevofinal.png";

  return {
    title: `${post.title} | Hausevo Blog`,
    description: post.excerpt,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: `${post.title} | Hausevo Blog`,
      description: post.excerpt,
      url: pageUrl,
      siteName: "Hausevo",
      images: [{ url: ogImage, width: 500, height: 500, alt: post.title }],
      locale: "en_NG",
      type: "article",
      publishedTime: new Date(post.date).toISOString(),
      authors: ["Hausevo"],
      tags: ["Nigeria", "Lagos", "property", "renting", post.category],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | Hausevo Blog`,
      description: post.excerpt,
      images: [ogImage],
      creator: "@hausevong",
    },
    keywords: [
      post.title,
      "Lagos property",
      "Nigeria rental",
      "Hausevo blog",
      post.category.toLowerCase(),
      "renting in Nigeria",
    ],
  };
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = POSTS.find((p) => p.slug === slug);

  if (!post) notFound();

  const related = POSTS.filter(
    (p) => p.slug !== post.slug && p.category === post.category
  ).slice(0, 2);

  // Article JSON-LD for Google News / Discover
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    url: `https://hausevo.com.ng/blogs/${post.slug}`,
    image: "https://hausevo.com.ng/hausevofinal.png",
    datePublished: new Date(post.date).toISOString(),
    dateModified: new Date(post.date).toISOString(),
    author: { "@type": "Organization", name: "Hausevo", url: "https://hausevo.com.ng" },
    publisher: {
      "@type": "Organization",
      name: "Hausevo",
      logo: { "@type": "ImageObject", url: "https://hausevo.com.ng/hausevofinal.png" },
    },
    articleSection: post.category,
    keywords: ["Nigeria", "Lagos", "property", "renting", post.category].join(", "),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
    <div className="max-w-3xl mx-auto py-4">
      <BackButton />

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span
            className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
              CATEGORY_COLORS[post.category] ?? "bg-zinc-100 text-zinc-600"
            }`}
          >
            {post.category}
          </span>
          <span className="text-xs text-zinc-400">{post.date}</span>
          <span className="text-xs text-zinc-400">{post.readTime}</span>
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-900 leading-tight mb-4">
          {post.title}
        </h1>
        <p className="text-base text-zinc-500 leading-relaxed">{post.excerpt}</p>
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-200 mb-10" />

      {/* Article body */}
      <div className="prose-shack space-y-5 text-sm text-zinc-600 leading-relaxed
        [&_h2]:text-base [&_h2]:font-extrabold [&_h2]:text-zinc-900 [&_h2]:mt-8 [&_h2]:mb-3
        [&_p]:leading-relaxed
        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2
        [&_li]:leading-relaxed
        [&_strong]:text-zinc-800 [&_strong]:font-bold
      ">
        {post.content}
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-200 mt-12 mb-10" />

      {/* Related posts */}
      {related.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">
            Related
          </p>
          <div className="flex flex-col gap-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/blogs/${r.slug}`}
                className="group bg-white rounded-2xl border border-zinc-200 p-5 flex flex-col gap-2 hover:border-zinc-400 transition-colors"
              >
                <p className="text-sm font-bold text-zinc-900 group-hover:text-zinc-600 transition-colors">
                  {r.title}
                </p>
                <p className="text-xs text-zinc-500 leading-relaxed">{r.excerpt}</p>
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs text-zinc-400">{r.date}</span>
                  <span className="text-xs text-zinc-400">{r.readTime}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Back to blog */}
      <div className="mt-10">
        <Link
          href="/blogs"
          className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          ← Back to Blog
        </Link>
      </div>
    </div>
    </>
  );
}
