"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

// Rotating taglines — cycle through one every ~1.1s
const MESSAGES = [
  "Find your next home.",
  "Verified listings. Zero stress.",
  "No agents. No markups.",
  "Trusted homes across Lagos.",
];

export default function SplashScreen({ isLoggedIn }: { isLoggedIn: boolean }) {
  // Initialize visible immediately from the prop so SSR renders it on first paint
  const [visible, setVisible] = useState(!isLoggedIn);
  const [fading, setFading] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [msgVisible, setMsgVisible] = useState(true);

  useEffect(() => {
    if (isLoggedIn) return;

    // Cycle messages every 1.1 s with a quick cross-fade
    const msgInterval = setInterval(() => {
      setMsgVisible(false);
      setTimeout(() => {
        setMsgIndex((i) => (i + 1) % MESSAGES.length);
        setMsgVisible(true);
      }, 300);
    }, 1200);

    // Start fade-out at 3.5 s
    const fadeTimer = setTimeout(() => setFading(true), 3500);

    // Fully unmount at 4 s
    const hideTimer = setTimeout(() => {
      setVisible(false);
      clearInterval(msgInterval);
    }, 4000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
      clearInterval(msgInterval);
    };
  }, [isLoggedIn]);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes hv-spin-cw {
          to { transform: rotate(360deg); }
        }
        @keyframes hv-spin-ccw {
          to { transform: rotate(-360deg); }
        }
        @keyframes hv-wave {
          0%, 100% { transform: translateY(0px); opacity: 0.5; }
          30%       { transform: translateY(-8px); opacity: 1; }
          70%       { transform: translateY(8px); opacity: 0.7; }
        }
        @keyframes hv-logo-pop {
          0%   { transform: scale(0.82); opacity: 0; }
          60%  { transform: scale(1.04); opacity: 1; }
          100% { transform: scale(1);    opacity: 1; }
        }
        @keyframes hv-ring-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes hv-slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Full-screen overlay — z-[9999] blocks everything behind it ── */}
      <div
        aria-live="polite"
        role="status"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          backgroundColor: "#f5f5f5",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          transition: "opacity 0.5s ease",
          opacity: fading ? 0 : 1,
          pointerEvents: fading ? "none" : "all",
        }}
      >
        {/* ── Logo + concentric spinner rings ── */}
        <div style={{ position: "relative", width: 92, height: 92, marginBottom: 36 }}>

          {/* Outermost slow counter-rotate ring */}
          <div
            style={{
              position: "absolute",
              inset: -20,
              borderRadius: "50%",
              border: "1.5px solid transparent",
              borderTopColor: "#d4d4d8",
              borderLeftColor: "#d4d4d8",
              animation: "hv-spin-ccw 2.4s linear infinite, hv-ring-fade 0.6s ease 0.3s both",
            }}
          />

          {/* Middle faster clockwise ring */}
          <div
            style={{
              position: "absolute",
              inset: -10,
              borderRadius: "50%",
              border: "2.5px solid transparent",
              borderTopColor: "#18181b",
              borderRightColor: "#52525b",
              animation: "hv-spin-cw 0.85s cubic-bezier(0.4,0,0.6,1) infinite, hv-ring-fade 0.4s ease 0.15s both",
            }}
          />

          {/* Logo circle */}
          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: "50%",
              backgroundColor: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)",
              animation: "hv-logo-pop 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards",
            }}
          >
            <Image
              src="/hausevofinal.png"
              alt="Hausevo"
              width={62}
              height={62}
              style={{ objectFit: "contain" }}
              priority
            />
          </div>
        </div>

        {/* ── Rope-wave dots ── */}
        <div
          style={{
            display: "flex",
            gap: 9,
            alignItems: "center",
            marginBottom: 28,
            animation: "hv-slide-up 0.4s ease 0.4s both",
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: i % 2 === 0 ? "#18181b" : "#a1a1aa",
                animation: "hv-wave 1.1s ease-in-out infinite",
                animationDelay: `${i * 0.17}s`,
              }}
            />
          ))}
        </div>

        {/* ── Rotating tagline message ── */}
        <div
          style={{
            textAlign: "center",
            animation: "hv-slide-up 0.4s ease 0.55s both",
          }}
        >
          <p
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#18181b",
              letterSpacing: "-0.02em",
              transition: "opacity 0.3s ease, transform 0.3s ease",
              opacity: msgVisible ? 1 : 0,
              transform: msgVisible ? "translateY(0)" : "translateY(4px)",
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {MESSAGES[msgIndex]}
          </p>
          <p
            style={{
              fontSize: 13,
              color: "#71717a",
              marginTop: 6,
              fontWeight: 500,
              letterSpacing: "0.01em",
            }}
          >
            hausevo.com.ng
          </p>
        </div>
      </div>
    </>
  );
}
