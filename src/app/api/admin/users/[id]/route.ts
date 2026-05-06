import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  PATCH /api/admin/users/:id
  Admin updates a user's verification tier, roles, or vets an artisan.
  Requires: active session + ADMIN role

  Body: { verificationTier?, roles?, isVetted? (for artisans) }
*/
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  });

  if (!admin?.roles.includes("ADMIN")) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { id } = await params;

  const target = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, fullName: true, roles: true,
      verificationTier: true, artisanProfile: true,
    },
  });

  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const body = await req.json();
  const { verificationTier, roles, isVetted } = body;

  const before = {
    verificationTier: target.verificationTier,
    roles: target.roles,
  };

  // Update user fields
  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(verificationTier !== undefined && { verificationTier: Number(verificationTier) }),
      ...(roles && { roles }),
    },
    select: {
      id: true, fullName: true, roles: true,
      verificationTier: true, updatedAt: true,
    },
  });

  const notifyPromises: Promise<void>[] = [
    audit({
      actorId: session.user.id,
      action: "VERIFY",
      entity: "User",
      entityId: id,
      before,
      after: { verificationTier: updated.verificationTier, roles: updated.roles },
      req,
    }),
  ];

  // Vet artisan profile if requested
  if (isVetted !== undefined && target.artisanProfile) {
    await prisma.artisanProfile.update({
      where: { userId: id },
      data: { isVetted: Boolean(isVetted) },
    });

    if (isVetted) {
      notifyPromises.push(
        notify(
          id,
          "Artisan profile approved! ✅",
          "Your artisan profile has been vetted. You can now receive job assignments on Shack.",
          "SYSTEM",
          { artisanProfileId: target.artisanProfile.id }
        )
      );
    }
  }

  if (verificationTier !== undefined && Number(verificationTier) > target.verificationTier) {
    const tierLabels: Record<number, string> = {
      1: "ID verified",
      2: "Address verified",
      3: "Fully verified",
    };
    const label = tierLabels[Number(verificationTier)] ?? `Tier ${verificationTier}`;
    notifyPromises.push(
      notify(
        id,
        "Verification upgrade",
        `Your account has been upgraded to ${label} status on Shack.`,
        "DOC_VERIFIED",
        { verificationTier }
      )
    );
  }

  await Promise.all(notifyPromises);

  return NextResponse.json({ user: updated });
}

/*
  GET /api/admin/users/:id
  Admin views full user profile including sensitive fields.
  Requires: active session + ADMIN role
*/
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  });

  if (!admin?.roles.includes("ADMIN")) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      artisanProfile: true,
      shackScore: true,
      bankAccounts: { select: { id: true, bankName: true, accountNumber: true, isDefault: true, isVerified: true } },
      ownedProperties: { select: { id: true, title: true, status: true } },
      tenancy: { select: { id: true, status: true, property: { select: { title: true } } } },
      _count: {
        select: {
          reviewsReceived: true,
          maintenanceJobs: true,
          transactions: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  // Strip password hash
  const { passwordHash: _, twoFactorSecret: __, ...safeUser } = user;

  return NextResponse.json({ user: safeUser });
}
