"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";

export default function PWAInstallHandler() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"android" | "ios" | "windows">(
    "android",
  );
  const pathname = usePathname();

  useEffect(() => {
    if (showDownloadModal && typeof window !== "undefined") {
      const userAgent = window.navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(userAgent)) {
        setActiveTab("ios");
      } else if (/win/.test(userAgent)) {
        setActiveTab("windows");
      } else {
        setActiveTab("android");
      }
    }
  }, [showDownloadModal]);

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
      setShowDownloadModal(true);
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
                Hausevo requires an active connection to secure your home and
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
                <p className="text-sm font-extrabold mb-1">
                  Get the Hausevo App
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  Install Hausevo on your home screen for a faster, more premium
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

      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/45 backdrop-blur-sm transition-all animate-in fade-in duration-300">
          {/* iOS Safari Bottom Sheet */}
          {activeTab === "ios" && (
            <div
              className="bg-white/90 backdrop-blur-2xl border-t border-zinc-200/50 rounded-t-[32px] sm:rounded-3xl shadow-[0_-12px_40px_rgba(0,0,0,0.12)] w-full sm:max-w-md overflow-hidden animate-in slide-in-from-bottom duration-300 focus:outline-none flex flex-col p-6 pb-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Apple Pill Drag Handle */}
              <div className="w-9 h-1 bg-zinc-300 rounded-full mx-auto mb-5 sm:hidden" />

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-905 font-sans tracking-tight">
                    Add to Home Screen
                  </h3>
                  <p className="text-xs text-zinc-500 font-sans mt-0.5">
                    Install Hausevo from Safari on iPhone or iPad
                  </p>
                </div>
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="h-7 w-7 flex items-center justify-center rounded-full bg-zinc-200/60 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* iOS Segmented Selector Switcher */}
              <div className="bg-zinc-100 p-0.5 rounded-lg flex mb-6 border border-zinc-200/30">
                <button
                  type="button"
                  onClick={() => setActiveTab("android")}
                  className="flex-1 py-1.5 text-[11px] font-semibold rounded-md text-zinc-500 hover:text-zinc-850 transition-all"
                >
                  Android
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("ios")}
                  className="flex-1 py-1.5 text-[11px] font-bold rounded-md bg-white text-zinc-950 shadow-sm transition-all"
                >
                  iOS (Safari)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("windows")}
                  className="flex-1 py-1.5 text-[11px] font-semibold rounded-md text-zinc-500 hover:text-zinc-850 transition-all"
                >
                  Windows
                </button>
              </div>

              {/* iOS Logo Header */}
              <div className="flex items-center gap-4 bg-zinc-50/80 border border-zinc-100 rounded-2xl p-4 mb-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-md">
                  <Image
                    src="/hausevofinal.png"
                    alt="Hausevo Logo"
                    width={28}
                    height={28}
                    className="object-contain"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-950 font-sans">
                    Hausevo Web App
                  </p>
                  <p className="text-xs text-zinc-500 font-sans">
                    Add to home screen for native-like offline performance.
                  </p>
                </div>
              </div>

              {/* iOS Steps */}
              <div className="flex flex-col gap-4 mb-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Instructions
                </p>
                <ol className="flex flex-col gap-4">
                  <li className="flex items-start gap-3.5 text-sm text-zinc-700 font-sans">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-500 border border-zinc-200/50">
                      1
                    </span>
                    <span className="leading-relaxed">
                      Tap the **Share** button
                      <span className="inline-flex items-center justify-center bg-zinc-100 border border-zinc-200 p-1.5 rounded-lg mx-1.5 shadow-sm align-middle">
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#007AFF"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                          <polyline points="16 6 12 2 8 6" />
                          <line x1="12" y1="2" x2="12" y2="15" />
                        </svg>
                      </span>
                      at the bottom of your Safari browser window.
                    </span>
                  </li>
                  <li className="flex items-start gap-3.5 text-sm text-zinc-700 font-sans">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-500 border border-zinc-200/50">
                      2
                    </span>
                    <span className="leading-relaxed">
                      Scroll down the sharing sheet menu and select **"Add to
                      Home Screen"**
                      <span className="inline-flex items-center justify-center bg-zinc-100 border border-zinc-200 p-1.5 rounded-lg mx-1.5 shadow-sm align-middle">
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="3"
                            y="3"
                            width="18"
                            height="18"
                            rx="5"
                            ry="5"
                          />
                          <line x1="12" y1="8" x2="12" y2="16" />
                          <line x1="8" y1="12" x2="16" y2="12" />
                        </svg>
                      </span>
                      from the list of actions.
                    </span>
                  </li>
                  <li className="flex items-start gap-3.5 text-sm text-zinc-700 font-sans">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-500 border border-zinc-200/50">
                      3
                    </span>
                    <span>
                      Confirm by tapping **"Add"** in the top-right corner of
                      the confirmation panel!
                    </span>
                  </li>
                </ol>
              </div>

              {/* iOS Footer Got It */}
              <button
                type="button"
                onClick={() => setShowDownloadModal(false)}
                className="w-full rounded-2xl bg-zinc-900 text-white py-3.5 text-sm font-semibold hover:bg-zinc-800 transition-all font-sans active:scale-[0.98]"
              >
                Got It, Thanks
              </button>
            </div>
          )}

          {/* Android Material Bottom Sheet */}
          {activeTab === "android" && (
            <div
              className="bg-white/90 backdrop-blur-2xl border-t border-zinc-200/50 rounded-t-[32px] sm:rounded-3xl shadow-[0_-12px_40px_rgba(0,0,0,0.12)] w-full sm:max-w-md overflow-hidden animate-in slide-in-from-bottom duration-300 focus:outline-none flex flex-col p-6 pb-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Android Pill Drag Handle */}
              <div className="w-9 h-1 bg-zinc-300 rounded-full mx-auto mb-5 sm:hidden" />

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-905 font-sans tracking-tight">
                    Install Hausevo
                  </h3>
                  <p className="text-xs text-zinc-500 font-sans mt-0.5">
                    Quick setup for Android devices
                  </p>
                </div>
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="h-7 w-7 flex items-center justify-center rounded-full bg-zinc-200/60 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Android Segmented Selector Switcher */}
              <div className="bg-zinc-100 p-0.5 rounded-lg flex mb-6 border border-zinc-200/30">
                <button
                  type="button"
                  onClick={() => setActiveTab("android")}
                  className="flex-1 py-1.5 text-[11px] font-bold rounded-md bg-white text-zinc-950 shadow-sm transition-all"
                >
                  Android
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("ios")}
                  className="flex-1 py-1.5 text-[11px] font-semibold rounded-md text-zinc-500 hover:text-zinc-850 transition-all"
                >
                  iOS (Safari)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("windows")}
                  className="flex-1 py-1.5 text-[11px] font-semibold rounded-md text-zinc-500 hover:text-zinc-850 transition-all"
                >
                  Windows
                </button>
              </div>

              {/* Android Logo Header */}
              <div className="flex items-center gap-4 bg-zinc-50/80 border border-zinc-100 rounded-2xl p-4 mb-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-md">
                  <Image
                    src="/hausevofinal.png"
                    alt="Hausevo Logo"
                    width={28}
                    height={28}
                    className="object-contain"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-950 font-sans">
                    Hausevo App
                  </p>
                  <p className="text-xs text-zinc-500 font-sans">
                    Standalone App. Faster load, offline support.
                  </p>
                </div>
              </div>

              {/* Android Steps */}
              <div className="flex flex-col gap-4 mb-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-sans">
                  Android Chrome Steps
                </p>
                <ol className="flex flex-col gap-4">
                  <li className="flex items-start gap-3.5 text-sm text-zinc-700 font-sans">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-500 border border-zinc-200/50">
                      1
                    </span>
                    <span className="leading-relaxed">
                      Tap the **Chrome settings icon**
                      <span className="inline-flex items-center justify-center bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded-md mx-1.5 text-zinc-800 font-extrabold text-xs align-middle shadow-sm">
                        ⋮
                      </span>
                      in the top-right corner.
                    </span>
                  </li>
                  <li className="flex items-start gap-3.5 text-sm text-zinc-700 font-sans">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-500 border border-zinc-200/50">
                      2
                    </span>
                    <span>
                      Choose **"Install app"** or **"Add to Home screen"** from
                      the drop-down.
                    </span>
                  </li>
                  <li className="flex items-start gap-3.5 text-sm text-zinc-700 font-sans">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-bold text-zinc-500 border border-zinc-200/50">
                      3
                    </span>
                    <span>
                      Accept the pop-up prompt to trigger Chrome installation.
                    </span>
                  </li>
                </ol>
              </div>

              {/* Android Primary Action / Download Button */}
              <button
                type="button"
                onClick={
                  deferredPrompt
                    ? handleInstall
                    : () => {
                        toast.success(
                          "Tap the three dots (⋮) at the top right of Chrome and select 'Install app' to complete download!",
                          { duration: 5000 },
                        );
                      }
                }
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 text-white py-3.5 text-sm font-semibold hover:bg-zinc-800 transition-all font-sans active:scale-[0.98] shadow-md"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="animate-bounce"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {deferredPrompt ? "Download App" : "Download Hausevo"}
              </button>
            </div>
          )}

          {/* Windows Centered Dialog (Fluent Style) */}
          {activeTab === "windows" && (
            <div
              className="bg-white/90 backdrop-blur-2xl border-t border-zinc-200/50 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.15)] w-full max-w-sm mx-4 overflow-hidden animate-in zoom-in-95 duration-200 focus:outline-none flex flex-col p-6 relative animate-out fade-out"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-md font-bold text-zinc-905 tracking-tight font-sans">
                    Install Hausevo
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
                    Desktop Application Download
                  </p>
                </div>
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 transition-colors"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Windows Segmented Selector Switcher */}
              <div className="bg-zinc-100 p-0.5 rounded-lg flex mb-5 border border-zinc-200/30">
                <button
                  type="button"
                  onClick={() => setActiveTab("android")}
                  className="flex-1 py-1.5 text-[11px] font-semibold rounded-md text-zinc-500 hover:text-zinc-855 transition-all"
                >
                  Android
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("ios")}
                  className="flex-1 py-1.5 text-[11px] font-semibold rounded-md text-zinc-500 hover:text-zinc-855 transition-all"
                >
                  iOS (Safari)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("windows")}
                  className="flex-1 py-1.5 text-[11px] font-bold rounded-md bg-white text-zinc-950 shadow-sm transition-all"
                >
                  Windows
                </button>
              </div>

              {/* Windows Fluent Card Graphic */}
              <div className="flex flex-col items-center justify-center text-center bg-zinc-50 border border-zinc-100 rounded-2xl py-6 px-4 mb-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-md mb-3">
                  <Image
                    src="/hausevofinal.png"
                    alt="Hausevo Logo"
                    width={36}
                    height={36}
                    className="object-contain"
                  />
                </div>
                <h4 className="text-sm font-bold text-zinc-900 font-sans">
                  Hausevo for Windows
                </h4>
                <p className="text-xs text-zinc-500 font-sans mt-1 leading-relaxed max-w-[220px]">
                  Launch securely from your taskbar or desktop with zero page
                  load lag.
                </p>
              </div>

              {/* Browser Guide (Only shown if deferredPrompt is not available) */}
              {!deferredPrompt && (
                <div className="flex flex-col gap-3.5 mb-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-sans">
                    Browser Guide
                  </p>
                  <ol className="flex flex-col gap-3 text-xs text-zinc-600 font-sans leading-relaxed">
                    <li className="flex items-start gap-2.5">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[9px] font-bold text-zinc-500 border border-zinc-200/50">
                        1
                      </span>
                      <span>
                        Look at your browser's address bar at the top-right and
                        click the **Install** icon
                        <span className="inline-flex items-center justify-center bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded mx-1 text-zinc-800 font-extrabold text-[10px] shadow-sm">
                          +
                        </span>
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[9px] font-bold text-zinc-500 border border-zinc-200/50">
                        2
                      </span>
                      <span>
                        Click **"Install"** to instantly anchor Hausevo to your
                        Desktop workspace.
                      </span>
                    </li>
                  </ol>
                </div>
              )}

              {/* Windows Primary Action / Download Button */}
              <button
                type="button"
                onClick={
                  deferredPrompt
                    ? handleInstall
                    : () => {
                        toast.success(
                          "Click the '+' icon in your browser's address bar at the top-right to install Hausevo on Windows!",
                          { duration: 5000 },
                        );
                      }
                }
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 text-white py-3.5 text-sm font-semibold hover:bg-zinc-800 transition-all font-sans active:scale-[0.98] shadow-md"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="animate-bounce"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {deferredPrompt ? "Download App" : "Download Hausevo"}
              </button>
            </div>
          )}

          {/* Backdrop Click Dismiss Handler */}
          <div
            className="absolute inset-0 -z-10 bg-transparent"
            onClick={() => setShowDownloadModal(false)}
          />
        </div>
      )}
    </>
  );
}
