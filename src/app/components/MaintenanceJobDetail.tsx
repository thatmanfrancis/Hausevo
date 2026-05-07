"use client";

import Image from "next/image";
import { useState } from "react";

type MaintenanceJob = {
  id: string;
  title: string;
  description: string;
  status: string;
  cost: number | null;
  beforePhotos: string[];
  afterPhotos: string[];
  createdAt: Date;
  property: { title: string; lga: string };
  artisan: { fullName: string; specialty: string } | null;
};

export default function MaintenanceJobDetail({ job }: { job: MaintenanceJob }) {
  const [view, setView] = useState<"before" | "after">("after");

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Maintenance Record</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              job.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"
            }`}>
              {job.status}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-zinc-900">{job.title}</h2>
          <p className="text-sm text-zinc-400">{job.property.title} · {job.property.lga}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Total Cost</p>
          <p className="text-2xl font-extrabold text-zinc-900">
            {job.cost ? `₦${job.cost.toLocaleString()}` : "Pending"}
          </p>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Photos */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Visual Evidence</p>
            <div className="flex bg-zinc-100 p-1 rounded-full">
              <button
                onClick={() => setView("before")}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                  view === "before" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                BEFORE
              </button>
              <button
                onClick={() => setView("after")}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                  view === "after" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                AFTER
              </button>
            </div>
          </div>

          <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200">
            {view === "before" ? (
              job.beforePhotos.length > 0 ? (
                <Image src={job.beforePhotos[0]} alt="Before" fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                  </svg>
                  <span className="text-[10px] font-bold mt-2">NO BEFORE PHOTO</span>
                </div>
              )
            ) : (
              job.afterPhotos.length > 0 ? (
                <Image src={job.afterPhotos[0]} alt="After" fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                  </svg>
                  <span className="text-[10px] font-bold mt-2">NO AFTER PHOTO</span>
                </div>
              )
            )}
            
            {/* View Toggle Overlay Label */}
            <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] font-bold text-white uppercase tracking-widest">
              {view} view
            </div>
          </div>
          
          <p className="mt-4 text-xs text-zinc-500 leading-relaxed italic">
            "Photos are digitally timestamped and stored in the Shack Vault for dispute resolution."
          </p>
        </div>

        {/* Right: Details */}
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Scope of Work</p>
            <p className="text-sm text-zinc-700 leading-relaxed bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
              {job.description}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Assigned Artisan</p>
            {job.artisan ? (
              <div className="flex items-center gap-3 p-3 rounded-2xl border border-zinc-100">
                <div className="h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center text-white text-xs font-bold">
                  {job.artisan.fullName[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-900">{job.artisan.fullName}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{job.artisan.specialty}</p>
                </div>
                <div className="ml-auto flex items-center gap-1 text-emerald-600">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span className="text-xs font-bold">4.9</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-400 italic">No artisan assigned yet.</p>
            )}
          </div>

          <div className="mt-auto pt-6 border-t border-zinc-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Logged On</p>
              <p className="text-xs font-bold text-zinc-900">{new Date(job.createdAt).toLocaleDateString()}</p>
            </div>
            <button className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-xs font-bold hover:bg-zinc-700 transition-colors">
              Download Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
