import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  PATCH /api/admin/properties/:id
  Admin approves, flags, or changes status of any property.
  Also triggers wishlist matching when a property becomes AVAILABLE.
  Requires: active session + ADMIN role

  Body: { status, reason? }
*/
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
      { status: 403 },
    );
  }

  const { id } = await params;

  const property = await prisma.property.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      status: true,
      lga: true,
      pricePerYear: true,
      landlordId: true,
      deedVerified: true,
      priceVerified: true,
      accessKeyId: true,
      isProxySubmission: true,
    },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  const body = await req.json();
  const { status, reason } = body;

  const validStatuses = [
    "PENDING",
    "AVAILABLE",
    "RENTED",
    "MAINTENANCE",
    "FLAGGED",
  ];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${validStatuses.join(", ")}` },
      { status: 400 },
    );
  }

  // ─────────────────────────────────────────────
  // VERIFICATION ENFORCEMENT (Anti-Agent Markup)
  // Property cannot be AVAILABLE without deed verification
  // ─────────────────────────────────────────────
  if (status === "AVAILABLE") {
    if (!property.deedVerified) {
      return NextResponse.json(
        {
          error: "Property cannot be approved without deed verification.",
          missingVerification: "deed",
          message: "Admin must verify the property deed/C of O before approval.",
        },
        { status: 400 }
      );
    }

    // Recommended but not required: price verification
    if (!property.priceVerified) {
      // Log warning but allow approval
      await audit({
        actorId: session.user.id,
        action: "APPROVE",
        entity: "Property",
        entityId: id,
        after: {
          warning: "Property approved without price verification",
          status: "AVAILABLE",
        },
        req,
      });
    }
  }

  const before = { status: property.status };

  const updated = await prisma.property.update({
    where: { id },
    data: { status },
    select: { id: true, title: true, status: true, updatedAt: true },
  });

  const notifyPromises: Promise<void>[] = [
    audit({
      actorId: session.user.id,
      action:
        status === "FLAGGED"
          ? "FLAG"
          : status === "AVAILABLE"
            ? "APPROVE"
            : "UPDATE",
      entity: "Property",
      entityId: id,
      before,
      after: { status, reason: reason ?? null },
      req,
    }),
  ];

  // Notify landlord of status change
  if (status === "AVAILABLE") {
    // ─────────────────────────────────────────────
    // SCOUT REWARD SYSTEM
    // Set scout reward to ₦3,000 (no landlord charge)
    // ─────────────────────────────────────────────
    if (property.accessKeyId) {
      // Set scout reward to ₦3,000 (pending payout)
      await prisma.scoutReward.updateMany({
        where: { accessKeyId: property.accessKeyId },
        data: {
          amount: 3000,
          status: "PENDING",
        },
      });
    }

    notifyPromises.push(
      notify(
        property.landlordId,
        "Listing approved! 🎉",
        `Your property "${property.title}" has been approved and is now live on Hausevo.`,
        "DOC_VERIFIED",
        { propertyId: id },
      ),
    );

    // Wishlist matching — notify tenants whose criteria match this property
    const matchingWishlists = await prisma.propertyWishlist.findMany({
      where: {
        isActive: true,
        OR: [
          { lga: null },
          { lga: property.lga },
          { maxBudget: null },
          { maxBudget: { gte: property.pricePerYear } },
        ],
      },
      select: { tenantId: true },
    });

    for (const wishlist of matchingWishlists) {
      notifyPromises.push(
        notify(
          wishlist.tenantId,
          "New match for your wishlist! 🏠",
          `A property in ${property.lga} matching your criteria is now available on Hausevo.`,
          "WISHLIST_MATCH",
          { propertyId: id },
        ),
      );
    }
  } else if (status === "FLAGGED") {
    notifyPromises.push(
      notify(
        property.landlordId,
        "Listing flagged",
        `Your property "${property.title}" has been flagged${reason ? `: ${reason}` : ". Please contact support."}`,
        "SYSTEM",
        { propertyId: id },
      ),
    );
  }

  await Promise.all(notifyPromises);

  return NextResponse.json({ property: updated });
}
