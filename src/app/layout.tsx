import type { Metadata, Viewport } from "next";
import { Nunito, Pacifico } from "next/font/google";
import Script from "next/script";
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
  metadataBase: new URL("https://hausevo.com.ng"),
  title: "Hausevo — Verified Houses for Rent in Lagos & Nigeria",
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
    "Hausevo Nigeria",
    "real estate Lagos"
  ],
  manifest: "/manifest.json",

  openGraph: {
    title: "Hausevo — Verified Houses for Rent in Lagos & Nigeria",
    description: "Find verified houses for rent in Lagos near you. No agents, no hidden markups. Rent self-contain, flats, and luxury apartments in Lagos directly from landlords.",
    url: "https://hausevo.com.ng",
    siteName: "Hausevo",
    images: [
      {
        url: "/hausevofinal.png",
        width: 500,
        height: 500,
        alt: "Hausevo Logo",
      },
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hausevo — Verified Houses for Rent in Lagos & Nigeria",
    description: "Find verified houses for rent in Lagos near you. No agents, no hidden markups. Rent self-contain, flats, and luxury apartments in Lagos directly from landlords.",
    images: ["/hausevofinal.png"],
    creator: "@hausevong",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hausevo",
  },
  alternates: {
    canonical: "https://hausevo.com.ng",
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
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID || "G-XXXXXXXXXX"}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID || "G-XXXXXXXXXX"}');
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Hausevo",
                url: "https://hausevo.com.ng",
                logo: "https://hausevo.com.ng/hausevofinal.png",
                description: "Nigeria's most trusted property platform. Verified houses for rent in Lagos with no agent fees and no hidden markups.",
                sameAs: [
                  "https://twitter.com/hausevong",
                  "https://instagram.com/hausevong",
                ],
                areaServed: {
                  "@type": "City",
                  name: "Lagos",
                  containedInPlace: { "@type": "Country", name: "Nigeria" },
                },
                contactPoint: {
                  "@type": "ContactPoint",
                  contactType: "customer support",
                  url: "https://hausevo.com.ng/contact",
                  availableLanguage: "English",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Hausevo",
                url: "https://hausevo.com.ng",
                description: "Verified houses for rent in Lagos and Nigeria. No agents, no hidden markups.",
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: "https://hausevo.com.ng/properties?q={search_term_string}",
                  },
                  "query-input": "required name=search_term_string",
                },
              },
            ]),
          }}
        />
        <Toaster richColors position="top-center" />
        {children}
        <PWAInstallHandler />
        <CookieBanner />
      </body>
    </html>
  );
}
