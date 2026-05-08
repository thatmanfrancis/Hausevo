"use client";

import { useState } from "react";
import Link from "next/link";

type VaultItem = {
  id: string;
  title: string;
  fileUrl: string;
  category: string;
  isVerified: boolean;
  createdAt: Date;
  property?: { title: string } | null;
};

const CATEGORIES = [
  { id: "ALL", label: "All Items" },
  { id: "IDENTITY", label: "Identity (NIN/CAC)" },
  { id: "DEED", label: "Title Deeds" },
  { id: "RECEIPT", label: "Receipts" },
  { id: "REPORT", label: "Reports" },
  { id: "LEGAL", label: "Legal/POA" },
];

export default function VaultClient({ items }: { items: VaultItem[] }) {
  const [filter, setFilter] = useState("ALL");

  const filteredItems = items.filter(
    (item) => filter === "ALL" || item.category === filter
  );

  function formatDate(d: Date) {
    return new Date(d).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white border border-zinc-700">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </span>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Secure Storage</p>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">Shack Vault</h1>
          <p className="text-sm text-zinc-500 mt-2 max-w-md">
            Your single source of truth for all property documentation, receipts, and condition reports.
          </p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-zinc-100 rounded-full border border-zinc-200">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={`px-4 py-2 text-xs font-bold rounded-full transition-all ${
                filter === cat.id
                  ? "bg-white text-zinc-900 border border-zinc-200"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-16 flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-50 border border-zinc-100 mb-6 text-zinc-300">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </div>
          <p className="text-lg font-extrabold text-zinc-900 mb-1">Your vault is empty</p>
          <p className="text-sm text-zinc-500 max-w-xs">
            Documents appear here when you upload your identity, deeds, or when agreements are signed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-zinc-200 p-5 flex flex-col group hover:border-zinc-900 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                  item.category === "RECEIPT" ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                  item.category === "DEED" ? "bg-amber-50 border-amber-100 text-amber-600" :
                  item.category === "IDENTITY" ? "bg-zinc-900 border-zinc-700 text-white" :
                  "bg-blue-50 border-blue-100 text-blue-600"
                }`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                {item.isVerified && (
                  <span className="bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                    Verified
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-zinc-900 mb-1 group-hover:underline underline-offset-2">
                {item.title}
              </h3>
              <p className="text-[10px] text-zinc-400 font-medium mb-4">
                {item.property ? item.property.title : "Account Documentation (One-Time)"} · {formatDate(item.createdAt)}
              </p>
              <div className="mt-auto pt-4 border-t border-zinc-50 flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{item.category}</span>
                <button className="text-xs font-bold text-zinc-900 hover:text-zinc-600 flex items-center gap-1.5">
                  View Document
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
