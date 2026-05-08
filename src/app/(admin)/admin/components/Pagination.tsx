"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export default function Pagination({ totalPages }: { totalPages: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      {currentPage > 1 ? (
        <Link
          href={`${pathname}?page=${currentPage - 1}`}
          className="px-3 py-1.5 text-xs font-bold bg-white border border-zinc-200 rounded-full text-zinc-600 hover:bg-zinc-50"
        >
          Previous
        </Link>
      ) : (
        <span className="px-3 py-1.5 text-xs font-bold bg-zinc-50 border border-zinc-100 rounded-full text-zinc-300 cursor-not-allowed">
          Previous
        </span>
      )}
      
      <span className="text-xs font-bold text-zinc-500 mx-2">
        Page {currentPage} of {totalPages}
      </span>

      {currentPage < totalPages ? (
        <Link
          href={`${pathname}?page=${currentPage + 1}`}
          className="px-3 py-1.5 text-xs font-bold bg-white border border-zinc-200 rounded-full text-zinc-600 hover:bg-zinc-50"
        >
          Next
        </Link>
      ) : (
        <span className="px-3 py-1.5 text-xs font-bold bg-zinc-50 border border-zinc-100 rounded-full text-zinc-300 cursor-not-allowed">
          Next
        </span>
      )}
    </div>
  );
}
