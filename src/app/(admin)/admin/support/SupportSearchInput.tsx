"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function SupportSearchInput({
  defaultValue,
  filter,
  priority,
}: {
  defaultValue: string;
  filter: string;
  priority: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(defaultValue);

  const buildUrl = useCallback(
    (q: string) => {
      const p = new URLSearchParams(searchParams.toString());
      if (q) p.set("q", q);
      else p.delete("q");
      p.set("page", "1");
      return `${pathname}?${p.toString()}`;
    },
    [pathname, searchParams]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== defaultValue) {
        router.push(buildUrl(search));
      }
    }, 500);
    return () => clearTimeout(t);
  }, [search, defaultValue, router, buildUrl]);

  return (
    <div className="relative w-full sm:w-64 shrink-0">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search subject or user…"
        className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-zinc-900 transition-colors bg-white text-zinc-900 placeholder:text-zinc-400"
      />
    </div>
  );
}
