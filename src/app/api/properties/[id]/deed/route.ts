import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  POST /api/properties/:id/deed
  Upload property deed/Certificate of Occupancy for verification.
  Required for property approval (anti-agent markup measure).
  
  Requires: active session + must be property owner or proxy submitter
  
  Body: {
    deedDocument: string (base64 or URL),
    ownerNameOnDeed: string,
    propertyAddress: string
  }
*/
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
    select: {
      landlordId: true,
      proxySubmitterId: true,
      title: true,
      address: true,
      deedVerified: true,
      deedDocumentId: true,
    },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  // Check permission: must be landlord or proxy submitter
  const canUpload =
    property.landlordId === session.user.id ||
    property.proxySubmitterId === session.user.id;

  if (!canUpload) {
    return NextResponse.json(
      { error: "Only the property owner or submitter can upload the deed." },
      { status: 403 }
    );
  }

  if (property.deedVerified) {
    return NextResponse.json(
      { error: "Deed already verified for this property." },
      { status: 409 }
    );
  }

  const body = await req.json();
  const { deedDocument, ownerNameOnDeed, propertyAddress } = body;

  if (!deedDocument || !ownerNameOnDeed || !propertyAddress) {
    return NextResponse.json(
      { error: "deedDocument, ownerNameOnDeed, and propertyAddress are required." },
      { status: 400 }
    );
  }

  // Create VaultItem for the deed
  const vaultItem = await prisma.vaultItem.create({
    data: {
      title: `Deed - ${property.title}`,
      fileUrl: deedDocument,
      category: "DEED",
      ownerId: property.landlordId,
      propertyId: id,
      isVerified: false, // Will be verified by admin
    },
  });

  // Update property with deed reference
  await prisma.property.update({
    where: { id },
    data: {
      deedDocumentId: vaultItem.id,
      metadata: {
        ...(property as any).metadata,
        deedInfo: {
          ownerNameOnDeed,
          propertyAddress,
          uploadedAt: new Date().toISOString(),
          uploadedBy: session.user.id,
        },
      },
    },
  });

  await Promise.all([
    audit({
      actorId: session.user.id,
      action: "CREATE",
      entity: "VaultItem",
      entityId: vaultItem.id,
      after: {
        category: "DEED",
        propertyId: id,
        ownerNameOnDeed,
      },
      req,
    }),
    // Notify admins for review
    notify(
      property.landlordId,
      "Deed uploaded",
      `Your deed for "${property.title}" has been uploaded and is pending admin verification.`,
      "DOC_VERIFIED",
      { propertyId: id, vaultItemId: vaultItem.id }
    ),
  ]);

  return NextResponse.json({
    message: "Deed uploaded successfully. Pending admin verification.",
    vaultItemId: vaultItem.id,
  }, { status: 201 });
}

/*
  GET /api/properties/:id/deed
  Get deed verification status for a property.
  
  Public endpoint (for transparency).
*/
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
    select: {
      deedVerified: true,
      deedVerifiedAt: true,
      priceVerified: true,
      priceVerifiedAt: true,
      landlordConfirmed: true,
      deedDocumentId: true,
    },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  return NextResponse.json({
    deedVerified: property.deedVerified,
    deedVerifiedAt: property.deedVerifiedAt,
    priceVerified: property.priceVerified,
    priceVerifiedAt: property.priceVerifiedAt,
    landlordConfirmed: property.landlordConfirmed,
    hasDeedDocument: !!property.deedDocumentId,
  });
}
