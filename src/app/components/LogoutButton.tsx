"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { signOut } from "next-auth/react";
import Image from "next/image";

export default function LogoutButton({ compact = false }: { compact?: boolean }) {
  const [showModal, setShowModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await signOut({ callbackUrl: "/" });
  }

  if (compact) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors rounded-xl"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Log out
        </button>
        <LogoutModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={handleLogout}
          loggingOut={loggingOut}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex w-full items-center justify-center rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-bold text-zinc-700 hover:border-zinc-400 transition-colors"
      >
        Log out
      </button>
      <LogoutModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleLogout}
        loggingOut={loggingOut}
      />
    </>
  );
}

// ── Logout Modal (rendered via Portal at document.body) ───────────────────

function LogoutModal({
  isOpen,
  onClose,
  onConfirm,
  loggingOut,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loggingOut: boolean;
}) {
  // Only mount portal after hydration
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Prevent body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
    >
      {/* Backdrop — fills entire viewport independently of any stacking context */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={loggingOut ? undefined : onClose}
      />

      {/* Modal card */}
      <div
        className="relative bg-white rounded-2xl max-w-sm w-full overflow-hidden"
        style={{ zIndex: 10000 }}
      >
        {loggingOut ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-zinc-100" />
              <div className="absolute inset-0 rounded-full border-4 border-t-zinc-900 animate-spin" />
              <Image
                src="/hausevofinal.png"
                alt="Hausevo Logo"
                width={80}
                height={80}
                className="object-contain"
              />
            </div>
            <p className="text-sm font-bold text-zinc-900">Logging you out…</p>
            <p className="text-xs text-zinc-500 mt-1">See you soon!</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 border border-red-200">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-red-600"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-zinc-900 mb-1">
                  Log out of your account?
                </p>
                <p className="text-xs text-zinc-500">
                  You&apos;ll need to sign in again to access your dashboard.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onConfirm}
                className="flex-1 rounded-full bg-red-600 text-white px-5 py-2.5 text-sm font-bold hover:bg-red-700 transition-colors"
              >
                Yes, log out
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border border-zinc-200 text-zinc-700 px-5 py-2.5 text-sm font-bold hover:border-zinc-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
