"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function PWAInstallHandler() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // 0. Connection Status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);

    // 1. Capture Install Prompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Only show popup on the landing page
      if (pathname === "/") {
        const lastPrompt = localStorage.getItem("last-pwa-prompt");
        const now = Date.now();
        // Show once every 24 hours
        if (!lastPrompt || now - Number(lastPrompt) > 24 * 60 * 60 * 1000) {
          setTimeout(() => setShowPopup(true), 5000); // Show after 5 seconds
        }
      }
    };

    const triggerHandler = () => {
      if (deferredPrompt) {
        handleInstall();
      } else {
        // If not installable (e.g. already installed), show a message or just fail silently
        console.log("App not installable or already installed.");
        alert(
          "The app is already installed or your browser doesn't support PWA installation.",
        );
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("trigger-pwa-install", triggerHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("trigger-pwa-install", triggerHandler);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [pathname, deferredPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
    setShowPopup(false);
    localStorage.setItem("last-pwa-prompt", Date.now().toString());
  };

  const closePopup = () => {
    setShowPopup(false);
    localStorage.setItem("last-pwa-prompt", Date.now().toString());
  };

  return (
    <>
      {/* Full-Screen Offline Modal */}
      {!isOnline && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-500">
          <div className="max-w-sm w-full mx-4 bg-zinc-900 border border-white/10 rounded-[2.5rem] p-10 text-center shadow-2xl relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-zinc-900 shadow-xl">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                  <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              </div>
              <h2 className="text-xl font-extrabold text-white mb-2 tracking-tight">
                Connection Interrupted
              </h2>
              <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                Shack requires an active connection to secure your home and
                verify payments. Please check your internet.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full rounded-full bg-white text-zinc-900 py-3.5 text-sm font-extrabold hover:bg-zinc-200 transition-all active:scale-95"
              >
                Try Reconnecting
              </button>
            </div>
          </div>
        </div>
      )}

      {showPopup && (
        <div className="fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:w-96 z-200 animate-in fade-in slide-in-from-bottom-10 duration-500">
          <div className="bg-zinc-900 text-white rounded-3xl p-6 shadow-2xl border border-white/10 overflow-hidden relative">
            {/* Glow effect */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-zinc-900 shadow-xl">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-extrabold mb-1">Get the Shack App</p>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  Install Shack on your home screen for a faster, more premium
                  experience and instant notifications.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleInstall}
                    className="flex-1 rounded-full bg-white text-zinc-900 py-2 text-xs font-extrabold hover:bg-zinc-200 transition-colors"
                  >
                    Install Now
                  </button>
                  <button
                    onClick={closePopup}
                    className="px-3 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
