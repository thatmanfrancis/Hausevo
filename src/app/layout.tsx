import type { Metadata, Viewport } from "next";
import { Nunito, Pacifico } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/app/components/CookieBanner";

import PWAInstallHandler from "@/components/PWAInstallHandler";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const pacifico = Pacifico({
  weight: "400",
  variable: "--font-pacifico",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shack — Verified Houses for Rent in Lagos & Nigeria",
  description: "Find verified houses for rent in Lagos near you. No agents, no hidden markups. Rent self-contain, flats, and luxury apartments in Lagos directly from landlords.",
  keywords: [
    "houses for rent in Lagos",
    "apartments for rent near me",
    "verified properties Nigeria",
    "rent house in Lagos without agent",
    "affordable flats in Lagos",
    "self contain for rent in Lagos",
    "luxury apartments Lagos",
    "houses for sale in Lagos",
    "Shack Nigeria",
    "real estate Lagos"
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Shack",
  },
  alternates: {
    canonical: "https://shack.ng",
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#09090b",
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${nunito.variable} ${pacifico.variable} font-sans h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-XXXXXXXXXX');
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Toaster richColors position="top-center" />
        {children}
        <PWAInstallHandler />
        <CookieBanner />
      </body>
    </html>
  );
}
