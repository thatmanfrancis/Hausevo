import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  PATCH /api/admin/properties/:id/verify-deed
  Admin verifies property deed/Certificate of Occupancy.
  Critical step in preventing agent markup fraud.
  
  Requires: active session + ADMIN role
  
  Body: {
    deedVerified: boolean,
    notes?: string,
    rejectionReason?: string (if deedVerified = false)
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
      deedVerified: true,
      deedDocumentId: true,
      deedVerifiedAt: true,
    },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  if (!property.deedDocumentId) {
    return NextResponse.json(
      { error: "No deed document uploaded for this property." },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { deedVerified, notes, rejectionReason } = body;

  if (typeof deedVerified !== "boolean") {
    return NextResponse.json(
      { error: "deedVerified (boolean) is required." },
      { status: 400 }
    );
  }

  const before = {
    deedVerified: property.deedVerified,
    deedVerifiedAt: property.deedVerifiedAt,
  };

  // Update property
  const updated = await prisma.property.update({
    where: { id },
    data: {
      deedVerified,
      deedVerifiedAt: deedVerified ? new Date() : null,
      deedVerifiedBy: deedVerified ? session.user.id : null,
      metadata: {
        ...(property as any).metadata,
        deedVerification: {
          verified: deedVerified,
          verifiedAt: new Date().toISOString(),
          verifiedBy: session.user.id,
          notes: notes ?? null,
          rejectionReason: rejectionReason ?? null,
        },
      },
    },
    select: {
      id: true,
      title: true,
      deedVerified: true,
      deedVerifiedAt: true,
      status: true,
    },
  });

  // Update vault item verification status
  if (deedVerified) {
    await prisma.vaultItem.update({
      where: { id: property.deedDocumentId },
      data: { isVerified: true },
    });
  }

  await Promise.all([
    audit({
      actorId: session.user.id,
      action: "VERIFY",
      entity: "Property",
      entityId: id,
      before,
      after: {
        deedVerified,
        deedVerifiedAt: updated.deedVerifiedAt,
        notes,
      },
      req,
    }),
    // Notify landlord
    notify(
      property.landlordId,
      deedVerified ? "Deed verified ✅" : "Deed verification failed",
      deedVerified
        ? `Your deed for "${property.title}" has been verified. ${notes ? `Note: ${notes}` : ""}`
        : `Your deed for "${property.title}" could not be verified. ${rejectionReason || "Please resubmit with correct documents."}`,
      "DOC_VERIFIED",
      { propertyId: id, deedVerified }
    ),
    // Notify proxy submitter if different
    property.proxySubmitterId && property.proxySubmitterId !== property.landlordId
      ? notify(
          property.proxySubmitterId,
          deedVerified ? "Deed verified ✅" : "Deed verification failed",
          deedVerified
            ? `The deed for "${property.title}" has been verified.`
            : `The deed for "${property.title}" could not be verified. ${rejectionReason || ""}`,
          "DOC_VERIFIED",
          { propertyId: id }
        )
      : Promise.resolve(),
  ]);

  return NextResponse.json({
    message: deedVerified
      ? "Deed verified successfully."
      : "Deed verification rejected.",
    property: updated,
  });
}
