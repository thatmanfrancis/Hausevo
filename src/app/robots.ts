import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin/",
        "/dashboard/",
        "/landlord/",
        "/artisan/",
        "/vault/",
      ],
    },
    sitemap: "https://hausevo.com.ng/sitemap.xml",
  };
}
