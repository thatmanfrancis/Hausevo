import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ArtisanCategory } from "@/generated/prisma/enums";
import ArtisanDetailClient from "./ArtisanDetailClient";

export default async function AdminArtisanDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  const artisan = await prisma.artisanProfile.findUnique({
    where: { id },
    include: {
      user: {
        include: {
          maintenanceJobs: {
            include: {
              property: { select: { title: true, address: true } }
            },
            orderBy: { createdAt: "desc" }
          },
          transactions: {
            where: { type: "REPAIR" },
            orderBy: { createdAt: "desc" }
          }
        }
      }
    }
  });

  if (!artisan) notFound();
  
  const categories = Object.values(ArtisanCategory);

  return <ArtisanDetailClient artisan={artisan as any} categories={categories} />;
}
