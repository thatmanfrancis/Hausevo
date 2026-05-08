import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateSignature } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // Organize by environment and purpose
    const env = process.env.NODE_ENV || "development";
    const requestedFolder = (await req.json().catch(() => ({}))).folder || "general";
    
    // If requestedFolder already starts with 'shack/', don't double it
    const folderPath = requestedFolder.startsWith('shack/') 
      ? requestedFolder.replace('shack/', `shack/${env}/`)
      : `shack/${env}/${requestedFolder}`;

    const sigData = generateSignature(folderPath);

    return NextResponse.json({
      ...sigData,
      folder: folderPath,
    });
  } catch (error: any) {
    console.error("Cloudinary Signature Error:", error);
    return NextResponse.json({ error: "Failed to initialize upload" }, { status: 500 });
  }
}
