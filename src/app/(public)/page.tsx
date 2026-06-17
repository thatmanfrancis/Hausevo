import { Suspense } from "react";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import PropertiesClient from "./properties/PropertiesClient";
import LocationDetector from "@/app/components/LocationDetector";

const BASE_URL = "https://hausevo.com.ng";

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }
): Promise<Metadata> {
  const params = await searchParams;
  const lga = params.lga;

  const locationNote = lga ? ` near ${lga}` : " in Lagos & Nigeria";
  const title = `Hausevo — Verified Houses for Rent${locationNote}`;
  const description = `Find verified houses for rent${locationNote}. No agents, no hidden markups. Rent self-contain, flats, and apartments directly from landlords. All listings checked by Hausevo.`;

  return {
    title,
    description,
    alternates: { canonical: BASE_URL },
    openGraph: {
      title,
      description,
      url: BASE_URL,
      siteName: "Hausevo",
      images: [{ url: `${BASE_URL}/hausevofinal.png`, width: 500, height: 500, alt: "Hausevo" }],
      locale: "en_NG",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${BASE_URL}/hausevofinal.png`],
      creator: "@hausevong",
    },
  };
}


async function getProperties(lga?: string) {
  const where: any = { status: "AVAILABLE" };
  if (lga) where.lga = lga;

  return prisma.property.findMany({
    where,
    take: 8,
    orderBy: [{ isBoosted: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      address: true,
      lga: true,
      state: true,
      listingType: true,
      pricePerYear: true,
      totalPackage: true,
      metadata: true,
      isBoosted: true,
      deedVerified: true,
      priceVerified: true,
      images: {
        where: { isPrimary: true },
        select: { url: true },
        take: 1,
      },
      landlord: {
        select: { id: true, fullName: true, verificationTier: true },
      },
      createdAt: true,
    },
  });
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const session = await auth();
  const params = await searchParams;

  let userLga: string | undefined = params.lga;
  let userState: string | undefined = params.state;
  let locationSource: "search" | "wishlist" | "geo" | "all" = "all";

  if (params.locationSource === "geo" && userLga) {
    locationSource = "geo";
  } else if (userLga) {
    locationSource = "search";
  } else if (session?.user?.id) {
    const wishlist = await prisma.propertyWishlist.findUnique({
      where: { tenantId: session.user.id },
      select: { lga: true },
    });
    if (wishlist?.lga) {
      userLga = wishlist.lga;
      userState = "Lagos";
      locationSource = "wishlist";
    }
  }

  const properties = await getProperties(userLga);
  const allProperties =
    properties.length < 4 && userLga
      ? await getProperties(undefined)
      : properties;

  return (
    <PropertiesClient
      initialProperties={allProperties as any}
      userLga={userLga}
      userState={userState}
      locationSource={locationSource}
      session={session}
      searchParams={params}
      isHomePage
    >
      <Suspense fallback={null}>
        <LocationDetector isLoggedIn={!!session?.user} redirectTo="/" />
      </Suspense>
    </PropertiesClient>
  );
}
