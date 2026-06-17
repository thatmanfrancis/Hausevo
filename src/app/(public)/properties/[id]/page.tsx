import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import PropertyDetailClient from "./PropertyDetailClient";

const BASE_URL = "https://hausevo.com.ng";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatPrice(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

function listingTypeLabel(t: string) {
  const map: Record<string, string> = {
    SELF_CONTAIN: "self-contain",
    FLAT: "flat",
    ROOM: "room",
    DUPLEX: "duplex",
    BUNGALOW: "bungalow",
    MANSION: "mansion",
    MINI_FLAT: "mini flat",
  };
  return map[t] ?? t.toLowerCase().replace(/_/g, " ");
}

// ── Dynamic metadata ───────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
    select: {
      title: true,
      address: true,
      lga: true,
      state: true,
      listingType: true,
      pricePerYear: true,
      totalPackage: true,
      deedVerified: true,
      priceVerified: true,
      updatedAt: true,
      images: {
        where: { isPrimary: true },
        select: { url: true },
        take: 1,
      },
    },
  });

  if (!property) return {};

  const type = listingTypeLabel(property.listingType);
  const location = [property.lga, property.state].filter(Boolean).join(", ");
  const price = formatPrice(property.pricePerYear);
  const verified = property.deedVerified && property.priceVerified;

  const title = `${property.title} — ${type} for rent in ${location} | Hausevo`;
  const description = `${verified ? "Verified" : ""} ${type} for rent in ${location}. ${price}/year${property.totalPackage ? ` — ₦${property.totalPackage.toLocaleString("en-NG")} total package` : ""}. ${property.address}. No agents. Browse on Hausevo.`;
  const pageUrl = `${BASE_URL}/properties/${id}`;
  const ogImage = property.images[0]?.url ?? `${BASE_URL}/hausevofinal.png`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "Hausevo",
      images: [{ url: ogImage, width: 1200, height: 630, alt: property.title }],
      locale: "en_NG",
      type: "website",
      // modifiedTime: property.updatedAt.toISOString(),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
      creator: "@hausevong",
    },
    keywords: [
      `${type} for rent in ${property.lga}`,
      `houses for rent in ${property.lga}`,
      `rent ${type} ${property.lga} Lagos`,
      `verified ${type} ${location}`,
      `${type} ${location} no agent`,
      "Hausevo Nigeria",
      `rent in ${property.state}`,
    ],
  };
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const [property, similarProperties] = await Promise.all([
    prisma.property.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        address: true,
        lga: true,
        state: true,
        listingType: true,
        pricePerYear: true,
        totalPackage: true,
        rentFrequency: true,
        metadata: true,
        isBoosted: true,
        deedVerified: true,
        priceVerified: true,
        healthScore: true,
        images: {
          select: { id: true, url: true, isPrimary: true, order: true },
          orderBy: { order: "asc" },
        },
        landlord: {
          select: {
            id: true,
            fullName: true,
            verificationTier: true,
            shackScore: { select: { score: true } },
          },
        },
        reviews: {
          select: {
            rating: true,
            comment: true,
            createdAt: true,
            reviewer: { select: { id: true, fullName: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: { select: { savedBy: true, waitlist: true } },
        status: true,
        createdAt: true,
      },
    }),
    // Will be populated after we know the property's lga and listingType
    Promise.resolve(null),
  ]);

  if (!property) notFound();

  // Fetch similar properties in the same LGA and listing type, excluding this one
  const similar = await prisma.property.findMany({
    where: {
      id: { not: id },
      lga: property.lga,
      listingType: property.listingType,
      status: "AVAILABLE",
    },
    take: 3,
    orderBy: [{ isBoosted: "desc" }, { healthScore: "desc" }],
    select: {
      id: true,
      title: true,
      address: true,
      lga: true,
      listingType: true,
      pricePerYear: true,
      metadata: true,
      deedVerified: true,
      images: {
        where: { isPrimary: true },
        select: { url: true },
        take: 1,
      },
    },
  });

  void similarProperties;

  // JSON-LD structured data for Google
  const type = listingTypeLabel(property.listingType ?? "");
  const location = [property.lga, property.state].filter(Boolean).join(", ");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: `${type} for rent in ${location}. No agent fees. Verified on Hausevo.`,
    url: `${BASE_URL}/properties/${id}`,
    image:
      property.images.find((i) => i.isPrimary)?.url ??
      `${BASE_URL}/hausevofinal.png`,
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address,
      addressLocality: property.lga,
      addressRegion: property.state,
      addressCountry: "NG",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "NGN",
      price: property.pricePerYear,
      availability: "https://schema.org/InStock",
    },
    provider: {
      "@type": "Organization",
      name: "Hausevo",
      url: BASE_URL,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PropertyDetailClient
        property={property as any}
        session={session}
        similarProperties={similar as any[]}
      />
    </>
  );
}
