import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://shack.ng';

  // 1. Static routes
  const staticRoutes = [
    '',
    '/about',
    '/properties',
    '/faq',
    '/contact',
    '/terms',
    '/privacy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // 2. Property routes
  const properties = await prisma.property.findMany({
    where: { status: 'AVAILABLE' },
    select: { id: true, updatedAt: true },
  });

  const propertyRoutes = properties.map((p) => ({
    url: `${baseUrl}/properties/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...propertyRoutes];
}
