import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { ArtisanCategory } from "@/generated/prisma/enums";
import ArtisanCreateClient from "./ArtisanCreateClient";

export default async function AdminArtisanCreatePage(props: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const searchParams = await props.searchParams;
  const userId = searchParams.userId;

  if (!userId) redirect("/admin/artisans");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { artisanProfile: true },
  });

  if (!user) notFound();
  if (!user.roles.includes("ARTISAN")) {
    // Maybe we should allow adding the role here?
    // For now, let's redirect back if they aren't an artisan yet.
    redirect("/admin/artisans");
  }

  if (user.artisanProfile) {
    // Already has a profile, redirect to details
    redirect(`/admin/artisans/${user.artisanProfile.id}`);
  }

  const categories = Object.values(ArtisanCategory);

  return <ArtisanCreateClient user={user} categories={categories} />;
}
