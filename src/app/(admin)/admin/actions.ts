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
export async function approveProperty(id: string) {
  try {
    const adminId = await requireAdmin();
    await prisma.property.update({ where: { id }, data: { status: "AVAILABLE" } });
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
    
    // Validate data and restrict to specific fields
    const updateData = {
      title: data.title,
      pricePerYear: parseFloat(data.pricePerYear),
      totalPackage: parseFloat(data.totalPackage),
      healthScore: parseInt(data.healthScore, 10),
      deedVerified: data.deedVerified,
      priceVerified: data.priceVerified,
      // Wait, description doesn't exist on Property model. I need to omit it or use metadata.
      // Let's store description in metadata if needed, but the UI is showing description?
      // Ah! Earlier I found description doesn't exist. I'll omit it from here too.
    };

    if (isNaN(updateData.pricePerYear) || isNaN(updateData.totalPackage) || isNaN(updateData.healthScore)) {
      throw new Error("Invalid number formats provided");
    }

    const before = await prisma.property.findUnique({ where: { id } });
    
    await prisma.property.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: "UPDATE" as any,
        entity: "Property",
        entityId: id,
      }
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
