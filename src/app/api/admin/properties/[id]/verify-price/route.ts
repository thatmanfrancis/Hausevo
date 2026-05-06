import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  PATCH /api/admin/properties/:id/verify-price
  Admin verifies property price with landlord (anti-agent markup).
  Admin calls landlord directly to confirm the listed price is correct.
  
  Requires: active session + ADMIN role
  
  Body: {
    landlordConfirmed: boolean,
    confirmedPrice: number,
    landlordContacted: boolean,
    notes?: string,
    priceAdjustmentReason?: string (if price changed)
  }
*/
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  });

  if (!user?.roles.includes("ADMIN")) {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 }
    );
  }

  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
    select: {
      landlordId: true,
      proxySubmitterId: true,
      title: true,
      pricePerYear: true,
      totalPackage: true,
      priceVerified: true,
      landlordConfirmed: true,
      landlordPhone: true,
      isProxySubmission: true,
    },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  const body = await req.json();
  const {
    landlordConfirmed,
    confirmedPrice,
    landlordContacted,
    notes,
    priceAdjustmentReason,
  } = body;

  if (typeof landlordConfirmed !== "boolean" || typeof confirmedPrice !== "number") {
    return NextResponse.json(
      { error: "landlordConfirmed (boolean) and confirmedPrice (number) are required." },
      { status: 400 }
    );
  }

  const before = {
    pricePerYear: property.pricePerYear,
    priceVerified: property.priceVerified,
    landlordConfirmed: property.landlordConfirmed,
  };

  // Check for price inflation (more than 20% difference)
  const priceDifference = Math.abs(confirmedPrice - property.pricePerYear);
  const percentageDiff = (priceDifference / property.pricePerYear) * 100;
  const isPriceInflated = percentageDiff > 20;

  // Update property with confirmed price
  const updated = await prisma.property.update({
    where: { id },
    data: {
      pricePerYear: confirmedPrice,
      totalPackage: confirmedPrice * 1.5, // Recalculate total package (rent + legal + caution)
      priceVerified: true,
      priceVerifiedAt: new Date(),
      landlordConfirmed,
      landlordContacted: landlordContacted ?? true,
      metadata: {
        ...(property as any).metadata,
        priceVerification: {
          originalPrice: property.pricePerYear,
          confirmedPrice,
          priceDifference,
          percentageDiff: Math.round(percentageDiff * 100) / 100,
          isPriceInflated,
          verifiedAt: new Date().toISOString(),
          verifiedBy: session.user.id,
          notes: notes ?? null,
          priceAdjustmentReason: priceAdjustmentReason ?? null,
        },
      },
    },
    select: {
      id: true,
      title: true,
      pricePerYear: true,
      totalPackage: true,
      priceVerified: true,
      landlordConfirmed: true,
      status: true,
    },
  });

  // If price was inflated significantly, flag the proxy submitter
  if (isPriceInflated && property.isProxySubmission && property.proxySubmitterId) {
    await audit({
      actorId: session.user.id,
      action: "FLAG",
      entity: "User",
      entityId: property.proxySubmitterId,
      after: {
        reason: "Price inflation detected",
        propertyId: id,
        submittedPrice: property.pricePerYear,
        actualPrice: confirmedPrice,
        inflationPercentage: percentageDiff,
      },
      req,
    });

    // Notify proxy submitter about price correction
    await notify(
      property.proxySubmitterId,
      "Price correction required",
      `The landlord confirmed a different price for "${property.title}". Listed: ₦${property.pricePerYear.toLocaleString()}, Actual: ₦${confirmedPrice.toLocaleString()}. ${priceAdjustmentReason || ""}`,
      "SYSTEM",
      {
        propertyId: id,
        priceInflation: true,
        percentageDiff,
      }
    );
  }

  await Promise.all([
    audit({
      actorId: session.user.id,
      action: "VERIFY",
      entity: "Property",
      entityId: id,
      before,
      after: {
        pricePerYear: confirmedPrice,
        priceVerified: true,
        landlordConfirmed,
        priceDifference,
        percentageDiff,
      },
      req,
    }),
    // Notify landlord
    notify(
      property.landlordId,
      "Price verified ✅",
      `Your property "${property.title}" price has been confirmed at ₦${confirmedPrice.toLocaleString()}/year. ${notes ? `Note: ${notes}` : ""}`,
      "SYSTEM",
      { propertyId: id, confirmedPrice }
    ),
  ]);

  return NextResponse.json({
    message: "Price verified successfully.",
    property: updated,
    priceAdjustment: {
      originalPrice: property.pricePerYear,
      confirmedPrice,
      difference: priceDifference,
      percentageDiff: Math.round(percentageDiff * 100) / 100,
      wasInflated: isPriceInflated,
    },
  });
}
