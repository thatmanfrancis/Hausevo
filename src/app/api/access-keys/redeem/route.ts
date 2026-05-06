import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  POST /api/access-keys/redeem
  Any logged-in user redeems a landlord's key to submit a property listing
  on the landlord's behalf. Scout earns a flat ₦2k–₦3k reward once verified.
  Requires: active session

  Body: { key, title, address, lga, state?, latitude?, longitude?,
          pricePerYear, totalPackage, rentFrequency?, metadata? }
*/
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json();
  const {
    key, title, address, lga,
    state = "Lagos",
    latitude, longitude,
    pricePerYear, totalPackage,
    rentFrequency = "ANNUALLY",
    metadata,
  } = body;

  if (!key) {
    return NextResponse.json({ error: "Access key is required." }, { status: 400 });
  }

  if (!title || !address || !lga || !pricePerYear || !totalPackage) {
    return NextResponse.json(
      { error: "title, address, lga, pricePerYear and totalPackage are required." },
      { status: 400 }
    );
  }

  const accessKey = await prisma.accessKey.findUnique({ where: { key } });

  if (!accessKey) {
    return NextResponse.json({ error: "Invalid access key." }, { status: 400 });
  }

  if (accessKey.isUsed) {
    return NextResponse.json({ error: "This key has already been used." }, { status: 400 });
  }

  if (accessKey.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "This key has expired. Ask the landlord to generate a new one." },
      { status: 400 }
    );
  }

  if (accessKey.issuerId === session.user.id) {
    return NextResponse.json(
      { error: "You cannot redeem your own access key." },
      { status: 400 }
    );
  }

  // Create property + mark key used in one transaction
  const [property] = await prisma.$transaction([
    prisma.property.create({
      data: {
        title, address, lga, state,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        pricePerYear: Number(pricePerYear),
        totalPackage: Number(totalPackage),
        rentFrequency,
        metadata: metadata ?? undefined,
        landlordId: accessKey.issuerId,
        accessKeyId: accessKey.id,
      },
      select: {
        id: true, title: true, address: true, lga: true, status: true, createdAt: true,
      },
    }),
    prisma.accessKey.update({
      where: { id: accessKey.id },
      data: { isUsed: true, redeemedBy: session.user.id, redeemedAt: new Date() },
    }),
  ]);

  // Create pending scout reward — admin sets amount at verification
  await prisma.scoutReward.create({
    data: {
      accessKeyId: accessKey.id,
      redeemerId: session.user.id,
      propertyId: property.id,
      amount: 0,
    },
  });

  await Promise.all([
    audit({
      actorId: session.user.id,
      action: "CREATE",
      entity: "Property",
      entityId: property.id,
      after: { title, address, lga, submittedViaKey: key, landlordId: accessKey.issuerId },
      req,
    }),
    audit({
      actorId: session.user.id,
      action: "ACCESS",
      entity: "AccessKey",
      entityId: accessKey.id,
      after: { redeemedBy: session.user.id, propertyId: property.id },
      req,
    }),
    // Notify the scout
    notify(
      session.user.id,
      "Listing submitted successfully",
      `"${title}" has been submitted on behalf of the landlord. Your reward will be paid once it's verified.`,
      "REWARD_PAID",
      { propertyId: property.id }
    ),
    // Notify the landlord
    notify(
      accessKey.issuerId,
      "Property submitted via your key",
      `A listing for "${title}" in ${lga} has been submitted using your access key and is pending review.`,
      "KEY_ISSUED",
      { propertyId: property.id, accessKeyId: accessKey.id }
    ),
  ]);

  return NextResponse.json(
    {
      message: "Property submitted. Your reward will be paid once the listing is verified.",
      property,
    },
    { status: 201 }
  );
}
