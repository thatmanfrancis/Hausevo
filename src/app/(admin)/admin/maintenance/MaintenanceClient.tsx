"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminCreateMaintenanceJob, adminUpdateMaintenanceJob } from "../actions";

type Job = {
  id: string;
  title: string;
  description: string;
  status: string;
  cost: number | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  property: { title: string; lga: string };
  artisan: { fullName: string } | null;
};

type Props = {
  jobs: Job[];
  totalJobs: number;
  totalPages: number;
  currentPage: number;
  currentFilter: string;
};

const statusColors: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-700",
  ASSIGNED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  VERIFIED: "bg-emerald-200 text-emerald-800",
  PAID: "bg-zinc-100 text-zinc-500",
  DISPUTED: "bg-red-100 text-red-700",
};

const ALL_STATUSES = ["OPEN","ASSIGNED","IN_PROGRESS","COMPLETED","VERIFIED","PAID","DISPUTED"];

// ── Create Job Modal ──────────────────────────────────────────────────────

function CreateJobModal({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [propertySearch, setPropertySearch] = useState("");
  const [propertyResults, setPropertyResults] = useState<{ id: string; title: string; lga: string }[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<{ id: string; title: string } | null>(null);
  const [artisanSearch, setArtisanSearch] = useState("");
  const [artisanResults, setArtisanResults] = useState<{ id: string; fullName: string }[]>([]);
  const [selectedArtisan, setSelectedArtisan] = useState<{ id: string; fullName: string } | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [searchingProp, setSearchingProp] = useState(false);
  const [searchingArt, setSearchingArt] = useState(false);
  const [propTimer, setPropTimer] = useState<NodeJS.Timeout | null>(null);
  const [artTimer, setArtTimer] = useState<NodeJS.Timeout | null>(null);

  function handlePropertySearch(val: string) {
    setPropertySearch(val);
    if (propTimer) clearTimeout(propTimer);
    if (val.length < 2) { setPropertyResults([]); return; }
    const t = setTimeout(async () => {
      setSearchingProp(true);
      const res = await fetch(`/api/admin/properties/search?q=${encodeURIComponent(val)}`);
      if (res.ok) setPropertyResults(await res.json());
      setSearchingProp(false);
    }, 400);
    setPropTimer(t);
  }

  function handleArtisanSearch(val: string) {
    setArtisanSearch(val);
    if (artTimer) clearTimeout(artTimer);
    if (val.length < 2) { setArtisanResults([]); return; }
    const t = setTimeout(async () => {
      setSearchingArt(true);
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(val)}&role=ARTISAN`);
      if (res.ok) setArtisanResults(await res.json());
      setSearchingArt(false);
    }, 400);
    setArtTimer(t);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProperty) { setError("Select a property."); return; }
    if (!title.trim()) { setError("Title is required."); return; }
    setSaving(true); setError("");
    const res = await adminCreateMaintenanceJob({
      propertyId: selectedProperty.id,
      title: title.trim(),
      description: description.trim(),
      artisanId: selectedArtisan?.id,
      cost: cost ? parseFloat(cost) : undefined,
    });
    setSaving(false);
    if (res.success) { setOpen(false); onCreated(); }
    else setError(res.message ?? "Failed");
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="rounded-full bg-zinc-900 text-white px-4 py-2 text-xs font-bold hover:bg-zinc-700 transition-colors flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Create Job
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-zinc-200 w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-100 shrink-0">
              <p className="text-sm font-extrabold text-zinc-900">Create Maintenance Job</p>
              <button type="button" onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100 transition-colors text-zinc-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">
              {/* Property */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Property *</label>
                {selectedProperty ? (
                  <div className="flex items-center justify-between bg-zinc-50 rounded-xl border border-zinc-200 px-4 py-2.5">
                    <p className="text-sm font-bold text-zinc-900">{selectedProperty.title}</p>
                    <button type="button" onClick={() => setSelectedProperty(null)} className="text-xs text-zinc-400 hover:text-zinc-700">Change</button>
                  </div>
                ) : (
                  <div className="relative">
                    <input type="text" value={propertySearch} onChange={(e) => handlePropertySearch(e.target.value)}
                      placeholder="Search property…"
                      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors" />
                    {(propertyResults.length > 0 || searchingProp) && (
                      <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white rounded-xl border border-zinc-200 overflow-hidden">
                        {searchingProp ? <p className="px-4 py-3 text-xs text-zinc-400">Searching…</p> :
                          propertyResults.map((p) => (
                            <button key={p.id} type="button" onClick={() => { setSelectedProperty(p); setPropertySearch(""); setPropertyResults([]); }}
                              className="w-full text-left px-4 py-2.5 hover:bg-zinc-50 border-b border-zinc-50 last:border-0">
                              <p className="text-sm font-bold text-zinc-900 truncate">{p.title}</p>
                              <p className="text-xs text-zinc-400">{p.lga}</p>
                            </button>
                          ))
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Title *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Fix leaking roof"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors" />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors resize-none" />
              </div>

              {/* Artisan */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Assign Artisan (optional)</label>
                {selectedArtisan ? (
                  <div className="flex items-center justify-between bg-zinc-50 rounded-xl border border-zinc-200 px-4 py-2.5">
                    <p className="text-sm font-bold text-zinc-900">{selectedArtisan.fullName}</p>
                    <button type="button" onClick={() => setSelectedArtisan(null)} className="text-xs text-zinc-400 hover:text-zinc-700">Remove</button>
                  </div>
                ) : (
                  <div className="relative">
                    <input type="text" value={artisanSearch} onChange={(e) => handleArtisanSearch(e.target.value)}
                      placeholder="Search artisan…"
                      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors" />
                    {(artisanResults.length > 0 || searchingArt) && (
                      <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white rounded-xl border border-zinc-200 overflow-hidden">
                        {searchingArt ? <p className="px-4 py-3 text-xs text-zinc-400">Searching…</p> :
                          artisanResults.map((a) => (
                            <button key={a.id} type="button" onClick={() => { setSelectedArtisan(a); setArtisanSearch(""); setArtisanResults([]); }}
                              className="w-full text-left px-4 py-2.5 hover:bg-zinc-50 border-b border-zinc-50 last:border-0">
                              <p className="text-sm font-bold text-zinc-900">{a.fullName}</p>
                            </button>
                          ))
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Cost */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Estimated Cost (₦)</label>
                <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} min="0" placeholder="Leave blank if unknown"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors" />
              </div>

              {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

              <div className="flex items-center gap-3 pt-1">
                <button type="submit" disabled={saving}
                  className="flex-1 rounded-full bg-zinc-900 text-white py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50">
                  {saving ? "Creating…" : "Create Job"}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ── Update Status Modal ───────────────────────────────────────────────────

function UpdateStatusModal({ job, onUpdated }: { job: Job; onUpdated: () => void }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(job.status);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await adminUpdateMaintenanceJob(job.id, { status });
    setSaving(false);
    setOpen(false);
    onUpdated();
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-900 transition-colors">
        Update
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 w-full max-w-xs">
            <p className="text-sm font-extrabold text-zinc-900 mb-4">Update Status</p>
            <p className="text-xs text-zinc-500 mb-3 truncate">{job.title}</p>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-colors mb-4">
              {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setOpen(false)} className="flex-1 py-2 rounded-full border border-zinc-200 text-sm font-bold text-zinc-600 hover:border-zinc-400 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2 rounded-full bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export default function MaintenanceClient({ jobs, totalJobs, totalPages, currentPage, currentFilter }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function refresh() { startTransition(() => router.refresh()); }

  function goToPage(p: number) {
    const params = new URLSearchParams();
    if (currentFilter && currentFilter !== "ALL") params.set("filter", currentFilter);
    params.set("page", String(p));
    router.push(`/admin/maintenance?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filters + create */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-2 flex-wrap flex-1">
          {["ALL","OPEN","IN_PROGRESS","COMPLETED","DISPUTED"].map((s) => (
            <a key={s} href={`/admin/maintenance?filter=${s}`}
              className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors ${
                currentFilter === s ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-200 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900"
              }`}>
              {s}
            </a>
          ))}
        </div>
        <CreateJobModal onCreated={refresh} />
      </div>

      {/* Job cards */}
      <div className="flex flex-col gap-3">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white rounded-2xl border border-zinc-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${statusColors[job.status] ?? "bg-zinc-100 text-zinc-500"}`}>
                    {job.status}
                  </span>
                </div>
                <p className="text-sm font-bold text-zinc-900">{job.title}</p>
                <p className="text-xs text-zinc-400 mt-0.5 truncate">{job.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {job.cost != null && (
                  <p className="text-sm font-bold text-zinc-700 whitespace-nowrap">₦{job.cost.toLocaleString()}</p>
                )}
                <UpdateStatusModal job={job} onUpdated={refresh} />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-50 text-xs text-zinc-400">
              <span className="truncate">📍 {job.property.title} · {job.property.lga}</span>
              {job.artisan && <span className="shrink-0">🔧 {job.artisan.fullName}</span>}
              <span className="ml-auto shrink-0">{new Date(job.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
          </div>
        ))}
        {jobs.length === 0 && (
          <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center">
            <p className="text-sm font-bold text-zinc-400">No maintenance jobs found.</p>
          </div>
        )}
      </div>

      {/* Always-visible pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-400 font-semibold">{totalJobs} total · Page {currentPage} of {Math.max(totalPages, 1)}</p>
        <div className="flex items-center gap-1">
          <button disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:border-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span className="text-xs font-bold text-zinc-600 px-2">{currentPage} / {Math.max(totalPages, 1)}</span>
          <button disabled={currentPage >= totalPages} onClick={() => goToPage(currentPage + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:border-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
