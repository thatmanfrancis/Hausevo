import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/*
  POST /api/tenancy/[id]/co-tenants
  Primary tenant adds a roommate/co-tenant to their active tenancy.
  Body: { identifier } — email or phone number
*/
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const tenancy = await prisma.tenancy.findUnique({
    where: { id },
    select: { tenantId: true, isJoint: true, id: true, property: { select: { title: true } } },
  });

  if (!tenancy) {
    return NextResponse.json({ error: "Tenancy not found." }, { status: 404 });
  }

  if (tenancy.tenantId !== session.user.id) {
    return NextResponse.json({ error: "Only the primary tenant can add co-tenants." }, { status: 403 });
  }

  const { identifier } = await req.json();
  if (!identifier) {
    return NextResponse.json({ error: "Email or phone number is required." }, { status: 400 });
  }

  const targetUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { phoneNumber: identifier },
      ],
    },
    select: { id: true, fullName: true, email: true },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "User not found. They must have a Hausevo account first." }, { status: 404 });
  }

  if (targetUser.id === session.user.id) {
    return NextResponse.json({ error: "You are already the primary tenant." }, { status: 400 });
  }

  // Check if already a co-tenant
  const isAlreadyCoTenant = await prisma.tenancy.findFirst({
    where: {
      id: id,
      coTenants: { some: { id: targetUser.id } },
    },
  });

  if (isAlreadyCoTenant) {
    return NextResponse.json({ error: "User is already a co-tenant." }, { status: 400 });
  }

  // Update tenancy to add co-tenant and set isJoint to true
  await prisma.tenancy.update({
    where: { id },
    data: {
      isJoint: true,
      coTenants: { connect: { id: targetUser.id } },
    },
  });

  await Promise.all([
    audit({
      actorId: session.user.id,
      action: "UPDATE",
      entity: "Tenancy",
      entityId: id,
      after: { addedCoTenant: targetUser.id },
      req,
    }),
    notify(
      targetUser.id,
      "You've been added to a tenancy",
      `You are now a co-tenant for ${tenancy.property.title}. Rent responsibilities can now be shared.`,
      "TENANCY_UPDATE",
      { tenancyId: id }
    ),
    notify(
      session.user.id,
      "Co-tenant added",
      `${targetUser.fullName} has been added to your tenancy.`,
      "TENANCY_UPDATE",
      { tenancyId: id }
    ),
  ]);

  return NextResponse.json({ 
    message: "Co-tenant added successfully.",
    coTenant: targetUser
  });
}
