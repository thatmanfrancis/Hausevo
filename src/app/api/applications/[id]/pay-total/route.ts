import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

/*
  POST /api/applications/:id/pay-total
  Tenant pays the full "Total Package" after their application is accepted.
  This handles the "Split":
  - ₦50,000 -> Shack Platform Fee (Revenue)
  - Rent -> Landlord Wallet
  - Caution Deposit -> Escrow Account
*/
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const userId = session.user.id;
  const { id: applicationId } = await params;

  // 1. Fetch the application with property details
  const application = await prisma.tenancyApplication.findUnique({
    where: { id: applicationId },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          landlordId: true,
          pricePerYear: true,
          totalPackage: true,
        },
      },
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  if (application.tenantId !== userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  if (application.status !== "ACCEPTED") {
    return NextResponse.json({ error: "Application must be ACCEPTED before payment." }, { status: 400 });
  }

  // Check if tenancy already exists
  const existingTenancy = await prisma.tenancy.findUnique({
    where: { propertyId: application.propertyId },
  });
  if (existingTenancy) {
    return NextResponse.json({ error: "Tenancy already exists for this property." }, { status: 400 });
  }

  // 2. Constants for the Split
  const SHACK_FLAT_FEE = 50000;
  const totalAmount = application.property.totalPackage;
  const annualRent = application.property.pricePerYear;
  
  // Caution deposit is the remainder (Total - Rent - Shack Fee)
  // In a real system, these would be explicit fields, but we follow the 50k rule here.
  const cautionDeposit = totalAmount - annualRent - SHACK_FLAT_FEE;

  // 3. Verify Wallet Balance
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { walletBalance: true },
  });

  if (!user || user.walletBalance < totalAmount) {
    return NextResponse.json({ 
      error: `Insufficient balance. You need ${new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(totalAmount)} in your wallet.` 
    }, { status: 402 });
  }

  // 4. THE SPLIT - Database Transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      // A. Deduct from Tenant
      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: totalAmount } }
      });

      // B. Credit Landlord (Rent portion only)
      await tx.user.update({
        where: { id: application.property.landlordId },
        data: { walletBalance: { increment: annualRent } }
      });

      // C. Record Shack Revenue Transaction
      await tx.transaction.create({
        data: {
          userId: userId,
          amount: SHACK_FLAT_FEE,
          type: "SERVICE", // Platform fee
          status: "SUCCESS",
          reference: `SHK-FEE-${Date.now()}`,
          description: `Platform verification fee for ${application.property.title}`,
          shackFee: SHACK_FLAT_FEE,
          netAmount: SHACK_FLAT_FEE,
        }
      });

      // D. Record Rent Transaction (to Landlord)
      await tx.transaction.create({
        data: {
          userId: userId,
          amount: annualRent,
          type: "RENT",
          status: "SUCCESS",
          fromId: userId,
          toId: application.property.landlordId,
          propertyId: application.propertyId,
          reference: `RENT-INIT-${Date.now()}`,
          description: `Initial rent payment for ${application.property.title}`,
        }
      });

      // E. Create the Tenancy automatically
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);

      const tenancy = await tx.tenancy.create({
        data: {
          propertyId: application.propertyId,
          tenantId: application.tenantId,
          status: "ACTIVE",
          startDate,
          endDate,
          cautionDeposit,
          savingsGoal: annualRent,
          rentSchedules: {
            create: {
              dueDate: startDate,
              amount: annualRent,
              frequency: "ANNUALLY",
              status: "COMPLETED",
              paidAt: new Date(),
            }
          },
          agreement: {
            create: {
              content: `Standard Tenancy Agreement for ${application.property.title}.`,
              status: "PENDING",
            }
          }
        }
      });

      // F. Update Property Status
      await tx.property.update({
        where: { id: application.propertyId },
        data: { status: "RENTED" }
      });

      return tenancy;
    });

    // 5. Notifications
    await Promise.all([
      notify(application.property.landlordId, "Property Rented! 🏠", `Full payment received for "${application.property.title}". The rent portion has been credited to your wallet.`, "TENANCY_UPDATE"),
      notify(userId, "Welcome Home! 🔑", `Payment successful. Your tenancy for "${application.property.title}" is now active.`, "TENANCY_UPDATE"),
      audit({
        actorId: userId,
        action: "PAYMENT",
        entity: "Tenancy",
        entityId: result.id,
        after: { totalPaid: totalAmount, shackShare: SHACK_FLAT_FEE, landlordShare: annualRent },
        req
      })
    ]);

    return NextResponse.json({ success: true, tenancyId: result.id });
  } catch (err: any) {
    console.error("Payment Error:", err);
    return NextResponse.json({ error: "Failed to process the split payment." }, { status: 500 });
  }
}
