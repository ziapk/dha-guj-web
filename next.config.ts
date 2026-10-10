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
  // Public URL structure (SEO spec): list pages are /properties-for-sale, /properties-for-rent, /dha-gujranwala-maps,
  // /dealers, /agents, /authors, /projects, /developers; single pages are /map/{slug}, /dealer/{slug}, /agent/{slug},
  // /author/{slug}, /project/{slug}, /developer/{slug} (listings: /property/{slug}-{ref}, see src/proxy.ts). Old
  // URLs get a 301, and a single-page prefix with no slug goes to its list. Society maps moved from /society-maps to
  // /maps and now /dha-gujranwala-maps; the Plot Finder moved from /maps to /plot-finder. Old one-segment
  // /maps/{sector} links land on /map/{sector}, and the map page sends those on to the Plot Finder.
  async redirects() {
    return [
      { source: "/buy", destination: "/properties-for-sale", statusCode: 301 },
      { source: "/rent", destination: "/properties-for-rent", statusCode: 301 },
      { source: "/property", destination: "/properties", statusCode: 301 },
      { source: "/society-maps", destination: "/dha-gujranwala-maps", statusCode: 301 },
      { source: "/society-maps/:slug", destination: "/map/:slug", statusCode: 301 },
      { source: "/maps/:sector/:block", destination: "/plot-finder/:sector/:block", statusCode: 301 },
      { source: "/maps", has: [{ type: "query", key: "plot" }], destination: "/plot-finder", statusCode: 301 },
      { source: "/maps", destination: "/dha-gujranwala-maps", statusCode: 301 },
      { source: "/maps/:slug", destination: "/map/:slug", statusCode: 301 },
      { source: "/map", destination: "/dha-gujranwala-maps", statusCode: 301 },
      { source: "/agencies", destination: "/dealers", statusCode: 301 },
      { source: "/agencies/:slug", destination: "/dealer/:slug", statusCode: 301 },
      { source: "/dealer", destination: "/dealers", statusCode: 301 },
      { source: "/agents/:slug", destination: "/agent/:slug", statusCode: 301 },
      { source: "/agent", destination: "/agents", statusCode: 301 },
      { source: "/author", destination: "/authors", statusCode: 301 },
      { source: "/projects/:slug", destination: "/project/:slug", statusCode: 301 },
      { source: "/project", destination: "/projects", statusCode: 301 },
      { source: "/developers/:slug", destination: "/developer/:slug", statusCode: 301 },
      { source: "/developer", destination: "/developers", statusCode: 301 },
    ];
  },
  // A page's own `robots` metadata can override the layout's, and images, PDFs and the sitemap carry
  // no meta tag at all, so staging blocks crawlers with a header on every response as well.
  headers: noindex
    ? async () => [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }]
    : undefined,
};

export default nextConfig;
