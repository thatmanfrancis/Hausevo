import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  GET /api/properties
  Browse available properties with optional filters.
  Public — no auth required.

  Query params: lga, minPrice, maxPrice, state, listingType, propertyType, page, limit
*/
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const lga = searchParams.get("lga") ?? undefined;
  const state = searchParams.get("state") ?? undefined;
  const listingType = searchParams.get("listingType") ?? undefined; // RENT, SALE, LEASE, SHORTLET
  const propertyType = searchParams.get("propertyType") ?? undefined; // from metadata
  const minPrice = searchParams.get("minPrice")
    ? Number(searchParams.get("minPrice"))
    : undefined;
  const maxPrice = searchParams.get("maxPrice")
    ? Number(searchParams.get("maxPrice"))
    : undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(
    50,
    Math.max(1, Number(searchParams.get("limit") ?? 20)),
  );
  const skip = (page - 1) * limit;

  const where = {
    status: "AVAILABLE" as const,
    ...(lga && { lga }),
    ...(state && { state }),
    ...(listingType && { listingType: listingType as any }),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? {
          pricePerYear: {
            ...(minPrice !== undefined && { gte: minPrice }),
            ...(maxPrice !== undefined && { lte: maxPrice }),
          },
        }
      : {}),
  };

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        address: true,
        lga: true,
        state: true,
        listingType: true,
        latitude: true,
        longitude: true,
        pricePerYear: true,
        totalPackage: true,
        rentFrequency: true,
        healthScore: true,
        status: true,
        metadata: true,
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

  // Filter by propertyType in metadata if specified
  let filteredProperties = properties;
  if (propertyType) {
    filteredProperties = properties.filter((p: any) => {
      const meta = p.metadata as any;
      return meta?.propertyType === propertyType;
    });
  }

  return NextResponse.json({
    properties: filteredProperties,
    pagination: {
      total: propertyType ? filteredProperties.length : total,
      page,
      limit,
      pages: Math.ceil(
        (propertyType ? filteredProperties.length : total) / limit,
      ),
    },
  });
}

/*
  POST /api/properties
  Landlord creates a new property listing.
  Requires: active session + LANDLORD role

  Body: { 
    title, address, lga, state?, 
    listingType?, // RENT (default), SALE, LEASE, SHORTLET
    latitude?, longitude?,
    pricePerYear, totalPackage, rentFrequency?, 
    metadata? // { propertyType: "SELF_CONTAIN" | "BUNGALOW" | "DUPLEX" | etc, bedrooms, bathrooms, ... }
  }
*/
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  });

  if (!user?.roles.includes("LANDLORD")) {
    return NextResponse.json(
      { error: "Only landlords can create property listings." },
      { status: 403 },
    );
  }

  const body = await req.json();
  const {
    title,
    address,
    lga,
    state = "Lagos",
    listingType = "RENT",
    latitude,
    longitude,
    pricePerYear,
    totalPackage,
    rentFrequency = "ANNUALLY",
    isOffPlan = false,
    developmentStage = "FINISHED",
    vaultDocId,
    metadata,
  } = body;

  if (!title || !address || !lga || !pricePerYear || !totalPackage) {
    return NextResponse.json(
      {
        error:
          "title, address, lga, pricePerYear and totalPackage are required.",
      },
      { status: 400 },
    );
  }

  // Validate listingType
  const validListingTypes = ["RENT", "SALE", "LEASE", "SHORTLET"];
  if (!validListingTypes.includes(listingType)) {
    return NextResponse.json(
      { error: `listingType must be one of: ${validListingTypes.join(", ")}` },
      { status: 400 },
    );
  }

  const property = await prisma.$transaction(async (tx: any) => {
    const p = await tx.property.create({
      data: {
        title,
        address,
        lga,
        state,
        listingType,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        pricePerYear: Number(pricePerYear),
        totalPackage: Number(totalPackage),
        rentFrequency,
        isOffPlan: Boolean(isOffPlan),
        developmentStage: developmentStage as any,
        metadata: metadata ?? undefined,
        landlord: { connect: { id: session.user!.id } },
      },
    });

    // Handle vault document connection
    if (vaultDocId && vaultDocId !== "new") {
      await tx.vaultItem.update({
        where: { id: vaultDocId },
        data: { propertyId: p.id },
      });
    }

    // Handle image uploads if present in metadata
    if (metadata?.images && Array.isArray(metadata.images)) {
      await tx.propertyImage.createMany({
        data: metadata.images.map((url: string, index: number) => ({
          url,
          propertyId: p.id,
          isPrimary: index === 0,
          order: index,
        })),
      });
    }

    return p;
  });

  await Promise.all([
    audit({
      actorId: session.user.id,
      action: "CREATE",
      entity: "Property",
      entityId: property.id,
      after: {
        title,
        address,
        lga,
        state,
        listingType,
        pricePerYear,
        totalPackage,
        status: "PENDING",
      },
      req,
    }),
    notify(
      session.user.id,
      "Listing created",
      `Your property "${title}" has been submitted and is pending review.`,
      "SYSTEM",
      { propertyId: property.id },
    ),
  ]);

  return NextResponse.json({ property }, { status: 201 });
}
