import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  fallbacks: {
    document: "/offline",
  },
});

const nextConfig: NextConfig = {
  // Prisma 7 generates ESM-only runtime files (.mjs) that webpack cannot
  // bundle. Mark the generated client path and related packages as
  // server-side externals so Next.js lets Node.js load them natively.
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    // The custom generated client path — must match the output in schema.prisma
    "./src/generated/prisma",
    "../src/generated/prisma",
    "../../src/generated/prisma",
  ],

  images: {
    // Accept images from any hostname
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default withPWA(nextConfig);
