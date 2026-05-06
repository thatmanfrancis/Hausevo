import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";

/*
  POST /api/vault
  Upload a document to the vault.
  Requires: active session

  Body: { title, fileUrl, category, propertyId? }
  category: IDENTITY | DEED | RECEIPT | LEGAL | INSPECTION | UTILITY
*/
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await req.json();
  const { title, fileUrl, category, propertyId } = body;

  if (!title || !fileUrl || !category) {
    return NextResponse.json(
      { error: "title, fileUrl and category are required." },
      { status: 400 }
    );
  }

  const validCategories = ["IDENTITY", "DEED", "RECEIPT", "LEGAL", "INSPECTION", "UTILITY"];
  if (!validCategories.includes(category)) {
    return NextResponse.json(
      { error: `category must be one of: ${validCategories.join(", ")}` },
      { status: 400 }
    );
  }

  if (propertyId) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { landlordId: true, tenancy: { select: { tenantId: true } } },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found." }, { status: 404 });
    }

    const isLandlord = property.landlordId === userId;
    const isTenant = property.tenancy?.tenantId === userId;
    const management = await prisma.propertyManagement.findFirst({
      where: { propertyId, managerId: userId, status: "ACTIVE" },
    });

    // Managers can upload operational docs (not identity docs — those belong to the owner only)
    const managerAllowedCategories = ["INSPECTION", "RECEIPT", "UTILITY", "LEGAL"];
    const isManagerUpload = management && managerAllowedCategories.includes(category);

    if (!isLandlord && !isTenant && !isManagerUpload) {
      return NextResponse.json(
        { error: "You are not authorized to upload documents to this property." },
        { status: 403 }
      );
    }
  }

  const item = await prisma.vaultItem.create({
    data: {
      title,
      fileUrl,
      category,
      ownerId: userId,
      propertyId: propertyId ?? null,
    },
    select: {
      id: true, title: true, fileUrl: true, category: true,
      propertyId: true, isVerified: true, createdAt: true,
    },
  });

  await audit({
    actorId: userId,
    action: "CREATE",
    entity: "VaultItem",
    entityId: item.id,
    after: { title, category, propertyId: propertyId ?? null },
    req,
  });

  return NextResponse.json({ item }, { status: 201 });
}

/*
  GET /api/vault
  List the current user's vault documents.
  Optionally filter by propertyId or category.
  Requires: active session

  Query params: propertyId?, category?
*/
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = req.nextUrl;
  const propertyId = searchParams.get("propertyId") ?? undefined;
  const category = searchParams.get("category") ?? undefined;

  const items = await prisma.vaultItem.findMany({
    where: {
      ownerId: userId,
      ...(propertyId && { propertyId }),
      ...(category && { category: category as never }),
    },
    select: {
      id: true, title: true, fileUrl: true, category: true,
      propertyId: true, isVerified: true, createdAt: true,
      property: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ items });
}
