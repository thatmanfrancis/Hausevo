import prisma from "@/lib/prisma";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import AdminPropertyDetailsClient from "./AdminPropertyDetailsClient";

export default async function AdminPropertyDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const resolvedParams = await params;
  const propertyId = resolvedParams.id;

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      landlord: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          isVerified: true,
          verificationTier: true,
          bankAccounts: {
            select: {
              id: true,
              bankName: true,
              accountName: true,
              accountNumber: true,
            }
          }
        },
      },
      images: {
        orderBy: { order: "asc" },
      },
      vaultItems: true,
    },
  });

  if (!property) {
    return (
      <div className="flex flex-col gap-6 items-center justify-center py-20 text-center">
        <h1 className="text-2xl font-extrabold text-zinc-900">Property Not Found</h1>
        <p className="text-sm text-zinc-500">The property you are looking for does not exist.</p>
        <Link href="/admin/properties" className="mt-4 px-6 py-3 rounded-full bg-zinc-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors">
          Back to Properties
        </Link>
      </div>
    );
  }

  return <AdminPropertyDetailsClient property={property} />;
}
