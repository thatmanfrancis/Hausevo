"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminCreateDispute } from "../actions";

const DISPUTE_TYPES = ["MAINTENANCE","RENT","CAUTION_DEPOSIT","PROPERTY_CONDITION"];

export default function CreateDisputeModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [raisedBySearch, setRaisedBySearch] = useState("");
  const [raisedByResults, setRaisedByResults] = useState<{ id: string; fullName: string; email: string }[]>([]);
  const [selectedRaisedBy, setSelectedRaisedBy] = useState<{ id: string; fullName: string } | null>(null);

  const [againstSearch, setAgainstSearch] = useState("");
  const [againstResults, setAgainstResults] = useState<{ id: string; fullName: string; email: string }[]>([]);
  const [selectedAgainst, setSelectedAgainst] = useState<{ id: string; fullName: string } | null>(null);

  const [type, setType] = useState("RENT");
  const [description, setDescription] = useState("");

  const [timers, setTimers] = useState<Record<string, NodeJS.Timeout | null>>({});

  function debounceSearch(key: string, val: string, setter: (r: any[]) => void) {
    if (timers[key]) clearTimeout(timers[key]!);
    if (val.length < 2) { setter([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(val)}`);
      if (res.ok) setter(await res.json());
    }, 400);
    setTimers((p) => ({ ...p, [key]: t }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRaisedBy || !selectedAgainst) { setError("Both parties are required."); return; }
    if (!description.trim()) { setError("Description is required."); return; }
    setSaving(true); setError("");
    const res = await adminCreateDispute({
      raisedById: selectedRaisedBy.id,
      againstId: selectedAgainst.id,
      type,
      description: description.trim(),
    });
    setSaving(false);
    if (res.success) { setOpen(false); router.refresh(); }
    else setError(res.message ?? "Failed");
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="rounded-full bg-zinc-900 text-white px-4 py-2 text-xs font-bold hover:bg-zinc-700 transition-colors flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Create Dispute
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-zinc-200 w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-100 shrink-0">
              <p className="text-sm font-extrabold text-zinc-900">Create Dispute</p>
              <button type="button" onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100 transition-colors text-zinc-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">
              {/* Raised By */}
              <UserSearchField label="Raised By *" value={raisedBySearch} onChange={(v) => { setRaisedBySearch(v); debounceSearch("rb", v, setRaisedByResults); }}
                results={raisedByResults} selected={selectedRaisedBy}
                onSelect={(u) => { setSelectedRaisedBy(u); setRaisedBySearch(""); setRaisedByResults([]); }}
                onClear={() => setSelectedRaisedBy(null)} />

              {/* Against */}
              <UserSearchField label="Against *" value={againstSearch} onChange={(v) => { setAgainstSearch(v); debounceSearch("ag", v, setAgainstResults); }}
                results={againstResults} selected={selectedAgainst}
                onSelect={(u) => { setSelectedAgainst(u); setAgainstSearch(""); setAgainstResults([]); }}
                onClear={() => setSelectedAgainst(null)} />

              {/* Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Dispute Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-colors">
                  {DISPUTE_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                </select>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Description *</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4}
                  placeholder="Describe the dispute…"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors resize-none" />
              </div>

              {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

              <div className="flex items-center gap-3 pt-1">
                <button type="submit" disabled={saving}
                  className="flex-1 rounded-full bg-zinc-900 text-white py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50">
                  {saving ? "Creating…" : "Create Dispute"}
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

function UserSearchField({ label, value, onChange, results, selected, onSelect, onClear }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  results: { id: string; fullName: string; email: string }[];
  selected: { id: string; fullName: string } | null;
  onSelect: (u: { id: string; fullName: string }) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</label>
      {selected ? (
        <div className="flex items-center justify-between bg-zinc-50 rounded-xl border border-zinc-200 px-4 py-2.5">
          <p className="text-sm font-bold text-zinc-900">{selected.fullName}</p>
          <button type="button" onClick={onClear} className="text-xs text-zinc-400 hover:text-zinc-700">Change</button>
        </div>
      ) : (
        <div className="relative">
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Search user…"
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors" />
          {results.length > 0 && (
            <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white rounded-xl border border-zinc-200 overflow-hidden">
              {results.map((u) => (
                <button key={u.id} type="button" onClick={() => onSelect(u)}
                  className="w-full text-left px-4 py-2.5 hover:bg-zinc-50 border-b border-zinc-50 last:border-0">
                  <p className="text-sm font-bold text-zinc-900">{u.fullName}</p>
                  <p className="text-xs text-zinc-400">{u.email}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
