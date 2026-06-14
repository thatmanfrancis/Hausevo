"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resolveDispute } from "../actions";

export default function ResolveDisputeModal({ disputeId }: { disputeId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resolution, setResolution] = useState("");
  const router = useRouter();

  async function handleResolve() {
    if (!resolution.trim()) return alert("Please enter a resolution note.");
    
    setIsLoading(true);
    try {
      const res = await resolveDispute(disputeId, resolution);
      if (res.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        alert(res.message || "Failed to resolve dispute");
      }
    } catch (e) {
      alert("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors"
      >
        Resolve
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-extrabold text-zinc-900">Resolve Dispute</h3>
            <p className="text-sm text-zinc-500 mt-2 mb-4">Enter the final resolution for this dispute. This will be visible to both parties.</p>

            <textarea
              className="w-full h-32 p-3 text-sm rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
              placeholder="Resolution details..."
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              disabled={isLoading}
            />

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={isLoading || !resolution.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? "Resolving..." : "Mark Resolved"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
