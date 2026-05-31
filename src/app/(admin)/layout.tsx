import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import SidebarNav from "@/app/components/SidebarNav";
import MobileNav from "@/app/components/MobileNav";
import { ADMIN_NAV_ITEMS } from "@/lib/nav-constants";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  });

  if (!user?.roles.includes("ADMIN")) redirect("/dashboard");

  const initials = session.user.name
    ?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "A";

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      <header className="w-full bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <Image 
              src="/hausevofinal.png" 
              alt="Hausevo Logo" 
              width={56} 
              height={56} 
              className="object-contain brightness-0 invert"
              priority
            />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 border border-zinc-700 rounded-full px-2 py-0.5 ml-1">
              Admin
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/properties" className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors hidden sm:block">
              Platform →
            </Link>
            <div className="flex items-center gap-2 rounded-full border border-zinc-700 pl-1 pr-3 py-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700 text-white text-xs font-bold">
                {initials}
              </span>
              <span className="text-sm font-semibold text-zinc-300 hidden sm:block max-w-[120px] truncate">
                {session.user.name?.split(" ")[0]}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 flex gap-8">
        <aside className="hidden md:flex flex-col w-52 shrink-0">
          <SidebarNav items={ADMIN_NAV_ITEMS} />
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <MobileNav items={ADMIN_NAV_ITEMS} />
    </div>
  );
}
