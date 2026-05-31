import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

/*
  POST /api/onboarding
  Saves onboarding data and marks the user as onboarded.

  Body: {
    role?: string                    // confirm/update role
    lga?: string                     // preferred LGA (tenant)
    maxBudget?: number               // max rent budget (tenant)
    minBedrooms?: number             // min bedrooms (tenant)
    propertyTypes?: string[]         // preferred property types (tenant)
    nin?: string                     // optional: start NIN verification
  }
*/
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await req.json();
  const {
    role,
    lga,
    maxBudget,
    minBedrooms,
    propertyTypes,
    vaultDocUrl,
    // Employment / profession profile
    employmentStatus,
    profession,
    employerName,
    monthlyIncome,
    // Emergency contact / guarantor
    emergencyContact,
  } = body;

  const validRoles = ["TENANT", "LANDLORD", "ARTISAN"];

  // Update role if provided and valid
  const roleUpdate = role && validRoles.includes(role)
    ? { roles: [role] as any }
    : {};

  // Build the user update payload
  const userUpdateData: Record<string, unknown> = {
    ...roleUpdate,
    onboardingCompleted: true,
    ...(employmentStatus && { employmentStatus }),
    ...(profession && { profession }),
    ...(employerName && { employerName }),
    ...(monthlyIncome && { monthlyIncome }),
  };

  // Mark onboarding complete + save profile fields
  await prisma.user.update({
    where: { id: userId },
    data: userUpdateData,
  });

  // Create vault item for identity if provided
  if (vaultDocUrl) {
    await prisma.vaultItem.create({
      data: {
        title: "Identity Document (Onboarding)",
        fileUrl: vaultDocUrl,
        category: "IDENTITY",
        ownerId: userId,
      },
    });
  }

  // Save wishlist for tenants
  if (lga || maxBudget || minBedrooms) {
    await prisma.propertyWishlist.upsert({
      where: { tenantId: userId },
      update: {
        ...(lga && { lga }),
        ...(maxBudget && { maxBudget: Number(maxBudget) }),
        ...(minBedrooms && { minBedrooms: Number(minBedrooms) }),
        ...(propertyTypes && { requirements: { propertyTypes } }),
      },
      create: {
        tenantId: userId,
        lga: lga ?? null,
        maxBudget: maxBudget ? Number(maxBudget) : null,
        minBedrooms: minBedrooms ? Number(minBedrooms) : null,
        requirements: propertyTypes ? { propertyTypes } : undefined,
      },
    });
  }

  // Create emergency contact / guarantor if provided
  if (
    emergencyContact &&
    emergencyContact.fullName?.trim() &&
    emergencyContact.phone?.trim()
  ) {
    // Delete any existing emergency contact first to prevent duplicates on re-run
    await prisma.guarantor.deleteMany({
      where: { userId, isEmergency: true },
    });
    await prisma.guarantor.create({
      data: {
        userId,
        applicationId: null,
        fullName: emergencyContact.fullName.trim(),
        email: emergencyContact.email?.trim().toLowerCase() ?? "",
        phone: emergencyContact.phone.trim(),
        relationship: emergencyContact.relationship ?? "OTHER",
        isEmergency: true,
      },
    });
  }

  return NextResponse.json({ message: "Onboarding complete.", onboardingCompleted: true });
}

/*
  GET /api/onboarding
  Returns the current user's onboarding status.
*/
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      onboardingCompleted: true,
      roles: true,
      verificationTier: true,
      wishlist: { select: { lga: true, maxBudget: true, minBedrooms: true, requirements: true } },
    },
  });

  return NextResponse.json({ user });
}
