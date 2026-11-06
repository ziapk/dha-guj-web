import type { NextRequest } from "next/server";
import { uploadUrl } from "@/lib/og-image";

/** Largest icon fetched, in bytes. */
const MAX_BYTES = 512 * 1024;

/**
 * An uploaded SVG amenity icon (?src=, on the API storage or R2 bucket) served from this site, so the page can use
 * it as a CSS mask and paint it in the theme colour: the media hosts send no CORS headers, which a cross-origin
 * mask needs. The SVG is never run as a page here: its CSP blocks scripts if someone opens it directly.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const source = uploadUrl(request.nextUrl.searchParams.get("src"));

  if (!source || !/\.svg$/i.test(source.pathname)) {
    return new Response(null, { status: 404 });
  }

  try {
    const response = await fetch(source, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
    const length = Number(response.headers.get("content-length") ?? 0);

    if (!response.ok || length > MAX_BYTES || !(response.headers.get("content-type") ?? "").startsWith("image/svg+xml")) {
      return new Response(null, { status: 404 });
    }

    const svg = await response.arrayBuffer();

    if (svg.byteLength > MAX_BYTES) {
      return new Response(null, { status: 404 });
    }

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
