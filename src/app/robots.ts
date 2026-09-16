import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Account, sign-in and internal API routes have nothing to index.
      disallow: ["/api/", "/account", "/login", "/register", "/forgot-password"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
