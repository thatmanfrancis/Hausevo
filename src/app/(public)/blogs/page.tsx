import type { Metadata } from "next";
import Link from "next/link";
import NewsGrid from "./NewsGrid";
import type { NewsItem } from "./NewsGrid";

export const metadata: Metadata = {
  title: "Blog — Lagos Property Market Insights | Hausevo",
  description:
    "Market data, product updates, and practical guides for tenants and landlords navigating the Nigerian property market. No agents. No guesswork.",
  alternates: { canonical: "https://hausevo.com.ng/blogs" },
  openGraph: {
    title: "Blog — Lagos Property Market Insights | Hausevo",
    description:
      "Insights on renting in Nigeria, the Lagos property market, and how Hausevo is changing the game for tenants and landlords.",
    url: "https://hausevo.com.ng/blogs",
    siteName: "Hausevo",
    images: [{ url: "https://hausevo.com.ng/hausevofinal.png", width: 500, height: 500, alt: "Hausevo" }],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — Lagos Property Market Insights | Hausevo",
    description: "Market data, guides, and product updates for tenants and landlords in Nigeria.",
    images: ["https://hausevo.com.ng/hausevofinal.png"],
    creator: "@hausevong",
  },
  keywords: [
    "Lagos property market",
    "Nigeria rental news",
    "renting in Lagos guide",
    "Hausevo blog",
    "Nigerian real estate insights",
    "landlord tenant Nigeria",
    "agent fees Lagos",
    "property verification Nigeria",
  ],
};

// ── RSS fetch (server-side, no API key needed) ─────────────────────────────

async function fetchHousingNews(): Promise<NewsItem[]> {
  const feeds = [
    {
      url: "https://businessday.ng/real-estate/feed/",
      source: "BusinessDay NG",
    },
  ];

  const results: NewsItem[] = [];

  await Promise.allSettled(
    feeds.map(async ({ url, source }) => {
      try {
        const res = await fetch(url, {
          next: { revalidate: 3600 }, // cache for 1 hour
          signal: AbortSignal.timeout(8000), // never hang the page
          headers: { "User-Agent": "Hausevo/1.0 (+https://hausevo.com.ng)" },
        });
        if (!res.ok) return;
        const xml = await res.text();

        // Parse <item> blocks from RSS
        const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
        for (const item of items.slice(0, 8)) {
          const title = stripTags(extract(item, "title"));
          const link = extract(item, "link") || extract(item, "guid");
          const pubDate = extract(item, "pubDate");
          const description = stripTags(
            extract(item, "description")
          ).slice(0, 180);

          // Skip feed-level titles (no link or duplicate channel title)
          if (title && link && link.startsWith("http")) {
            results.push({ title, link, pubDate, description, source });
          }
        }
      } catch {
        // silently skip — page renders fine without news
      }
    })
  );

  // Deduplicate by title, sort newest first
  const seen = new Set<string>();
  return results
    .filter((item) => {
      if (seen.has(item.title)) return false;
      seen.add(item.title);
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime()
    )
    .slice(0, 8);
}

function extract(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return (match?.[1] ?? match?.[2] ?? "").trim();
}

function stripTags(str: string): string {
  return str.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&#\d+;/g, "").trim();
}

// ── Static editorial posts ─────────────────────────────────────────────────

const EDITORIAL_POSTS = [
  {
    slug: "why-agent-fees-are-killing-lagos-renters",
    category: "Market",
    title: "Why Agent Fees Are Killing Lagos Renters",
    excerpt:
      "Tenants in Lagos pay 10–15% of annual rent to agents who add zero value. Here's the data, and why it has to stop.",
    date: "May 12, 2026",
    readTime: "8 min read",
    featured: true,
  },
  {
    slug: "what-is-shackscore",
    category: "Product",
    title: "What Is Hausevo Score and Why It Matters",
    excerpt:
      "Nigeria's first rental credit score. How it's built, what it measures, and why landlords are already using it.",
    date: "May 8, 2026",
    readTime: "4 min read",
    featured: false,
  },
  {
    slug: "how-to-verify-a-property-before-paying",
    category: "Guide",
    title: "How to Verify a Property Before Paying Anything",
    excerpt:
      "A practical checklist — what to check, what to ask, and the red flags that should make you walk away.",
    date: "May 3, 2026",
    readTime: "6 min read",
    featured: false,
  },
  {
    slug: "the-scout-programme-explained",
    category: "Product",
    title: "The Scout Programme, Explained",
    excerpt:
      "Earn ₦2,000–₦3,000 per verified listing by submitting properties on behalf of landlords.",
    date: "April 22, 2026",
    readTime: "3 min read",
    featured: false,
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Market: "bg-amber-50 text-amber-700",
  Product: "bg-blue-50 text-blue-700",
  Guide: "bg-emerald-50 text-emerald-700",
};

function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-widest w-fit px-2.5 py-0.5 rounded-full ${
        CATEGORY_COLORS[category] ?? "bg-zinc-100 text-zinc-600"
      }`}
    >
      {category}
    </span>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function BlogsPage() {
  const featured = EDITORIAL_POSTS.find((p) => p.featured)!;
  const editorialRest = EDITORIAL_POSTS.filter((p) => !p.featured);
  const news = await fetchHousingNews();

  return (
    <div className="flex flex-col gap-16 py-4">

      {/* Hero */}
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
          Blog
        </p>
        <h1 className="text-4xl font-extrabold text-zinc-900 leading-tight mb-4">
          Insights on renting in Nigeria
        </h1>
        <p className="text-lg text-zinc-500 leading-relaxed">
          Market data, product updates, and practical guides for tenants and
          landlords navigating the Nigerian property market.
        </p>
      </div>

      {/* Featured post */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">
          Featured
        </p>
        <Link
          href={`/blogs/${featured.slug}`}
          className="group block bg-zinc-900 rounded-2xl p-8 md:p-10 hover:bg-zinc-800 transition-colors"
        >
          <div className="flex items-center gap-3 mb-5">
            <CategoryBadge category={featured.category} />
            <span className="text-xs text-zinc-500">{featured.date}</span>
            <span className="text-xs text-zinc-600">{featured.readTime}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight mb-4 max-w-2xl group-hover:text-zinc-200 transition-colors">
            {featured.title}
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-xl mb-6">
            {featured.excerpt}
          </p>
          <span className="text-sm font-bold text-white group-hover:translate-x-1 transition-transform inline-block">
            Read article →
          </span>
        </Link>
      </div>

      {/* Editorial posts */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6">
          From Hausevo
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {editorialRest.map((post) => (
            <Link
              key={post.slug}
              href={`/blogs/${post.slug}`}
              className="group bg-white rounded-2xl border border-zinc-200 p-6 flex flex-col gap-4 hover:border-zinc-400 transition-colors"
            >
              <CategoryBadge category={post.category} />
              <div className="flex-1">
                <h3 className="text-sm font-extrabold text-zinc-900 leading-snug mb-2 group-hover:text-zinc-600 transition-colors">
                  {post.title}
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                <span className="text-xs text-zinc-400">{post.date}</span>
                <span className="text-xs font-bold text-zinc-400">
                  {post.readTime}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Live housing news */}
      <NewsGrid news={news} />

      {/* Newsletter CTA */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-8 md:p-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <p className="text-lg font-extrabold text-zinc-900 mb-1">
            Stay in the loop
          </p>
          <p className="text-sm text-zinc-500 max-w-md">
            Get new articles, market data, and product updates delivered to
            your inbox. No spam.
          </p>
        </div>
        <Link
          href="/auth/register"
          className="rounded-full bg-zinc-900 text-white px-6 py-3 text-sm font-bold hover:bg-zinc-700 transition-colors whitespace-nowrap self-start sm:self-auto shrink-0"
        >
          Create an account →
        </Link>
      </div>

    </div>
  );
}
