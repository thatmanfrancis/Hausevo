"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !user.roles.includes("ADMIN")) throw new Error("Forbidden");
  
  return user.id;
}

async function logAudit(actorId: string, action: string, entity: string, entityId: string) {
  await prisma.auditLog.create({
    data: { actorId, action: action as any, entity, entityId },
  });
}

// ── Properties ──

const SCOUT_BOUNTY_AMOUNT = 5000; // ₦5,000 finder's bounty

export async function approveProperty(id: string) {
  try {
    const adminId = await requireAdmin();

    // Fetch property to check for proxy/scout submission
    const property = await prisma.property.findUnique({
      where: { id },
      select: {
        title: true,
        proxySubmitterId: true,
        isProxySubmission: true,
      },
    });

    if (!property) {
      return { success: false, message: "Property not found." };
    }

    // Atomic transaction: approve property + pay scout bounty if applicable
    await prisma.$transaction(async (tx) => {
      // 1. Flip property status to AVAILABLE
      await tx.property.update({
        where: { id },
        data: { status: "AVAILABLE" },
      });

      // 2. If this was a proxy/scout submission, pay the ₦5,000 bounty
      if (property.isProxySubmission && property.proxySubmitterId) {
        // Increment scout wallet balance
        await tx.user.update({
          where: { id: property.proxySubmitterId },
          data: { walletBalance: { increment: SCOUT_BOUNTY_AMOUNT } },
        });

        // Create transaction ledger entry
        await tx.transaction.create({
          data: {
            userId: property.proxySubmitterId,
            amount: SCOUT_BOUNTY_AMOUNT,
            type: "REWARD",
            status: "SUCCESS",
            reference: `SCOUT-BOUNTY-${id}-${Date.now()}`,
            description: `Scout finder's bounty for verified listing: ${property.title}`,
            propertyId: id,
          },
        });

        // Notify the scout
        await tx.notification.create({
          data: {
            userId: property.proxySubmitterId,
            title: "Scout Bounty Paid! 🎉",
            body: `Your listing "${property.title}" has been verified. ₦${SCOUT_BOUNTY_AMOUNT.toLocaleString("en-NG")} has been added to your wallet.`,
            type: "REWARD_PAID",
            actionUrl: "/landlord/dashboard",
          },
        });
      }
    });

    await logAudit(adminId, "APPROVE", "Property", id);
    revalidatePath("/admin/properties");
    return { success: true };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed" };
  }
}

export async function flagProperty(id: string) {
  try {
    const adminId = await requireAdmin();
    await prisma.property.update({ where: { id }, data: { status: "FLAGGED" } });
    await logAudit(adminId, "FLAG", "Property", id);
    revalidatePath("/admin/properties");
    return { success: true };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updatePropertyDetails(id: string, data: any) {
  try {
    const adminId = await requireAdmin();

    const pricePerYear = parseFloat(data.pricePerYear);
    const totalPackage = parseFloat(data.totalPackage);
    const healthScore = parseInt(data.healthScore, 10);

    if (isNaN(pricePerYear) || isNaN(totalPackage) || isNaN(healthScore)) {
      throw new Error("Invalid number formats provided");
    }

    // Fetch existing metadata so we can merge rather than overwrite
    const existing = await prisma.property.findUnique({ where: { id }, select: { metadata: true } });
    const existingMeta = (existing?.metadata as Record<string, unknown>) ?? {};

    await prisma.property.update({
      where: { id },
      data: {
        title: data.title,
        address: data.address,
        lga: data.lga,
        listingType: data.listingType as any,
        status: data.status as any,
        pricePerYear,
        totalPackage,
        healthScore,
        deedVerified: data.deedVerified,
        priceVerified: data.priceVerified,
        metadata: {
          ...existingMeta,
          propertyType: data.propertyType ?? existingMeta.propertyType ?? null,
          bedrooms: data.bedrooms != null ? data.bedrooms : (existingMeta.bedrooms ?? null),
          bathrooms: data.bathrooms != null ? data.bathrooms : (existingMeta.bathrooms ?? null),
          amenities: data.amenities ?? existingMeta.amenities ?? null,
          description: data.description ?? existingMeta.description ?? null,
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: "UPDATE" as any,
        entity: "Property",
        entityId: id,
      },
    });

    revalidatePath(`/admin/properties/${id}`);
    revalidatePath(`/admin/properties`);
    return { success: true };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed to update property" };
  }
}

// ── Users ──
export async function verifyUser(id: string) {
  try {
    const adminId = await requireAdmin();
    await prisma.user.update({ where: { id }, data: { isVerified: true, verificationTier: 2 } });
    await logAudit(adminId, "VERIFY", "User", id);
    revalidatePath("/admin/users");
    return { success: true };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed" };
  }
}

export async function flagUser(id: string) {
  try {
    const adminId = await requireAdmin();
    await prisma.user.update({ where: { id }, data: { isVerified: false } }); // Revoke verification as suspension proxy
    await logAudit(adminId, "FLAG", "User", id);
    revalidatePath("/admin/users");
    return { success: true };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed" };
  }
}

// ── Vault Items (Verifications) ──
export async function verifyVaultItem(id: string, userId: string) {
  try {
    const adminId = await requireAdmin();
    await prisma.vaultItem.update({ where: { id }, data: { isVerified: true } });
    await logAudit(adminId, "APPROVE", "VaultItem", id);
    revalidatePath("/admin/verifications");
    return { success: true };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed" };
  }
}

export async function rejectVaultItem(id: string) {
  try {
    const adminId = await requireAdmin();
    // Delete the rejected document completely to force re-upload
    await prisma.vaultItem.delete({ where: { id } });
    await logAudit(adminId, "REJECT", "VaultItem", id);
    revalidatePath("/admin/verifications");
    return { success: true };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed" };
  }
}

// ── Disputes ──
export async function resolveDispute(id: string, resolution: string) {
  try {
    const adminId = await requireAdmin();
    await prisma.dispute.update({
      where: { id },
      data: { status: "RESOLVED", resolution, resolvedById: adminId },
    });
    await logAudit(adminId, "UPDATE", "Dispute", id);
    revalidatePath("/admin/disputes");
    return { success: true };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed" };
  }
}

// ── Support Tickets ──
export async function closeTicket(id: string) {
  try {
    const adminId = await requireAdmin();
    await prisma.supportTicket.update({ where: { id }, data: { status: "CLOSED" } });
    await logAudit(adminId, "UPDATE", "SupportTicket", id);
    revalidatePath("/admin/support");
    return { success: true };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed" };
  }
}

// ── Artisans ──
export async function vetArtisan(id: string) {
  try {
    const adminId = await requireAdmin();
    const profile = await prisma.artisanProfile.update({
      where: { id },
      data: { isVetted: true },
      include: { user: true }
    });
    
    // Create Notification
    await prisma.notification.create({
      data: {
        userId: profile.userId,
        title: "Account Vetted! 🎉",
        body: "Your professional artisan profile has been verified by our team. You can now start receiving maintenance jobs.",
        type: "SYSTEM",
        actionUrl: "/artisan/dashboard"
      }
    });

    await logAudit(adminId, "APPROVE", "ArtisanProfile", id);
    revalidatePath("/admin/artisans");
    revalidatePath(`/admin/artisans/${id}`);
    return { success: true };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed" };
  }
}

export async function suspendArtisan(id: string) {
  try {
    const adminId = await requireAdmin();
    await prisma.artisanProfile.update({
      where: { id },
      data: { isVetted: false }
    });
    await logAudit(adminId, "FLAG", "ArtisanProfile", id);
    revalidatePath("/admin/artisans");
    revalidatePath(`/admin/artisans/${id}`);
    return { success: true };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed" };
  }
}

export async function createArtisanProfile(userId: string, data: any) {
  try {
    const adminId = await requireAdmin();
    const profile = await prisma.artisanProfile.create({
      data: {
        userId,
        category: data.category,
        yearsOfExperience: parseInt(data.yearsOfExperience),
        startingPrice: parseFloat(data.startingPrice),
        bio: data.bio,
      }
    });
    await logAudit(adminId, "CREATE", "ArtisanProfile", profile.id);
    revalidatePath("/admin/artisans");
    return { success: true, profileId: profile.id };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed to create profile" };
  }
}

export async function updateArtisanByAdmin(id: string, data: any) {
  try {
    const adminId = await requireAdmin();
    await prisma.artisanProfile.update({
      where: { id },
      data: {
        category: data.category,
        yearsOfExperience: parseInt(data.yearsOfExperience),
        startingPrice: parseFloat(data.startingPrice),
        rating: parseFloat(data.rating),
        bio: data.bio,
      }
    });
    await logAudit(adminId, "UPDATE", "ArtisanProfile", id);
    revalidatePath("/admin/artisans");
    revalidatePath(`/admin/artisans/${id}`);
    return { success: true };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed to update profile" };
  }
}

// ── Free User ID Documents ──
export async function approveUserIdDoc(userId: string) {
  try {
    const adminId = await requireAdmin();
    
    // Update verificationTier on the User
    await prisma.user.update({
      where: { id: userId },
      data: { verificationTier: 1 },
    });

    // Also mark corresponding VaultItem as verified
    await prisma.vaultItem.updateMany({
      where: { ownerId: userId, title: "Government ID Document" },
      data: { isVerified: true },
    });

    // Create Notification
    await prisma.notification.create({
      data: {
        userId,
        title: "ID Verification Approved! 🎉",
        body: "Your government ID document has been reviewed and approved. You are now Tier 1 verified and can apply for properties.",
        type: "SYSTEM",
        actionUrl: "/tenant/verification",
      },
    });

    await logAudit(adminId, "APPROVE", "UserIdDoc", userId);
    revalidatePath("/admin/verifications");
    return { success: true };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed" };
  }
}

export async function rejectUserIdDoc(userId: string) {
  try {
    const adminId = await requireAdmin();

    // Clear ID document and selfie URLs on the User
    await prisma.user.update({
      where: { id: userId },
      data: { idDocumentUrl: null, selfieUrl: null },
    });

    // Also delete the VaultItem completely
    await prisma.vaultItem.deleteMany({
      where: { ownerId: userId, title: "Government ID Document" },
    });

    // Create Notification
    await prisma.notification.create({
      data: {
        userId,
        title: "ID Verification Rejected ✗",
        body: "Your uploaded ID document was rejected. Please check the requirements and upload a valid government-issued ID.",
        type: "SYSTEM",
        actionUrl: "/tenant/verification",
      },
    });

    await logAudit(adminId, "REJECT", "UserIdDoc", userId);
    revalidatePath("/admin/verifications");
    return { success: true };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed" };
  }
}

// ── Soft Delete User ──
export async function softDeleteUser(id: string) {
  try {
    const adminId = await requireAdmin();
    await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
    await logAudit(adminId, "DELETE", "User", id);
    revalidatePath("/admin/users");
    return { success: true };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed" };
  }
}

export async function restoreUser(id: string) {
  try {
    const adminId = await requireAdmin();
    await prisma.user.update({ where: { id }, data: { deletedAt: null } });
    await logAudit(adminId, "UPDATE", "User", id);
    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${id}`);
    return { success: true };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed" };
  }
}

// ── Admin Create Property ──
export async function adminCreateProperty(data: {
  title: string;
  address: string;
  lga: string;
  state: string;
  listingType: string;
  pricePerYear: number;
  totalPackage: number;
  landlordId: string;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  status?: string;
  imageUrls?: string[];
  amenities?: string[];
  description?: string;
}) {
  try {
    const adminId = await requireAdmin();
    const resolvedLandlordId = data.landlordId === "__admin__" ? adminId : data.landlordId;
    const property = await prisma.property.create({
      data: {
        title: data.title,
        address: data.address,
        lga: data.lga,
        state: data.state || "Lagos",
        listingType: data.listingType as any,
        pricePerYear: data.pricePerYear,
        totalPackage: data.totalPackage,
        status: (data.status as any) || "AVAILABLE",
        landlordId: resolvedLandlordId,
        metadata: {
          bedrooms: data.bedrooms ?? null,
          bathrooms: data.bathrooms ?? null,
          propertyType: data.propertyType ?? null,
          amenities: data.amenities ?? null,
          description: data.description ?? null,
        },
      },
    });

    // Create PropertyImage records for each uploaded URL
    if (data.imageUrls && data.imageUrls.length > 0) {
      await prisma.propertyImage.createMany({
        data: data.imageUrls.map((url, order) => ({
          propertyId: property.id,
          url,
          isPrimary: order === 0,
          order,
        })),
      });
    }

    await logAudit(adminId, "CREATE", "Property", property.id);
    revalidatePath("/admin/properties");
    return { success: true, propertyId: property.id };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed to create property" };
  }
}

// ── Admin Create Artisan ──
export async function adminCreateArtisan(data: {
  fullName: string;
  email: string;
  phoneNumber?: string;
  category: string;
  yearsOfExperience: number;
  startingPrice: number;
  bio?: string;
}) {
  try {
    const adminId = await requireAdmin();

    // Check email not taken
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return { success: false, message: "A user with this email already exists." };

    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber || null,
        roles: ["ARTISAN"],
        onboardingCompleted: true,
      },
    });

    const profile = await prisma.artisanProfile.create({
      data: {
        userId: user.id,
        category: data.category as any,
        yearsOfExperience: data.yearsOfExperience,
        startingPrice: data.startingPrice,
        bio: data.bio || null,
      },
    });

    await logAudit(adminId, "CREATE", "ArtisanProfile", profile.id);
    revalidatePath("/admin/artisans");
    return { success: true, userId: user.id, profileId: profile.id };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed to create artisan" };
  }
}

// ── Admin Create Maintenance Job ──
export async function adminCreateMaintenanceJob(data: {
  propertyId: string;
  title: string;
  description: string;
  artisanId?: string;
  cost?: number;
}) {
  try {
    const adminId = await requireAdmin();
    const job = await prisma.maintenanceJob.create({
      data: {
        propertyId: data.propertyId,
        title: data.title,
        description: data.description,
        artisanId: data.artisanId || null,
        cost: data.cost || null,
        status: data.artisanId ? "ASSIGNED" : "OPEN",
      },
    });
    await logAudit(adminId, "CREATE", "MaintenanceJob", job.id);
    revalidatePath("/admin/maintenance");
    return { success: true, jobId: job.id };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed to create job" };
  }
}

export async function adminUpdateMaintenanceJob(id: string, data: { status?: string; artisanId?: string; cost?: number }) {
  try {
    const adminId = await requireAdmin();
    await prisma.maintenanceJob.update({
      where: { id },
      data: {
        ...(data.status ? { status: data.status as any } : {}),
        ...(data.artisanId !== undefined ? { artisanId: data.artisanId || null } : {}),
        ...(data.cost !== undefined ? { cost: data.cost } : {}),
      },
    });
    await logAudit(adminId, "UPDATE", "MaintenanceJob", id);
    revalidatePath("/admin/maintenance");
    return { success: true };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed to update job" };
  }
}

// ── Admin Create Dispute ──
export async function adminCreateDispute(data: {
  raisedById: string;
  againstId: string;
  type: string;
  description: string;
  propertyId?: string;
}) {
  try {
    const adminId = await requireAdmin();
    const dispute = await prisma.dispute.create({
      data: {
        raisedById: data.raisedById,
        againstId: data.againstId,
        type: data.type as any,
        description: data.description,
        propertyId: data.propertyId || null,
        status: "OPEN",
      },
    });
    await logAudit(adminId, "CREATE", "Dispute", dispute.id);
    revalidatePath("/admin/disputes");
    return { success: true, disputeId: dispute.id };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed to create dispute" };
  }
}

// ── Admin Create Support Ticket ──
export async function adminCreateSupportTicket(data: {
  userId: string;
  subject: string;
  priority: string;
  message: string;
}) {
  try {
    const adminId = await requireAdmin();
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: data.userId,
        subject: data.subject,
        priority: data.priority as any,
        status: "OPEN",
      },
    });
    await prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: adminId,
        content: data.message,
      },
    });
    await logAudit(adminId, "CREATE", "SupportTicket", ticket.id);
    revalidatePath("/admin/support");
    return { success: true, ticketId: ticket.id };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed to create ticket" };
  }
}

export async function adminReplyToTicket(ticketId: string, content: string) {
  try {
    const adminId = await requireAdmin();
    await prisma.supportMessage.create({
      data: { ticketId, senderId: adminId, content },
    });
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: "IN_PROGRESS", assigneeId: adminId },
    });
    await logAudit(adminId, "UPDATE", "SupportTicket", ticketId);
    revalidatePath(`/admin/support/${ticketId}`);
    revalidatePath("/admin/support");
    return { success: true };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed to reply" };
  }
}

export async function adminUpdateSupportTicket(ticketId: string, data: { status?: string; priority?: string; assigneeId?: string }) {
  try {
    const adminId = await requireAdmin();
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        ...(data.status ? { status: data.status as any } : {}),
        ...(data.priority ? { priority: data.priority as any } : {}),
        ...(data.assigneeId !== undefined ? { assigneeId: data.assigneeId || null } : {}),
      },
    });
    await logAudit(adminId, "UPDATE", "SupportTicket", ticketId);
    revalidatePath(`/admin/support/${ticketId}`);
    revalidatePath("/admin/support");
    return { success: true };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed to update ticket" };
  }
}

// ── Boost Property ──
export async function adminBoostProperty(
  id: string,
  data: { durationDays: number; boostLGA?: string }
) {
  try {
    const adminId = await requireAdmin();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + data.durationDays);

    await prisma.property.update({
      where: { id },
      data: {
        isBoosted: true,
        boostExpiresAt: expiresAt,
        boostLGA: data.boostLGA || null,
      },
    });

    await logAudit(adminId, "UPDATE", "Property", id);
    revalidatePath(`/admin/properties/${id}`);
    revalidatePath("/admin/properties");
    revalidatePath("/properties");
    return { success: true, expiresAt };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed to boost" };
  }
}

// ── Remove Boost ──
export async function adminRemoveBoost(id: string) {
  try {
    const adminId = await requireAdmin();
    await prisma.property.update({
      where: { id },
      data: { isBoosted: false, boostExpiresAt: null, boostLGA: null },
    });
    await logAudit(adminId, "UPDATE", "Property", id);
    revalidatePath(`/admin/properties/${id}`);
    revalidatePath("/admin/properties");
    revalidatePath("/properties");
    return { success: true };
  } catch (e) {
    return { success: false, message: e instanceof Error ? e.message : "Failed to remove boost" };
  }
}
