"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminCreateArtisan } from "../actions";

const CATEGORIES = [
  "PLUMBER","ELECTRICIAN","AC_TECHNICIAN","CARPENTER","PAINTER","CLEANER","SECURITY","GENERAL"
];

export default function AddArtisanModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [yearsOfExperience, setYearsOfExperience] = useState("0");
  const [startingPrice, setStartingPrice] = useState("0");
  const [bio, setBio] = useState("");

  function reset() {
    setFullName(""); setEmail(""); setPhoneNumber(""); setCategory("GENERAL");
    setYearsOfExperience("0"); setStartingPrice("0"); setBio(""); setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) { setError("Name and email are required."); return; }
    setSaving(true); setError("");
    try {
      const res = await adminCreateArtisan({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        category,
        yearsOfExperience: parseInt(yearsOfExperience) || 0,
        startingPrice: parseFloat(startingPrice) || 0,
        bio: bio.trim() || undefined,
      });
      if (res.success) {
        setOpen(false);
        reset();
        router.refresh();
      } else {
        setError(res.message ?? "Failed to create artisan.");
      }
    } catch { setError("Something went wrong."); }
    finally { setSaving(false); }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); reset(); }}
        className="rounded-full bg-zinc-900 text-white px-4 py-2 text-xs font-bold hover:bg-zinc-700 transition-colors flex items-center gap-1.5"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add Artisan
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-zinc-200 w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-100 shrink-0">
              <p className="text-sm font-extrabold text-zinc-900">Add Artisan</p>
              <button type="button" onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100 transition-colors text-zinc-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">
              <Field label="Full Name *">
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="e.g. Emeka Obi"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors" />
              </Field>
              <Field label="Email *">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="e.g. emeka@gmail.com"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors" />
              </Field>
              <Field label="Phone Number">
                <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="e.g. 08012345678"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Category">
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-colors">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
                  </select>
                </Field>
                <Field label="Years Exp.">
                  <input type="number" value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} min="0"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-colors" />
                </Field>
              </div>
              <Field label="Starting Price (₦)">
                <input type="number" value={startingPrice} onChange={(e) => setStartingPrice(e.target.value)} min="0"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-900 transition-colors" />
              </Field>
              <Field label="Bio">
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Brief description of skills…"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors resize-none" />
              </Field>

              {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

              <div className="flex items-center gap-3 pt-1">
                <button type="submit" disabled={saving}
                  className="flex-1 rounded-full bg-zinc-900 text-white py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50">
                  {saving ? "Creating…" : "Create Artisan"}
                </button>
                <button type="button" onClick={() => setOpen(false)}
                  className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</label>
      {children}
    </div>
  );
}
