import type { NextConfig } from "next";

const mediaUrl = new URL(process.env.API_MEDIA_URL ?? "http://localhost:8000");
/** Public URL of the Cloudflare R2 bucket (same value as R2_URL in the API), once uploads move there. */
const r2Url = process.env.R2_MEDIA_URL ? new URL(process.env.R2_MEDIA_URL) : null;

/** Staging and other non-production deployments set NOINDEX=true at build time (see .env.example). */
const noindex = process.env.NOINDEX === "true";

/** Canonical origin (NEXT_PUBLIC_SITE_URL, e.g. https://dhagrwproperties.com); www requests are sent to it. */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : null;

// Canonical URLs, Open Graph URLs and the sitemap all use NEXT_PUBLIC_SITE_URL, so an indexable build must not point at staging.
if (process.env.NODE_ENV === "production" && !noindex && siteUrl && /staging|localhost|127\.0\.0\.1/.test(siteUrl.hostname)) {
  console.warn(`\n⚠ NEXT_PUBLIC_SITE_URL is ${siteUrl.origin} but NOINDEX is not set: search engines would index staging URLs.\n`);
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: mediaUrl.protocol === "https:" ? "https" : "http",
        hostname: mediaUrl.hostname,
        port: mediaUrl.port,
        pathname: "/storage/**",
      },
      ...(r2Url ? [{ protocol: "https" as const, hostname: r2Url.hostname, pathname: "/**" }] : []),
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
      // www and non-www serve the same site; send www to the canonical host.
      ...(siteUrl && !siteUrl.hostname.startsWith("www.")
        ? [{ source: "/:path*", has: [{ type: "host" as const, value: `www.${siteUrl.hostname}` }], destination: `${siteUrl.origin}/:path*`, statusCode: 301 as const }]
        : []),
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
      // Renamed project slugs.
      { source: "/project/rachana-villas", destination: "/project/rachna-villas", statusCode: 301 },
      { source: "/developers/:slug", destination: "/developer/:slug", statusCode: 301 },
      { source: "/developer", destination: "/developers", statusCode: 301 },
    ];
  },
  async headers() {
    // Files in public/ and the app icons have no hash in their name, so Next sends max-age=0 and Cloudflare
    // turns that into 4 hours. Cache them for 30 days instead; give a changed file a new name to bust it.
    const longCache = [
      { key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" },
    ];
    return [
      { source: "/home/:file*", headers: longCache },
      { source: "/footer/:file*", headers: longCache },
      { source: "/brand/:file*", headers: longCache },
      { source: "/:icon(icon.png|apple-icon.png|favicon.ico)", headers: longCache },
      // A page's own `robots` metadata can override the layout's, and images, PDFs and the sitemap carry
      // no meta tag at all, so staging blocks crawlers with a header on every response as well.
      ...(noindex
        ? [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }]
        : []),
    ];
  },
};

export default nextConfig;
