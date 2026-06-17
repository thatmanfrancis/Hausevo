import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

const BASE_URL = 'https://hausevo.com.ng';

// Static editorial blog posts (sync with blogs/page.tsx)
const BLOG_SLUGS = [
  'why-agent-fees-are-killing-lagos-renters',
  'what-is-shackscore',
  'how-to-verify-a-property-before-paying',
  'the-scout-programme-explained',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Static routes — ordered by crawl priority
  const staticRoutes = [
    { route: '', priority: 1.0, freq: 'daily' },
    { route: '/properties', priority: 0.95, freq: 'daily' },
    { route: '/blogs', priority: 0.85, freq: 'weekly' },
    { route: '/about', priority: 0.8, freq: 'monthly' },
    { route: '/faq', priority: 0.8, freq: 'monthly' },
    { route: '/contact', priority: 0.75, freq: 'monthly' },
    { route: '/team', priority: 0.65, freq: 'monthly' },
    { route: '/careers', priority: 0.65, freq: 'monthly' },
    { route: '/waitlist', priority: 0.6, freq: 'monthly' },
    { route: '/terms', priority: 0.4, freq: 'yearly' },
    { route: '/privacy', priority: 0.4, freq: 'yearly' },
    { route: '/cookies', priority: 0.3, freq: 'yearly' },
    { route: '/guarantor', priority: 0.5, freq: 'monthly' },
  ].map(({ route, priority, freq }) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: freq as MetadataRoute.Sitemap[number]['changeFrequency'],
    priority,
  }));

  // 2. Blog post routes
  const blogRoutes = BLOG_SLUGS.map((slug) => ({
    url: `${BASE_URL}/blogs/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // 3. Live property listing routes (only AVAILABLE)
  const properties = await prisma.property.findMany({
    where: { status: 'AVAILABLE' },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  });

  const propertyRoutes = properties.map((p) => ({
    url: `${BASE_URL}/properties/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.65,
  }));

  return [...staticRoutes, ...blogRoutes, ...propertyRoutes];
}
