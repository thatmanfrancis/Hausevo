"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { updatePropertyDetails } from "../../actions";

export default function AdminPropertyDetailsClient({
  property,
}: {
  property: any;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState(property.title);
  const [pricePerYear, setPricePerYear] = useState(
    property.pricePerYear.toString(),
  );
  const [totalPackage, setTotalPackage] = useState(
    property.totalPackage.toString(),
  );
  const [healthScore, setHealthScore] = useState(
    property.healthScore.toString(),
  );
  const [deedVerified, setDeedVerified] = useState(property.deedVerified || false);
  const [priceVerified, setPriceVerified] = useState(property.priceVerified || false);

  function formatNaira(n: number) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(n);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await updatePropertyDetails(property.id, {
        title,
        pricePerYear,
        totalPackage,
        healthScore,
        deedVerified,
        priceVerified,
      });

      if (res.success) {
        setIsEditing(false);
      } else {
        alert(res.message);
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/properties"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 transition-colors"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Admin
              </span>
              <span className="text-xs text-zinc-300">/</span>
              <Link
                href="/admin/properties"
                className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600"
              >
                Properties
              </Link>
              <span className="text-xs text-zinc-300">/</span>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Details
              </p>
            </div>
            <h1 className="text-2xl font-extrabold text-zinc-900">
              {property.title}
            </h1>
          </div>
        </div>

        {/* Toggle Edit Mode */}
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-2.5 rounded-full bg-zinc-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors"
          >
            Edit Mode
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(false)}
            className="px-6 py-2.5 rounded-full border border-zinc-200 text-zinc-600 text-xs font-bold uppercase tracking-widest hover:bg-zinc-50 transition-colors"
          >
            Cancel Editing
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Property Details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Images (Only visible in View Mode) */}
          {!isEditing && (
            <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden p-2">
              <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-2">
                {property.images.length > 0 ? (
                  property.images.map((img: any) => (
                    <div
                      key={img.id}
                      className="relative h-64 w-80 shrink-0 snap-center rounded-xl overflow-hidden bg-zinc-100 border border-zinc-100"
                    >
                      <Image
                        src={img.url}
                        alt="Property image"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))
                ) : (
                  <div className="h-64 w-full flex items-center justify-center bg-zinc-50 rounded-xl">
                    <span className="text-sm font-bold text-zinc-400">
                      No images uploaded
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Details Card */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            {!isEditing ? (
              <>
                {/* View Mode */}
                <div className="flex items-center gap-3 mb-6">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                      property.status === "AVAILABLE"
                        ? "bg-emerald-100 text-emerald-700"
                        : property.status === "PENDING"
                          ? "bg-amber-100 text-amber-700"
                          : property.status === "FLAGGED"
                            ? "bg-red-100 text-red-700"
                            : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {property.status}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-zinc-100 text-zinc-500">
                    {property.listingType}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                    Health Score: {property.healthScore}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                      Price Per Year
                    </p>
                    <p className="text-lg font-bold text-zinc-900">
                      {formatNaira(property.pricePerYear)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                      Total Package
                    </p>
                    <p className="text-lg font-bold text-zinc-900">
                      {formatNaira(property.totalPackage)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                      Address
                    </p>
                    <p className="text-sm font-semibold text-zinc-700">
                      {property.address}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {property.lga}, Lagos
                    </p>
                  </div>
                </div>

                {/* Verifications Display */}
                <div className="mt-8 pt-6 border-t border-zinc-100">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Verifications</h4>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${property.deedVerified ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                      <span className="text-xs font-semibold text-zinc-700">Deed {property.deedVerified ? 'Verified' : 'Unverified'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${property.priceVerified ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                      <span className="text-xs font-semibold text-zinc-700">Price {property.priceVerified ? 'Verified' : 'Unverified'}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* Edit Mode Form */
              <form onSubmit={handleSave} className="flex flex-col gap-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                    EDITING MODE
                  </span>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
                      Price Per Year (NGN)
                    </label>
                    <input
                      type="number"
                      required
                      value={pricePerYear}
                      onChange={(e) => setPricePerYear(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
                      Total Package (NGN)
                    </label>
                    <input
                      type="number"
                      required
                      value={totalPackage}
                      onChange={(e) => setTotalPackage(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
                    Health Score (0 - 100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={healthScore}
                    onChange={(e) => setHealthScore(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                  />
                  <p className="text-[10px] text-zinc-500 mt-2">
                    Affects visibility and ranking on the platform. 100 is
                    excellent.
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-100">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Verifications</h4>
                  <div className="flex flex-col gap-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" className="sr-only peer" checked={deedVerified} onChange={(e) => setDeedVerified(e.target.checked)} />
                        <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </div>
                      <span className="text-sm font-medium text-zinc-900">Deed Verified</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" className="sr-only peer" checked={priceVerified} onChange={(e) => setPriceVerified(e.target.checked)} />
                        <div className="w-10 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </div>
                      <span className="text-sm font-medium text-zinc-900">Price Verified</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-8 py-3 rounded-xl bg-zinc-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Owner & Docs */}
        <div className="flex flex-col gap-6">
          {/* Owner Details */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">
              Owner Information
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
                <span className="font-extrabold text-zinc-500">
                  {property.landlord.fullName.charAt(0)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-zinc-900 truncate">
                  {property.landlord.fullName}
                </p>
                {property.landlord.isVerified ? (
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Verified Landlord
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-600 mt-0.5 block">
                    Unverified
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-zinc-100">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                  Email
                </p>
                <p className="text-xs font-semibold text-zinc-700 truncate">
                  {property.landlord.email}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                  Phone
                </p>
                <p className="text-xs font-semibold text-zinc-700">
                  {property.landlord.phoneNumber || "Not provided"}
                </p>
              </div>
            </div>

            {/* Bank Accounts */}
            <div className="space-y-3 pt-4 mt-4 border-t border-zinc-100">
              <h3 className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
                Bank Accounts
              </h3>
              {property.landlord.bankAccounts?.length > 0 ? (
                property.landlord.bankAccounts.map((acc: any) => (
                  <div
                    key={acc.id}
                    className="bg-zinc-50 rounded-lg p-3 border border-zinc-100"
                  >
                    <p className="text-[10px] font-bold text-zinc-800">
                      {acc.bankName}
                    </p>
                    <p className="text-sm font-semibold tracking-widest text-zinc-600 my-0.5">
                      {acc.accountNumber}
                    </p>
                    <p className="text-[9px] font-bold uppercase text-zinc-400">
                      {acc.accountName}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-[10px] text-zinc-500 italic">
                  No bank accounts linked.
                </p>
              )}
            </div>
          </div>

          {/* Vault Documents */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">
              Vault Documents
            </h3>
            <div className="flex flex-col gap-3">
              {property.vaultItems.length > 0 ? (
                property.vaultItems.map((item: any) => (
                  <a
                    key={item.id}
                    href={item.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 bg-zinc-50 hover:bg-white hover:border-zinc-200 transition-colors"
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-xs font-bold text-zinc-700 truncate">
                        {item.title}
                      </p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mt-0.5">
                        {item.category}
                      </p>
                    </div>
                    {item.isVerified ? (
                      <span className="shrink-0 text-emerald-500">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      </span>
                    ) : (
                      <span className="shrink-0 text-amber-500">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                      </span>
                    )}
                  </a>
                ))
              ) : (
                <p className="text-xs text-zinc-500 text-center py-4 bg-zinc-50 rounded-xl border border-zinc-100">
                  No documents found.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
