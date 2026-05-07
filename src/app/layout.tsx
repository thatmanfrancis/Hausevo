import type { Metadata, Viewport } from "next";
import { Nunito, Pacifico } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/app/components/CookieBanner";

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
  title: "Shack — Find Verified Lagos Homes",
  description: "Discover verified Lagos properties with no agents, no markups, and transparent pricing.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

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
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
