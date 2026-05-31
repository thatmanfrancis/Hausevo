import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import GuarantorClient from "./GuarantorClient";

export default async function PublicGuarantorPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const guarantor = await prisma.guarantor.findUnique({
    where: { token },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      relationship: true,
      status: true,
      isEmergency: true,
      acknowledgedAt: true,
      token: true,
      user: {
        select: { fullName: true },
      },
      application: {
        select: {
          property: {
            select: { title: true, address: true, lga: true },
          },
        },
      },
    },
  });

  if (!guarantor) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Hausevo Branding */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="text-xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-1.5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-zinc-900">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Hausevo
          </Link>
        </div>

        <GuarantorClient guarantor={guarantor} />
      </div>
    </div>
  );
}
