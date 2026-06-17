import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Allow all bots to crawl public pages
        userAgent: "*",
        allow: [
          "/",
          "/properties",
          "/properties/",
          "/blogs",
          "/blogs/",
          "/about",
          "/faq",
          "/contact",
          "/team",
          "/careers",
          "/waitlist",
          "/terms",
          "/privacy",
          "/cookies",
          "/guarantor",
        ],
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard/",
          "/landlord/",
          "/artisan/",
          "/vault/",
          "/auth/",
          "/_next/",
          "/offline/",
        ],
      },
      {
        // Block AI training crawlers from scraping content
        userAgent: [
          "GPTBot",
          "Google-Extended",
          "CCBot",
          "anthropic-ai",
          "Claude-Web",
          "Omgilibot",
          "FacebookBot",
        ],
        disallow: ["/"],
      },
    ],
    sitemap: "https://hausevo.com.ng/sitemap.xml",
    host: "https://hausevo.com.ng",
  };
}
