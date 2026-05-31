import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

/*
  POST /api/user/id-upload
  Authenticated tenant.
  Saves ID document URL and selfie URL directly to the User record.
  In production, files are uploaded to Cloudinary client-side first,
  then the resulting URLs are sent here.

  Body: { idDocumentUrl: string; selfieUrl: string }
*/
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json();
  const { idDocumentUrl, selfieUrl } = body as {
    idDocumentUrl?: string;
    selfieUrl?: string;
  };

  if (!idDocumentUrl || !selfieUrl) {
    return NextResponse.json(
      { error: "Both idDocumentUrl and selfieUrl are required." },
      { status: 400 }
    );
  }

  // Basic URL validation
  try {
    new URL(idDocumentUrl);
    new URL(selfieUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL format." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { idDocumentUrl, selfieUrl },
  });

  // Create/update a VaultItem so the document appears in the admin verifications panel
  const existingVault = await prisma.vaultItem.findFirst({
    where: { ownerId: session.user.id, title: "Government ID Document" },
    select: { id: true },
  });

  if (existingVault) {
    await prisma.vaultItem.update({
      where: { id: existingVault.id },
      data: { fileUrl: idDocumentUrl, isVerified: false },
    });
  } else {
    await prisma.vaultItem.create({
      data: {
        title: "Government ID Document",
        fileUrl: idDocumentUrl,
        category: "IDENTITY",
        ownerId: session.user.id,
      },
    });
  }

  return NextResponse.json({ message: "ID document submitted for review." });
}
