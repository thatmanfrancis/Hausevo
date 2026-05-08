import prisma from "@/lib/prisma";
import ArtisansListClient from "./ArtisansListClient";
import { ArtisanCategory } from "@/generated/prisma/enums";

export default async function AdminArtisansPage(props: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const q = searchParams.q || "";
  const category = searchParams.category || "";
  const status = searchParams.status || "";
  const page = parseInt(searchParams.page || "1", 10);
  const pageSize = 10;

  const where: any = {
    roles: {
      has: "ARTISAN",
    },
  };

  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  if (category) {
    where.artisanProfile = {
      category: category as any,
    };
  }

  if (status) {
    if (status === "vetted") {
      where.artisanProfile = { ...where.artisanProfile, isVetted: true };
    } else if (status === "pending") {
      where.artisanProfile = { ...where.artisanProfile, isVetted: false };
    } else if (status === "unprofiled") {
      where.artisanProfile = null;
    }
  }

  const [artisans, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        artisanProfile: true,
      },
      orderBy: { fullName: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const categories = Object.values(ArtisanCategory);

  return (
    <ArtisansListClient
      artisans={artisans as any}
      totalPages={totalPages}
      currentPage={page}
      categories={categories}
    />
  );
}
