import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import MobileNav from "@/app/components/MobileNav";
import LandlordMobileNav from "@/app/components/LandlordMobileNav";
import SidebarNav from "@/app/components/SidebarNav";
import LandlordSidebarNav from "@/app/components/LandlordSidebarNav";
import AIFloatingWidget from "@/app/components/AIFloatingWidget";
import { TENANT_NAV_ITEMS, LANDLORD_NAV_ITEMS, ARTISAN_NAV_ITEMS } from "@/lib/nav-constants";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  });

  if (!user?.roles) redirect("/auth/login");
  if (user?.roles.includes("ADMIN")) redirect("/admin/dashboard");

  const isLandlord = user?.roles.includes("LANDLORD");
  const isArtisan = user?.roles.includes("ARTISAN");
  
  const navItems = isLandlord 
    ? LANDLORD_NAV_ITEMS 
    : isArtisan 
      ? ARTISAN_NAV_ITEMS 
      : TENANT_NAV_ITEMS;

  const initials = session.user.name
    ?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "U";

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {/* Top navbar — same as public but simplified */}
      <header className="w-full bg-white border-b border-zinc-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
          <Link href="/" className="flex items-center gap-2">
            <Image 
              src="/hausevofinal.png" 
              alt="Hausevo Logo" 
              width={56} 
              height={56} 
              className="object-contain"
              priority
            />
            {isLandlord && (
              <span className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-zinc-400 border border-zinc-200 rounded-full px-2 py-0.5 ml-1">
                Landlord
              </span>
            )}
            {isArtisan && (
              <span className="hidden sm:block text-[10px] font-bold uppercase tracking-widest text-zinc-400 border border-zinc-200 rounded-full px-2 py-0.5 ml-1">
                Artisan
              </span>
            )}
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/properties" className="text-xs font-semibold text-zinc-400 hover:text-zinc-900 transition-colors hidden sm:block">
              Browse →
            </Link>
            <div className="flex items-center gap-2 rounded-full border border-zinc-200 pl-1 pr-3 py-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-white text-xs font-bold">
                {initials}
              </span>
              <span className="text-sm font-semibold text-zinc-700 hidden sm:block max-w-[120px] truncate">
                {session.user.name?.split(" ")[0]}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-8 flex gap-8">
        {/* ── Sidebar ── */}
        <aside className="hidden md:flex flex-col w-52 shrink-0">
          {isLandlord ? (
            <LandlordSidebarNav items={navItems} />
          ) : (
            <SidebarNav items={navItems} />
          )}
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* ── Mobile floating nav ── */}
      {isLandlord ? (
        <LandlordMobileNav items={navItems} />
      ) : (
        <MobileNav items={navItems} />
      )}

      {/* ── AI floating widget ── */}
      <AIFloatingWidget userName={session.user.name ?? "there"} />
    </div>
  );
}

