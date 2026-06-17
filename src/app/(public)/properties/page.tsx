import { Suspense } from "react";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import PropertiesClient from "./PropertiesClient";
import LocationDetector from "@/app/components/LocationDetector";

const BASE_URL = "https://hausevo.com.ng";

const TYPE_LABELS: Record<string, string> = {
  SELF_CONTAIN: "self-contain",
  FLAT: "flat",
  ROOM: "room",
  DUPLEX: "duplex",
  BUNGALOW: "bungalow",
  MANSION: "mansion",
  MINI_FLAT: "mini flat",
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const lga = params.lga;
  const typeKey = params.listingType;
  const typeLabel = typeKey
    ? (TYPE_LABELS[typeKey] ?? typeKey.toLowerCase())
    : null;

  const locationPart = lga ? ` in ${lga}, Lagos` : " in Lagos & Nigeria";
  const typePart = typeLabel ? `${typeLabel}s` : "houses and apartments";

  const title = `Verified ${typePart} for rent${locationPart} | Hausevo`;
  const description = `Browse verified ${typePart} for rent${locationPart}. No agents, no markups. All listings checked by our team. Rent directly from landlords on Hausevo.`;

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/properties` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/properties`,
      siteName: "Hausevo",
      images: [
        {
          url: `${BASE_URL}/hausevofinal.png`,
          width: 500,
          height: 500,
          alt: "Hausevo",
        },
      ],
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
    keywords: [
      `${typePart} for rent${locationPart}`,
      `rent house in Lagos without agent`,
      `verified properties Nigeria`,
      `affordable flats in Lagos`,
      `self contain Lagos`,
      "Hausevo Nigeria",
      ...(lga ? [`houses for rent in ${lga}`, `apartments ${lga} Lagos`] : []),
    ],
  };
}

const PAGE_SIZE = 12;

async function getProperties(opts: {
  lga?: string;
  listingType?: string;
  propertyType?: string;
  priceRange?: string;
  q?: string;
  page: number;
  ignoreLga?: boolean;
}) {
  const { lga, listingType, propertyType, priceRange, q, page, ignoreLga } =
    opts;
  const skip = (page - 1) * PAGE_SIZE;

  const where: any = { status: "AVAILABLE" };
  if (lga && !ignoreLga) where.lga = lga;
  if (listingType) where.listingType = listingType as any;

  if (propertyType) {
    where.metadata = {
      path: ["propertyType"],
      equals: propertyType,
    };
  }

  if (priceRange) {
    const [minStr, maxStr] = priceRange.split("-");
    const min = Number(minStr);
    const max = Number(maxStr);
    if (!isNaN(min) && !isNaN(max)) {
      where.pricePerYear = {
        gte: min,
        lte: max,
      };
    }
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { address: { contains: q, mode: "insensitive" } },
      { lga: { contains: q, mode: "insensitive" } },
    ];
  }

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take: PAGE_SIZE,
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
    }),
    prisma.property.count({ where }),
  ]);

  return { properties, total, pages: Math.ceil(total / PAGE_SIZE) };
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const session = await auth();
  const params = await searchParams;

  const page = Math.max(1, Number(params.page ?? 1));

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

  const { properties, total, pages } = await getProperties({
    lga: userLga,
    listingType: params.listingType,
    propertyType: params.propertyType,
    priceRange: params.priceRange,
    q: params.q,
    page,
  });

  let savedPropertyIds: string[] = [];
  if (session?.user?.id) {
    const saved = await prisma.savedProperty.findMany({
      where: { tenantId: session.user.id },
      select: { propertyId: true },
    });
    savedPropertyIds = saved.map((s) => s.propertyId);
  }

  // If location-filtered results fill less than a full page AND it's auto-detected
  // (not a manual search), show all properties so the page isn't sparse.
  // We still keep the heading context ("near Kosofe") but show everything.
  const isAutoLocation =
    locationSource === "geo" || locationSource === "wishlist";
  const shouldFallback =
    isAutoLocation &&
    total < PAGE_SIZE &&
    !params.listingType &&
    !params.propertyType &&
    !params.priceRange &&
    !params.q;

  const finalResult = shouldFallback
    ? await getProperties({
        page,
        listingType: params.listingType,
        propertyType: params.propertyType,
        priceRange: params.priceRange,
        q: params.q,
        ignoreLga: true,
      })
    : { properties, total, pages };

  return (
    <PropertiesClient
      initialProperties={finalResult.properties as any}
      totalProperties={finalResult.total}
      totalPages={finalResult.pages}
      currentPage={page}
      userLga={userLga}
      userState={userState}
      locationSource={locationSource}
      session={session}
      searchParams={params}
      savedPropertyIds={savedPropertyIds}
    >
      <Suspense fallback={null}>
        <LocationDetector isLoggedIn={!!session?.user} />
      </Suspense>
    </PropertiesClient>
  );
}
