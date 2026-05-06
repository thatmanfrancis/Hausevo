"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";

type NavItem = { href: string; label: string; icon: React.ReactNode };

export default function LandlordSidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/landlord/dashboard") return pathname === "/landlord/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav className="bg-white rounded-2xl border border-zinc-200 p-3 flex flex-col gap-0.5 sticky top-24">
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors group ${
              active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
            }`}
          >
            <span className={`transition-colors ${active ? "text-white" : "text-zinc-400 group-hover:text-zinc-700"}`}>
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
      <div className="mt-3 pt-3 border-t border-zinc-100">
        <LogoutButton compact />
      </div>
    </nav>
  );
}
