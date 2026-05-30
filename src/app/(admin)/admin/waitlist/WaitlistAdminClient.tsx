"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────

type Entry = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  lga: string | null;
  position: number;
  createdAt: string;
};

type BroadcastResult = { sent: number; failed: number };

const ROLE_BADGE: Record<string, string> = {
  TENANT: "bg-blue-50 text-blue-700",
  LANDLORD: "bg-emerald-50 text-emerald-700",
  BOTH: "bg-amber-50 text-amber-700",
};

// ── Two-step broadcast modal ───────────────────────────────────────────────

function BroadcastModal({
  onClose,
  onSent,
  result,
}: {
  onClose: () => void;
  onSent: (r: BroadcastResult) => void;
  result: BroadcastResult | null;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [targetRole, setTargetRole] = useState("ALL");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/waitlist/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body, targetRole, imageUrl: imageUrl || null }),
      });
      const data = await res.json();
      if (res.ok) {
        onSent({ sent: data.sent, failed: data.failed });
      } else {
        alert(data.error ?? "Broadcast failed.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Image must be under 5MB."); return; }
    setImageUploading(true);
    try {
      const sigRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "waitlist-broadcasts" }),
      });
      const sig = await sigRes.json();
      if (!sigRes.ok) throw new Error(sig.error);

      const form = new FormData();
      form.append("file", file);
      form.append("api_key", sig.apiKey);
      form.append("timestamp", sig.timestamp);
      form.append("signature", sig.signature);
      form.append("folder", sig.folder);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
        { method: "POST", body: form }
      );
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error?.message);
      setImageUrl(uploadData.secure_url);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setImageUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-zinc-200 w-full max-w-md shadow-2xl overflow-hidden">

        {/* ── Success ── */}
        {result ? (
          <div className="flex flex-col items-center text-center py-10 px-8 gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="text-base font-extrabold text-zinc-900 mb-1">Broadcast sent</p>
              <p className="text-sm text-zinc-500">
                {result.sent} emails sent{result.failed > 0 && `, ${result.failed} failed`}.
              </p>
            </div>
            <button type="button" onClick={onClose} className="rounded-full bg-zinc-900 text-white px-6 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors">
              Done
            </button>
          </div>
        ) : (
          <>
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-zinc-100">
              <div>
                <p className="text-sm font-extrabold text-zinc-900">
                  {step === 1 ? "Compose email" : "Add image (optional)"}
                </p>
                {/* Step indicator */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  {[1, 2].map((s) => (
                    <div
                      key={s}
                      className={`h-1.5 rounded-full transition-all duration-200 ${
                        s === step ? "w-6 bg-zinc-900" : s < step ? "w-3 bg-zinc-400" : "w-3 bg-zinc-200"
                      }`}
                    />
                  ))}
                  <span className="text-[10px] font-bold text-zinc-400 ml-1">Step {step} of 2</span>
                </div>
              </div>
              <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-zinc-100 transition-colors text-zinc-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* ── Step 1: Audience + content ── */}
            {step === 1 && (
              <div className="p-6 flex flex-col gap-4">
                {/* Audience */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Send to</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["ALL", "TENANT", "LANDLORD", "BOTH"].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setTargetRole(r)}
                        className={`rounded-xl border py-2 text-xs font-bold transition-colors ${
                          targetRole === r ? "bg-zinc-900 border-zinc-900 text-white" : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                        }`}
                      >
                        {r === "ALL" ? "Everyone" : r.charAt(0) + r.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Shack is launching next week 🏠"
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
                  />
                </div>

                {/* Message */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Message</label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={5}
                    placeholder="Write your message here…"
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors resize-none"
                  />
                  <p className="text-xs text-zinc-400 text-right">{body.length} chars</p>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!subject.trim() || !body.trim()}
                    className="rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next: Add image →
                  </button>
                  <button type="button" onClick={onClose} className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2: Image + send ── */}
            {step === 2 && (
              <div className="p-6 flex flex-col gap-4">
                {/* Image upload */}
                {imageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-zinc-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt="Banner preview" className="w-full h-36 object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900/80 text-white hover:bg-zinc-900 transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 px-4 py-8 cursor-pointer hover:border-zinc-400 hover:bg-zinc-50 transition-colors ${imageUploading ? "opacity-50 pointer-events-none" : ""}`}>
                    {imageUploading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-zinc-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span className="text-xs font-semibold text-zinc-400">Uploading…</span>
                      </>
                    ) : (
                      <>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span className="text-sm font-semibold text-zinc-600">Click to upload a banner image</span>
                        <span className="text-xs text-zinc-400">JPG, PNG, WebP · max 5MB · optional</span>
                      </>
                    )}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}

                {/* Summary */}
                <div className="bg-zinc-50 rounded-xl border border-zinc-100 px-4 py-3 flex flex-col gap-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Ready to send</p>
                  <p className="text-sm font-bold text-zinc-900 truncate">{subject}</p>
                  <p className="text-xs text-zinc-500 line-clamp-2">{body}</p>
                  <p className="text-[10px] font-bold text-zinc-400 mt-1 uppercase tracking-widest">
                    To: {targetRole === "ALL" ? "Everyone" : targetRole.charAt(0) + targetRole.slice(1).toLowerCase() + "s"}
                    {imageUrl && " · With image"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={sending}
                    className="flex items-center gap-2 rounded-full bg-zinc-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending…
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                        Send broadcast
                      </>
                    )}
                  </button>
                  <button type="button" onClick={() => setStep(1)} className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">
                    ← Back
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function WaitlistAdminClient({
  entries,
  total,
  totalPages,
  currentPage,
  roleFilter,
  query,
}: {
  entries: Entry[];
  total: number;
  totalPages: number;
  currentPage: number;
  roleFilter: string;
  query: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<BroadcastResult | null>(null);
  const [searchInput, setSearchInput] = useState(query);

  function applyFilter(role: string) {
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    if (searchInput) params.set("q", searchInput);
    startTransition(() => router.push(`/admin/waitlist?${params.toString()}`));
  }

  function applySearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (roleFilter) params.set("role", roleFilter);
    if (searchInput) params.set("q", searchInput);
    startTransition(() => router.push(`/admin/waitlist?${params.toString()}`));
  }

  function goToPage(p: number) {
    const params = new URLSearchParams();
    if (roleFilter) params.set("role", roleFilter);
    if (query) params.set("q", query);
    params.set("page", String(p));
    startTransition(() => router.push(`/admin/waitlist?${params.toString()}`));
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <form onSubmit={applySearch} className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative flex-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, email, area…"
              className="w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-zinc-900 transition-colors"
            />
          </div>
          <button type="submit" className="rounded-xl bg-zinc-900 text-white px-4 py-2.5 text-sm font-bold hover:bg-zinc-700 transition-colors">
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          {["", "TENANT", "LANDLORD", "BOTH"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => applyFilter(r)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                roleFilter === r ? "bg-zinc-900 text-white" : "border border-zinc-200 text-zinc-600 hover:border-zinc-400"
              }`}
            >
              {r || "All"}
            </button>
          ))}
          <button
            type="button"
            onClick={() => { setShowBroadcast(true); setBroadcastResult(null); }}
            className="flex items-center gap-1.5 rounded-full bg-zinc-900 text-white px-4 py-2 text-xs font-bold hover:bg-zinc-700 transition-colors ml-2"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Send Email
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={`bg-white rounded-2xl border border-zinc-200 overflow-hidden transition-opacity ${isPending ? "opacity-50" : ""}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">#</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Name</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Email</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Role</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Area</th>
                <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Joined</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                  <td className="px-5 py-3 text-sm font-bold text-zinc-400">#{e.position}</td>
                  <td className="px-5 py-3"><p className="text-sm font-bold text-zinc-900">{e.fullName}</p></td>
                  <td className="px-5 py-3 text-sm text-zinc-500">{e.email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${ROLE_BADGE[e.role] ?? "bg-zinc-100 text-zinc-500"}`}>
                      {e.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-zinc-500">{e.lga ?? <span className="text-zinc-300">—</span>}</td>
                  <td className="px-5 py-3 text-xs text-zinc-400">
                    {new Date(e.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-zinc-400 font-bold">No entries found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            Showing {((currentPage - 1) * 25) + 1}–{Math.min(currentPage * 25, total)} of {total}
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1 || isPending} className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:border-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <span className="text-sm font-bold text-zinc-700 px-3">{currentPage} / {totalPages}</span>
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages || isPending} className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 hover:border-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Broadcast modal */}
      {showBroadcast && (
        <BroadcastModal
          onClose={() => setShowBroadcast(false)}
          onSent={(r) => setBroadcastResult(r)}
          result={broadcastResult}
        />
      )}
    </div>
  );
}
