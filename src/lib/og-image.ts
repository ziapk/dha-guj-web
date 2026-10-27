/** Share (Open Graph) images: every uploaded share image is served through /og-image as a 1200×630 JPEG. Server-only. */

import { sizedImage } from "@/lib/image";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** The branded share image used when a page has no picture of its own and SEO settings set none. */
export const DEFAULT_OG_IMAGE = "/brand/og-default.jpg";

/** How a picture fills the 1200×630 frame: photos are cropped to fill it, logos are fitted whole on white. */
export type OgFit = "cover" | "contain";

/** Hosts that serve uploads: the API's storage and the Cloudflare R2 bucket. /og-image fetches from nowhere else. */
function mediaHosts(): string[] {
  return [process.env.API_MEDIA_URL, process.env.R2_MEDIA_URL].flatMap((value) => {
    try {
      return value ? [new URL(value).host] : [];
    } catch {
      return [];
    }
  });
}

/** The URL when it is an http(s) upload on one of the media hosts, else null. */
export function uploadUrl(url: string | null | undefined): URL | null {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);

    return ["http:", "https:"].includes(parsed.protocol) && mediaHosts().includes(parsed.host) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Where crawlers fetch an image from: an upload goes through /og-image (its 1280px copy, cropped or fitted to
 * 1200×630 and validated, with the default image when it is missing or broken); anything else is used as is.
 */
export function ogImageSrc(url: string, fit: OgFit = "cover"): { url: string; sized: boolean } {
  const medium = sizedImage(url, "medium");

  if (!uploadUrl(medium)) {
    return { url, sized: false };
  }

  const query = new URLSearchParams({ src: medium });

  if (fit === "contain") {
    query.set("fit", "contain");
  }

  return { url: `/og-image?${query}`, sized: true };
}
