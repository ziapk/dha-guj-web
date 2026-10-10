export type ImageSize = "thumbnail" | "medium" | "full";

const SIZE_SUFFIX = { thumbnail: "-480.webp", medium: "-1280.webp" } as const;

/**
 * Smaller copy of an uploaded image: the API stores {name}-full.{ext} with {name}-1280.webp (medium) and
 * {name}-480.webp (thumbnail) beside it. Other URLs (older uploads, SVGs, external links) come back unchanged.
 * Production serves images unoptimized, so the browser downloads exactly this URL.
 */
export function sizedImage<T extends string | null | undefined>(url: T, size: ImageSize): T {
  if (!url || size === "full") {
    return url;
  }

  return url.replace(/-full\.[a-z0-9]+(?=$|\?)/i, SIZE_SUFFIX[size]) as T;
}
