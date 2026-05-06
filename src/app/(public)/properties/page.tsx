import { Suspense } from "react";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import PropertiesClient from "./PropertiesClient";
import LocationDetector from "@/app/components/LocationDetector";

const PAGE_SIZE = 12;

async function getProperties(opts: {
  lga?: string;
  listingType?: string;
  page: number;
  ignoreLga?: boolean;
}) {
  const { lga, listingType, page, ignoreLga } = opts;
  const skip = (page - 1) * PAGE_SIZE;

  const where: any = { status: "AVAILABLE" };
  if (lga && !ignoreLga) where.lga = lga;
  if (listingType) where.listingType = listingType;

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
    page,
  });

  // If location-filtered results fill less than a full page AND it's auto-detected
  // (not a manual search), show all properties so the page isn't sparse.
  // We still keep the heading context ("near Kosofe") but show everything.
  const isAutoLocation = locationSource === "geo" || locationSource === "wishlist";
  const shouldFallback = isAutoLocation && total < PAGE_SIZE && !params.listingType;

  const finalResult = shouldFallback
    ? await getProperties({ page, listingType: params.listingType, ignoreLga: true })
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
    >
      <Suspense fallback={null}>
        <LocationDetector isLoggedIn={!!session?.user} />
      </Suspense>
    </PropertiesClient>
  );
}
