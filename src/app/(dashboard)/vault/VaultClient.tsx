"use client";

import { useState } from "react";
import Link from "next/link";

type VaultItem = {
  id: string;
  title: string;
  fileUrl: string;
  category: string;
  propertyId: string | null;
  isVerified: boolean;
  createdAt: string;
  property: { id: string; title: string } | null;
};

const CATEGORIES = ["ALL", "IDENTITY", "DEED", "RECEIPT", "LEGAL", "INSPECTION", "UTILITY"] as const;

const CATEGORY_STYLES: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  IDENTITY: {
    label: "Identity",
    cls: "bg-blue-50 text-blue-700",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  },
  DEED: {
    label: "Deed",
    cls: "bg-amber-50 text-amber-700",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  },
  RECEIPT: {
    label: "Receipt",
    cls: "bg-emerald-50 text-emerald-700",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  },
  LEGAL: {
    label: "Legal",
    cls: "bg-purple-50 text-purple-700",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  },
  INSPECTION: {
    label: "Inspection",
    cls: "bg-sky-50 text-sky-700",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  },
  UTILITY: {
    label: "Utility",
    cls: "bg-zinc-100 text-zinc-600",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function isExternalUrl(url: string) {
  return url.startsWith("http://") || url.startsWith("https://");
}

export default function VaultClient({ items: initialItems }: { items: VaultItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);

  // Upload form state
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadUrl, setUploadUrl] = useState("");
  const [uploadCategory, setUploadCategory] = useState("IDENTITY");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);
    setUploadError("");

    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: uploadTitle,
          fileUrl: uploadUrl,
          category: uploadCategory,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error ?? "Failed to add document. Please try again.");
        return;
      }

      setItems((prev) => [{ ...data.item, property: null }, ...prev]);
      setShowUpload(false);
      setUploadTitle("");
      setUploadUrl("");
      setUploadCategory("IDENTITY");
    } catch {
      setUploadError("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  const filtered = items.filter((item) => {
    const matchCat = filter === "ALL" || item.category === filter;
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const counts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = cat === "ALL" ? items.length : items.filter((i) => i.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Documents</p>
          <h1 className="text-2xl font-extrabold text-zinc-900">Vault</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Your verified documents, receipts, and identity records</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Total</p>
            <p className="text-2xl font-extrabold text-zinc-900">{items.length}</p>
          </div>
          {!showUpload && (
            <button
              type="button"
              onClick={() => setShowUpload(true)}
              className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors"
            >
              + Add document
            </button>
          )}
        </div>
      </div>

      {/* Upload form */}
      {showUpload && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Add Document</p>
          <form onSubmit={handleUpload} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="uploadTitle" className="text-xs font-bold uppercase tracking-widest text-zinc-400">Title</label>
              <input
                id="uploadTitle"
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g. NIN Slip, Tenancy Agreement"
                required
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="uploadUrl" className="text-xs font-bold uppercase tracking-widest text-zinc-400">Document URL</label>
              <input
                id="uploadUrl"
                type="url"
                value={uploadUrl}
                onChange={(e) => setUploadUrl(e.target.value)}
                placeholder="https://drive.google.com/…"
                required
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
              />
              <p className="text-xs text-zinc-400">Paste a link to your document (Google Drive, Dropbox, etc.)</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Category</label>
              <div className="grid grid-cols-3 gap-2">
                {(["IDENTITY", "DEED", "RECEIPT", "LEGAL", "INSPECTION", "UTILITY"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setUploadCategory(cat)}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                      uploadCategory === cat
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                    }`}
                  >
                    {CATEGORY_STYLES[cat]?.label ?? cat}
                  </button>
                ))}
              </div>
            </div>

            {uploadError && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {uploadError}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={uploading}
                className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Saving…" : "Save document"}
              </button>
              <button
                type="button"
                onClick={() => { setShowUpload(false); setUploadError(""); }}
                className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Category filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
              filter === cat
                ? "bg-zinc-900 text-white"
                : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400"
            }`}
          >
            {cat === "ALL" ? "All" : CATEGORY_STYLES[cat]?.label ?? cat}
            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
              filter === cat ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500"
            }`}>
              {counts[cat]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents…"
          className="w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-400 transition-colors"
        />
      </div>

      {/* Document list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-10 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <p className="text-sm font-bold text-zinc-700 mb-1">
            {search ? "No documents match your search" : "No documents yet"}
          </p>
          <p className="text-xs text-zinc-400 mb-4">
            {search ? "Try a different search term" : "Documents are added automatically when you verify your identity or complete transactions"}
          </p>
          {!search && (
            <Link href="/tenant/verification" className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors">
              Verify identity →
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
          {filtered.map((item) => {
            const cat = CATEGORY_STYLES[item.category];
            const isLink = isExternalUrl(item.fileUrl);

            return (
              <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                {/* Category icon */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cat?.cls ?? "bg-zinc-100 text-zinc-500"}`}>
                  {cat?.icon ?? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    </svg>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-zinc-900">{item.title}</p>
                    {item.isVerified && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cat?.cls ?? "bg-zinc-100 text-zinc-500"}`}>
                      {cat?.label ?? item.category}
                    </span>
                    {item.property && (
                      <Link href={`/properties/${item.property.id}`} className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors truncate">
                        {item.property.title}
                      </Link>
                    )}
                    <span className="text-xs text-zinc-400">{formatDate(item.createdAt)}</span>
                  </div>
                </div>

                {/* Action */}
                {isLink ? (
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-700 hover:border-zinc-400 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    View
                  </a>
                ) : (
                  <span className="shrink-0 text-xs text-zinc-300 font-mono truncate max-w-[120px]">
                    {item.fileUrl}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
