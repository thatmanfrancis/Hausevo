import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

/*
  GET /api/ai/context
  Returns a rich snapshot of the current user's data to feed into the AI system prompt.
  Requires: active session
*/
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;

  // Fetch everything in parallel
  const [user, tenancy, applications, savedProperties, transactions, marketStats] =
    await Promise.all([
      // Full user profile
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          fullName: true,
          email: true,
          roles: true,
          verificationTier: true,
          walletBalance: true,
          onboardingCompleted: true,
          shackScore: {
            select: {
              score: true,
              onTimePayments: true,
              latePayments: true,
              disputesRaised: true,
              completedTenancies: true,
              lastCalculated: true,
            },
          },
          wishlist: {
            select: { lga: true, maxBudget: true, minBedrooms: true, isActive: true },
          },
          bankAccounts: {
            where: { isDefault: true },
            select: { bankName: true, accountName: true },
            take: 1,
          },
        },
      }),

      // Active tenancy
      prisma.tenancy.findUnique({
        where: { tenantId: userId },
        select: {
          id: true,
          status: true,
          startDate: true,
          endDate: true,
          cautionDeposit: true,
          savingsGoal: true,
          currentSaved: true,
          isJoint: true,
          property: {
            select: {
              title: true,
              address: true,
              lga: true,
              state: true,
              pricePerYear: true,
              rentFrequency: true,
              listingType: true,
            },
          },
          rentSchedules: {
            where: { status: { in: ["PENDING", "FAILED"] } },
            select: { dueDate: true, amount: true, frequency: true, status: true },
            orderBy: { dueDate: "asc" },
            take: 3,
          },
          agreement: {
            select: { status: true, tenantSigned: true, ownerSigned: true },
          },
        },
      }),

      // Recent applications
      prisma.tenancyApplication.findMany({
        where: { tenantId: userId },
        select: {
          status: true,
          createdAt: true,
          property: {
            select: { title: true, address: true, lga: true, pricePerYear: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      // Saved properties
      prisma.savedProperty.findMany({
        where: { tenantId: userId },
        select: {
          property: {
            select: {
              title: true,
              lga: true,
              pricePerYear: true,
              status: true,
              listingType: true,
            },
          },
        },
        take: 5,
      }),

      // Recent wallet transactions
      prisma.transaction.findMany({
        where: { userId },
        select: {
          type: true,
          amount: true,
          status: true,
          description: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      // Market stats — available properties by LGA
      prisma.property.groupBy({
        by: ["lga"],
        where: { status: "AVAILABLE" },
        _count: { id: true },
        _avg: { pricePerYear: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
    ]);

  return NextResponse.json({
    user,
    tenancy,
    applications,
    savedProperties: savedProperties.map((s) => s.property),
    transactions,
    marketStats,
    generatedAt: new Date().toISOString(),
  });
}
