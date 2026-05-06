import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

/*
  POST /api/properties/:id/images
  Add image URLs to a property listing.
  In production, images are uploaded to S3/Cloudinary first,
  then the URLs are submitted here.
  Requires: active session + must be the landlord

  Body: { images: [{ url, isPrimary?, order? }] }
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
    select: { landlordId: true },
  });

  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  if (property.landlordId !== session.user.id) {
    return NextResponse.json(
      { error: "You can only add images to your own listings." },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { images } = body;

  if (!Array.isArray(images) || images.length === 0) {
    return NextResponse.json(
      { error: "Provide an array of image objects with at least one URL." },
      { status: 400 }
    );
  }

  // If any image is marked primary, clear existing primary flags first
  const hasPrimary = images.some((img: { isPrimary?: boolean }) => img.isPrimary);
  if (hasPrimary) {
    await prisma.propertyImage.updateMany({
      where: { propertyId: id },
      data: { isPrimary: false },
    });
  }

  const created = await prisma.propertyImage.createMany({
    data: images.map((img: { url: string; isPrimary?: boolean; order?: number }, index: number) => ({
      propertyId: id,
      url: img.url,
      isPrimary: img.isPrimary ?? false,
      order: img.order ?? index,
    })),
  });

  return NextResponse.json(
    { message: `${created.count} image(s) added.` },
    { status: 201 }
  );
}

/*
  GET /api/properties/:id/images
  List all images for a property.
*/
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const images = await prisma.propertyImage.findMany({
    where: { propertyId: id },
    orderBy: { order: "asc" },
    select: { id: true, url: true, isPrimary: true, order: true },
  });

  return NextResponse.json({ images });
}
