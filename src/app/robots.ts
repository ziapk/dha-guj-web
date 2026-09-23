import type { MetadataRoute } from "next";
import { noindex } from "@/lib/seo";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Staging and other non-production deployments are closed to crawlers entirely, sitemap included.
  if (noindex()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

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
