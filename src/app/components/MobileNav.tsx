"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

export default function MobileNav({ items }: { items: NavItem[] }) {
  const [trayOpen, setTrayOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const primary = items.slice(0, 4);
  const secondary = items.slice(4);

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
    <>
      {trayOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setTrayOpen(false)}
        />
      )}

      {/* More tray */}
      <div className={`md:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-200 ${
        trayOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
      }`}>
        <div className="bg-zinc-900 rounded-2xl px-4 py-3 border border-zinc-800 flex flex-col gap-1 min-w-[180px]">
          {secondary.map((item) => {
            const isNotifications = item.href === "/notifications";
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setTrayOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive(item.href)
                    ? "bg-white/15 text-white"
                    : "text-zinc-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className={`relative ${isActive(item.href) ? "text-white" : "text-zinc-400"}`}>
                  {item.icon}
                  {isNotifications && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </span>
                {item.label}
                {isNotifications && unreadCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500/20 px-1 text-[10px] font-bold text-red-400">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="border-t border-zinc-800 mt-1 pt-1">
            <LogoutButton compact />
          </div>
        </div>
      </div>

      {/* Floating pill nav */}
      <nav
        className="md:hidden fixed bottom-5 z-50"
        style={{ left: '1rem', right: '1rem', maxWidth: '28rem', marginLeft: 'auto', marginRight: 'auto' }}
      >
        <div className="flex items-center justify-evenly bg-zinc-900 rounded-full px-2 py-2.5 border border-zinc-800">
          {primary.map((item) => {
            const isNotifications = item.href === "/notifications";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-2.5 min-[380px]:px-3.5 min-[410px]:px-4 py-2 rounded-full transition-colors ${
                  isActive(item.href)
                    ? "text-white bg-white/20"
                    : "text-zinc-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="relative">
                  {item.icon}
                  {isNotifications && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[7px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </span>
                <span className="text-[9px] font-bold tracking-wide">{item.label}</span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setTrayOpen((o) => !o)}
            className={`flex flex-col items-center gap-1 px-2.5 min-[380px]:px-3.5 min-[410px]:px-4 py-2 rounded-full transition-colors ${
              trayOpen ? "text-white bg-white/10" : "text-zinc-400 hover:text-white hover:bg-white/10"
            }`}
            aria-label="More options"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="5" r="1" fill="currentColor"/>
              <circle cx="12" cy="12" r="1" fill="currentColor"/>
              <circle cx="12" cy="19" r="1" fill="currentColor"/>
            </svg>
            <span className="text-[9px] font-bold tracking-wide">More</span>
          </button>
        </div>
      </nav>

      {/* Spacer */}
      <div className="md:hidden h-24" />
    </>
  );
}
