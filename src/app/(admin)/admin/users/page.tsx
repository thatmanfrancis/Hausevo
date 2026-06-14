import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import UsersListClient from "./UsersListClient";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    role?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const params = await searchParams;
  const q = params.q || "";
  const role = params.role || "";
  const status = params.status || "";
  const page = parseInt(params.page || "1", 10);
  const pageSize = 10;

  const where: any = {};

  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phoneNumber: { contains: q, mode: "insensitive" } },
    ];
  }

  if (role) {
    where.roles = {
      has: role,
    };
  }

  if (status) {
    if (status === "verified") {
      where.isVerified = true;
    } else if (status === "unverified") {
      where.isVerified = false;
    } else if (status === "onboarding") {
      where.onboardingCompleted = false;
    } else if (status === "deleted") {
      where.deletedAt = { not: null };
    }
  }

  // By default, exclude deleted users unless specifically filtering for them
  if (status !== "deleted") {
    where.deletedAt = null;
  }

  const [users, totalCount, verifiedCount, unverifiedCount] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        roles: true,
        isVerified: true,
        verificationTier: true,
        onboardingCompleted: true,
        deletedAt: true,
        createdAt: true,
        _count: {
          select: { ownedProperties: true, applications: true, notifications: true },
        },
      },
    }),
    prisma.user.count({ where }),
    prisma.user.count({ where: { ...where, isVerified: true } }),
    prisma.user.count({ where: { ...where, isVerified: false } }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <UsersListClient
      users={users as any}
      totalPages={totalPages}
      currentPage={page}
      totalCount={totalCount}
      verifiedCount={verifiedCount}
      unverifiedCount={unverifiedCount}
    />
  );
}
