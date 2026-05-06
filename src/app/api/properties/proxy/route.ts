import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  POST /api/properties/proxy
  Submit a property on behalf of a landlord who is not on the platform.
  Used by scouts, family members, or property managers.
  
  Requires: active session + LANDLORD role (or valid AccessKey)
  
  Body: {
    title, address, lga, state?, latitude?, longitude?,
    pricePerYear, totalPackage, rentFrequency?, metadata?,
    landlordName, landlordPhone, landlordEmail?,
    accessKeyId? (if scout submission)
  }
*/
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true, fullName: true, email: true },
  });

  if (!user?.roles.includes("LANDLORD")) {
    return NextResponse.json(
      { error: "Only users with LANDLORD role can submit properties." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const {
    title, address, lga,
    state = "Lagos",
    latitude, longitude,
    pricePerYear, totalPackage,
    rentFrequency = "ANNUALLY",
    metadata,
    // Landlord info (required for proxy submission)
    landlordName,
    landlordPhone,
    landlordEmail,
    // Scout submission
    accessKeyId,
    // Building / Off-plan
    isOffPlan = false,
    developmentStage = "FINISHED",
  } = body;

  // Validation
  if (!title || !address || !lga || !pricePerYear || !totalPackage) {
    return NextResponse.json(
      { error: "title, address, lga, pricePerYear and totalPackage are required." },
      { status: 400 }
    );
  }

  if (!landlordName || !landlordPhone) {
    return NextResponse.json(
      { error: "landlordName and landlordPhone are required for proxy submission." },
      { status: 400 }
    );
  }

  // Validate phone number format (Nigerian)
  const phoneRegex = /^\+?234[0-9]{10}$/;
  if (!phoneRegex.test(landlordPhone.replace(/\s/g, ""))) {
    return NextResponse.json(
      { error: "Invalid Nigerian phone number format. Use +234XXXXXXXXXX" },
      { status: 400 }
    );
  }

  // If accessKeyId provided, validate it
  let accessKey = null;
  if (accessKeyId) {
    accessKey = await prisma.accessKey.findUnique({
      where: { id: accessKeyId },
      select: { isUsed: true, expiresAt: true, issuerId: true },
    });

    if (!accessKey) {
      return NextResponse.json({ error: "Invalid access key." }, { status: 400 });
    }

    if (accessKey.isUsed) {
      return NextResponse.json({ error: "Access key already used." }, { status: 409 });
    }

    if (new Date() > accessKey.expiresAt) {
      return NextResponse.json({ error: "Access key expired." }, { status: 410 });
    }
  }

  // Create temporary landlord account (unverified)
  // Check if landlord already exists by phone
  let landlord = await prisma.user.findFirst({
    where: { phoneNumber: landlordPhone },
  });

  if (!landlord) {
    // Create placeholder account
    landlord = await prisma.user.create({
      data: {
        email: landlordEmail || `temp-${Date.now()}@shack.placeholder`,
        fullName: landlordName,
        phoneNumber: landlordPhone,
        roles: ["LANDLORD"],
        isVerified: false,
        verificationTier: 0,
      },
    });
  }

  // Create property
  const property = await prisma.property.create({
    data: {
      title, address, lga, state,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      pricePerYear: Number(pricePerYear),
      totalPackage: Number(totalPackage),
      rentFrequency,
      metadata: metadata ?? undefined,
      landlordId: landlord.id,
      // Proxy submission fields
      isProxySubmission: true,
      proxySubmitterId: session.user.id,
      landlordName,
      landlordPhone,
      landlordEmail: landlordEmail ?? null,
      landlordContacted: false,
      // Scout submission
      accessKeyId: accessKeyId ?? null,
      // Building / Off-plan
      isOffPlan: Boolean(isOffPlan),
      developmentStage: developmentStage as any,
    },
    select: {
      id: true, title: true, address: true, lga: true, state: true,
      pricePerYear: true, totalPackage: true, rentFrequency: true,
      status: true, healthScore: true,
      isProxySubmission: true,
      landlordName: true,
      landlordPhone: true,
      createdAt: true,
    },
  });

  // Mark access key as used if provided
  if (accessKeyId && accessKey) {
    await prisma.accessKey.update({
      where: { id: accessKeyId },
      data: {
        isUsed: true,
        redeemedBy: session.user.id,
        redeemedAt: new Date(),
      },
    });

    // Create scout reward (pending verification)
    await prisma.scoutReward.create({
      data: {
        accessKeyId,
        redeemerId: session.user.id,
        propertyId: property.id,
        amount: 0, // Will be set by admin after verification
        status: "PENDING",
      },
    });
  }

  await Promise.all([
    audit({
      actorId: session.user.id,
      action: "CREATE",
      entity: "Property",
      entityId: property.id,
      after: {
        title, address, lga, state,
        pricePerYear, totalPackage,
        isProxySubmission: true,
        proxySubmitterId: session.user.id,
        landlordPhone,
      },
      req,
    }),
    notify(
      session.user.id,
      "Property submitted for verification",
      `Your proxy submission "${title}" is pending admin verification. The landlord will be contacted to confirm details.`,
      "SYSTEM",
      { propertyId: property.id }
    ),
  ]);

  return NextResponse.json({
    message: "Property submitted successfully. Admin will verify with landlord.",
    property,
    nextSteps: [
      "Admin will call landlord to verify ownership and price",
      "Landlord must upload deed/C of O for verification",
      "Property will be approved once verified",
    ],
  }, { status: 201 });
}
