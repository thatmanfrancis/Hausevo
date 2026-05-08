"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LogoutButton from "./LogoutButton";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

export default function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch("/api/notifications/unread-count");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count ?? 0);
        }
      } catch {}
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/landlord/dashboard") return pathname === "/landlord/dashboard";
    if (href === "/admin/dashboard") return pathname === "/admin/dashboard";
    if (href === "/artisan/dashboard") return pathname === "/artisan/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav className="bg-white rounded-2xl border border-zinc-200 p-3 flex flex-col gap-0.5 sticky top-24">
      {items.map((item) => {
        const active = isActive(item.href);
        const isNotifications = item.href === "/notifications";
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors group ${
              active
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
            }`}
          >
            <span
              className={`relative transition-colors ${
                active ? "text-white" : "text-zinc-400 group-hover:text-zinc-700"
              }`}
            >
              {item.icon}
              {isNotifications && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </span>
            {item.label}
            {isNotifications && unreadCount > 0 && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 px-1 text-[10px] font-bold text-red-600">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        );
      })}
      <div className="mt-3 pt-3 border-t border-zinc-100">
        <LogoutButton compact />
      </div>
    </nav>
  );
}
