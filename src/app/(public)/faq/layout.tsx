import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ \u2014 Hausevo | Renting in Nigeria Explained",
  description:
    "Answers to the most common questions about Hausevo \u2014 how verification works, how to apply for a property, the Hausevo Score, and more. No agents. No hidden fees.",
  alternates: { canonical: "https://hausevo.com.ng/faq" },
  openGraph: {
    title: "FAQ \u2014 Hausevo | Renting in Nigeria Explained",
    description:
      "Everything you need to know about renting with Hausevo. Identity verification, listings, payments, the Vault, and your Hausevo Score.",
    url: "https://hausevo.com.ng/faq",
    siteName: "Hausevo",
    images: [
      {
        url: "https://hausevo.com.ng/hausevofinal.png",
        width: 500,
        height: 500,
        alt: "Hausevo",
      },
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ \u2014 Hausevo | Renting in Nigeria Explained",
    description:
      "Answers about Hausevo: verification, listings, Hausevo Score, the Vault, and more.",
    images: ["https://hausevo.com.ng/hausevofinal.png"],
    creator: "@hausevong",
  },
  keywords: [
    "Hausevo FAQ",
    "how to rent house in Nigeria",
    "NIN verification Nigeria",
    "Hausevo score explained",
    "rent without agent Lagos",
    "verified property Nigeria",
    "how Hausevo works",
    "Lagos rental FAQ",
  ],
};

// JSON-LD FAQ structured data \u2014 powers Google's FAQ featured snippets
const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Hausevo?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Hausevo is a Nigerian property platform that connects verified landlords directly with tenants \u2014 no agents, no markups. Every listing is submitted by the property owner and verified by our team.",
      },
    },
    {
      "@type": "Question",
      name: "Is Hausevo free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Browsing and saving properties is completely free. To apply for a property, you need to complete identity verification using your NIN. This is free. No fees, no BVN, no selfie required.",
      },
    },
    {
      "@type": "Question",
      name: "Which cities does Hausevo cover?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Hausevo launched in Lagos and is expanding to Abuja, Port Harcourt, Ibadan, and other major Nigerian cities.",
      },
    },
    {
      "@type": "Question",
      name: "How does verification work on Hausevo?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Enter your 11-digit National Identification Number (NIN). We verify it against NIMC records via Dojah, a licensed KYC provider. If the name on your NIN matches your account name, you are verified instantly. No selfie, no BVN, no fees.",
      },
    },
    {
      "@type": "Question",
      name: "What is the Hausevo Score?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Hausevo Score is Nigeria's first rental credit score. It is built from your payment history, clean tenancy exits, and dispute record on the platform. A higher score improves your chances with landlords.",
      },
    },
    {
      "@type": "Question",
      name: "How do I apply for a property on Hausevo?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Complete identity verification (free, just your NIN), then click Apply Now on any listing. Your Hausevo Score and verified profile are shared with the landlord. You will be notified when they respond.",
      },
    },
    {
      "@type": "Question",
      name: "How do I list my property on Hausevo?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Create a landlord account, complete verification, then click Add Listing. Upload photos, set your price, and submit. Our team will verify the deed and price before the listing goes live.",
      },
    },
    {
      "@type": "Question",
      name: "Are there any agent fees on Hausevo?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Zero agent fees. Ever. Hausevo connects tenants directly with landlords. We verify listings and prices to ensure no inflated markups.",
      },
    },
  ],
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      {children}
    </>
  );
}
