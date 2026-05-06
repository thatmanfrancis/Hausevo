"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGeolocation } from "@/app/hooks/useGeolocation";

export default function LocationDetector({
  isLoggedIn,
  redirectTo = "/properties",
}: {
  isLoggedIn: boolean;
  redirectTo?: string;
}) {
  const geo = useGeolocation();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Only run geo detection if there's no location in the URL yet
  // and the user is not logged in. This prevents the double-render
  // on every page load.
  useEffect(() => {
    const currentSource = searchParams.get("locationSource");
    const alreadyGeo = currentSource === "geo";

    if (alreadyGeo) return;
    if (isLoggedIn) return;
    if (geo.status !== "success") return;
    if (!geo.lga) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("lga", geo.lga);
    if (geo.state) params.set("state", geo.state);
    params.set("locationSource", "geo");

    // console.log("[Shack Geo] Injecting into URL:", params.toString());
    router.replace(`${redirectTo}?${params.toString()}`, { scroll: false });
  }, [geo.status, geo.lga, geo.state, isLoggedIn, router, searchParams, redirectTo]);

  return null;
}
