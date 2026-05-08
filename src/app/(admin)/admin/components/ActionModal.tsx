"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ActionModalProps {
  title: string;
  description: string;
  triggerLabel: string;
  triggerClass?: string;
  action: () => Promise<{ success: boolean; message?: string }>;
  destructive?: boolean;
}

export default function ActionModal({
  title,
  description,
  triggerLabel,
  triggerClass = "text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-zinc-200 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900 transition-colors",
  action,
  destructive = false,
}: ActionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleAction() {
    setIsLoading(true);
    try {
      const res = await action();
      if (res.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        alert(res.message || "Action failed");
      }
    } catch (e) {
      alert("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button onClick={() => setIsOpen(true)} className={triggerClass}>
        {triggerLabel}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-extrabold text-zinc-900">{title}</h3>
            <p className="text-sm text-zinc-500 mt-2">{description}</p>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={isLoading}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                  destructive ? "bg-red-600 hover:bg-red-700" : "bg-zinc-900 hover:bg-zinc-800"
                }`}
              >
                {isLoading ? (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
