import type { NextRequest } from "next/server";
import sharp from "sharp";
import { DEFAULT_OG_IMAGE, OG_HEIGHT, OG_WIDTH, uploadUrl } from "@/lib/og-image";
import { siteUrl } from "@/lib/site";

/** Largest source image fetched, in bytes. */
const MAX_BYTES = 20 * 1024 * 1024;

/**
 * The default image, for a missing or broken source; cached briefly so a fixed upload shows up soon. The site URL,
 * not the request's, because behind a reverse proxy the request may carry an internal host.
 */
function fallback(): Response {
  return new Response(null, { status: 307, headers: { Location: `${siteUrl()}${DEFAULT_OG_IMAGE}`, "Cache-Control": "public, max-age=300" } });
}

/**
 * A share (Open Graph) image: ?src= (an upload on the API storage or R2 bucket) as a 1200×630 JPEG, which every
 * social network accepts. Photos are cropped to fill the frame around their most interesting part; ?fit=contain
 * fits the whole picture on white, for logos. Upload URLs never change content, so the result is cached for long.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const source = uploadUrl(request.nextUrl.searchParams.get("src"));
  const contain = request.nextUrl.searchParams.get("fit") === "contain";

  if (!source) {
    return fallback();
  }

  try {
    const response = await fetch(source, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
    const length = Number(response.headers.get("content-length") ?? 0);

    if (!response.ok || length > MAX_BYTES || !(response.headers.get("content-type") ?? "").startsWith("image/")) {
      return fallback();
    }

    const input = Buffer.from(await response.arrayBuffer());

    if (input.byteLength > MAX_BYTES) {
      return fallback();
    }

    const image = await sharp(input, { limitInputPixels: 60_000_000 })
      .rotate()
      .resize(OG_WIDTH, OG_HEIGHT, contain ? { fit: "contain", background: "#ffffff" } : { fit: "cover", position: sharp.strategy.attention })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();

    return new Response(new Uint8Array(image), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400",
      },
    });
  } catch {
    return fallback();
  }
}
