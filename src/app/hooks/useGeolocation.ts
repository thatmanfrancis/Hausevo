"use client";

import { useState, useEffect } from "react";

export type GeoLocation = {
  lga: string;
  state: string;
  locality: string;
  status: "idle" | "loading" | "success" | "denied" | "unavailable";
};

const CACHE_KEY = "shack_geolocation_v2"; // bumped to bust stale "Lagos" cache
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

function normaliseState(raw: string): string {
  return raw.replace(/\s+state$/i, "").trim();
}

// Known Lagos LGAs for validation — if BigDataCloud returns one of these
// we know it's a real LGA, not the state name
const LAGOS_LGAS = new Set([
  "Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa",
  "Badagry", "Epe", "Eti-Osa", "Ibeju-Lekki", "Ifako-Ijaiye",
  "Ikeja", "Ikorodu", "Kosofe", "Lagos Island", "Lagos Mainland",
  "Mushin", "Ojo", "Oshodi-Isolo", "Shomolu", "Somolu", "Surulere",
]);

async function reverseGeocode(lat: number, lng: number): Promise<GeoLocation | null> {
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
    console.log("[Shack Geo] Fetching:", url);

    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      console.warn("[Shack Geo] API error:", res.status);
      return null;
    }

    const data = await res.json();
    console.log("[Shack Geo] Raw response:", JSON.stringify(data, null, 2));

    const state = normaliseState(data.principalSubdivision ?? "");

    const adminLevels: any[] = data.localityInfo?.administrative ?? [];
    console.log("[Shack Geo] Admin levels:", adminLevels.map((a: any) => ({
      level: a.adminLevel,
      name: a.name,
      description: a.description,
    })));

    // Strategy: try each admin level from most specific to least,
    // but SKIP any entry whose name matches the state name (e.g. "Lagos")
    // because that means BigDataCloud didn't resolve the LGA properly.
    const stateName = state.toLowerCase();

    const candidateLevels = [6, 7, 5, 8, 4];
    let lgaEntry: any = null;

    for (const level of candidateLevels) {
      // Get ALL entries at this level — BigDataCloud sometimes has two level-6
      // entries (e.g. "Lagos" city AND "Kosofe" LGA both at level 6).
      // We want the most specific one, so take the LAST match at each level.
      const entries = adminLevels.filter((a: any) => a.adminLevel === level);
      // Pick the last entry at this level that isn't the state name
      const validEntry = [...entries].reverse().find(
        (a: any) => a.name && a.name.toLowerCase() !== stateName
      );
      if (validEntry) {
        lgaEntry = validEntry;
        break;
      }
    }

    console.log("[Shack Geo] Chosen LGA entry:", lgaEntry);
    console.log("[Shack Geo] data.city:", data.city);
    console.log("[Shack Geo] data.locality:", data.locality);
    console.log("[Shack Geo] data.principalSubdivision:", data.principalSubdivision);

    // Build LGA candidate — prefer admin level entry, then city, then locality
    // but never use the state name as the LGA
    let lga = lgaEntry?.name ?? "";

    if (!lga || lga.toLowerCase() === stateName) {
      // Try data.city — BigDataCloud sometimes puts the LGA here
      if (data.city && data.city.toLowerCase() !== stateName) {
        lga = data.city;
      }
    }

    if (!lga || lga.toLowerCase() === stateName) {
      // Try data.locality as last resort
      if (data.locality && data.locality.toLowerCase() !== stateName) {
        lga = data.locality;
      }
    }

    const locality = data.locality ?? data.city ?? "";

    // Final check: if what we have is a known Lagos LGA, great.
    if (state === "Lagos" && lga && !LAGOS_LGAS.has(lga)) {
      console.warn(`[Shack Geo] "${lga}" is not a recognised Lagos LGA — using anyway`);
    }

    // Last resort: if lga still equals the state name, use locality
    if (!lga || lga.toLowerCase() === stateName) {
      if (locality && locality.toLowerCase() !== stateName) {
        lga = locality;
        console.log("[Shack Geo] Fell back to locality as LGA:", lga);
      }
    }

    const result = {
      lga: lga.trim(),
      state: state.trim(),
      locality: locality.trim(),
      status: "success" as const,
    };

    console.log("[Shack Geo] Final result:", result);
    return result;
  } catch (err) {
    console.error("[Shack Geo] Error:", err);
    return null;
  }
}

export function useGeolocation(): GeoLocation {
  const [geo, setGeo] = useState<GeoLocation>({
    lga: "",
    state: "",
    locality: "",
    status: "idle",
  });

  useEffect(() => {
    // Check cache first
    try {
      // Clean up old cache key if present
      localStorage.removeItem("shack_geolocation");

      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.expiresAt > Date.now() && parsed.lga) {
          console.log("[Shack Geo] Using cached location:", parsed);
          setGeo({ ...parsed, status: "success" });
          return;
        } else {
          localStorage.removeItem(CACHE_KEY);
          console.log("[Shack Geo] Cache expired, re-detecting");
        }
      }
    } catch {
      // ignore bad cache
    }

    if (!navigator.geolocation) {
      console.warn("[Shack Geo] Geolocation not supported");
      setGeo((prev) => ({ ...prev, status: "unavailable" }));
      return;
    }

    setGeo((prev) => ({ ...prev, status: "loading" }));
    console.log("[Shack Geo] Requesting browser location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log("[Shack Geo] Got coordinates:", { latitude, longitude });

        const result = await reverseGeocode(latitude, longitude);

        if (result) {
          const toCache = { ...result, expiresAt: Date.now() + CACHE_TTL_MS };
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(toCache));
          } catch {
            // storage full — not critical
          }
          setGeo(result);
        } else {
          console.warn("[Shack Geo] Reverse geocode returned null");
          setGeo((prev) => ({ ...prev, status: "unavailable" }));
        }
      },
      (error) => {
        const reasons: Record<number, string> = {
          1: "Permission denied by user",
          2: "Position unavailable",
          3: "Timeout",
        };
        console.warn("[Shack Geo] Geolocation error:", reasons[error.code] ?? error.message);
        setGeo((prev) => ({
          ...prev,
          status: error.code === 1 ? "denied" : "unavailable",
        }));
      },
      {
        timeout: 8000,
        maximumAge: CACHE_TTL_MS,
        enableHighAccuracy: false,
      }
    );
  }, []);

  return geo;
}
