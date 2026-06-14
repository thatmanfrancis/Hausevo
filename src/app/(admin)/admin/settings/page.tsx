import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import AdminSettingsClient from "./AdminSettingsClient";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const [user, notificationPreferences] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        twoFactorEnabled: true,
      },
    }),
    prisma.notificationPreferences.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id },
      update: {},
    }),
  ]);

  if (!user) redirect("/auth/login");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 mb-1">
        <Link href="/admin/dashboard" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600">Admin</Link>
        <span className="text-xs text-zinc-300">/</span>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Settings</p>
      </div>
      <AdminSettingsClient user={user} notificationPreferences={notificationPreferences} />
    </div>
  );
}
