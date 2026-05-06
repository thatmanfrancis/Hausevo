import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

/*
  GET /api/user/me
  Returns the logged-in user's full profile.
  Requires: active session
*/
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      roles: true,
      isVerified: true,
      verificationTier: true,
      twoFactorEnabled: true,
      walletBalance: true,
      shackScore: {
        select: {
          score: true,
          onTimePayments: true,
          latePayments: true,
          completedTenancies: true,
          lastCalculated: true,
        },
      },
      bankAccounts: {
        select: {
          id: true,
          bankName: true,
          accountNumber: true,
          accountName: true,
          isDefault: true,
          isVerified: true,
        },
      },
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({ user });
}

/*
  PATCH /api/user/me
  Update own profile — name and phone only.
  Email changes require re-verification (not handled here).
  Requires: active session

  Body: { fullName?, phoneNumber? }
*/
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await req.json();
  const { fullName, phoneNumber } = body;

  if (!fullName && !phoneNumber) {
    return NextResponse.json(
      { error: "Provide at least one field to update." },
      { status: 400 }
    );
  }

  if (phoneNumber) {
    const existing = await prisma.user.findFirst({
      where: { phoneNumber, NOT: { id: userId } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Phone number is already in use." },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(fullName && { fullName }),
      ...(phoneNumber && { phoneNumber }),
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      roles: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ user: updated });
}
