import type { NextConfig } from "next";

const mediaUrl = new URL(process.env.API_MEDIA_URL ?? "http://localhost:8000");

/** Staging and other non-production deployments set NOINDEX=true at build time (see .env.example). */
const noindex = process.env.NOINDEX === "true";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: mediaUrl.protocol === "https:" ? "https" : "http",
        hostname: mediaUrl.hostname,
        port: mediaUrl.port,
        pathname: "/storage/**",
      },
    ],
    // Local development serves photos from localhost, which Next.js will not optimize.
    unoptimized: process.env.NEXT_IMAGE_UNOPTIMIZED === "true",
  },
  // A page's own `robots` metadata can override the layout's, and images, PDFs and the sitemap carry
  // no meta tag at all, so staging blocks crawlers with a header on every response as well.
  headers: noindex
    ? async () => [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }]
    : undefined,
};

export default nextConfig;
