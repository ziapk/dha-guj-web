/** Metadata helpers shared by pages. Server-only. */

import type { Metadata } from "next";
import { sizedImage } from "@/lib/image";
import { getSiteSettings, siteNameOf } from "@/lib/site-data";
import type { SiteSettings } from "@/types/api";

type OpenGraph = NonNullable<Metadata["openGraph"]>;

/** The default share image from SEO settings (its 1280px copy), or undefined when none is set. */
export function defaultOgImages(settings: SiteSettings): OpenGraph["images"] {
  const url = settings.seo.og_image_url;

  return url ? [{ url: sizedImage(url, "medium"), alt: settings.seo.og_image_alt ?? siteNameOf(settings) }] : undefined;
}

type ShareImage = { url: string; alt?: string };

/**
 * A page's share images: the record's own share image when an admin set one (its 1280px copy), else `fallback` (the
 * cover, photo or hero the page would otherwise share). Undefined lets openGraph() use the default share image.
 */
export function shareImages(
  record: { og_image_url?: string | null; og_image_alt?: string | null },
  alt: string,
  fallback?: ShareImage | null,
): ShareImage[] | undefined {
  if (record.og_image_url) {
    return [{ url: sizedImage(record.og_image_url, "medium"), alt: record.og_image_alt ?? alt }];
  }

  return fallback ? [fallback] : undefined;
}

/**
 * A page's openGraph replaces the layout's instead of merging with it, so every page builds it here
 * to keep the site name, locale and type, and the default share image when the page has none.
 */
export async function openGraph(values: OpenGraph & { url: string }): Promise<OpenGraph> {
  const settings = await getSiteSettings();

  return { siteName: siteNameOf(settings), locale: "en_PK", type: "website", ...values, images: values.images ?? defaultOgImages(settings) } as OpenGraph;
}

/** Plain text for meta descriptions, at most `max` characters. */
export function metaText(text: string | null | undefined, max = 160): string {
  const plain = (text ?? "").replace(/\s+/g, " ").trim();

  return plain.length > max ? `${plain.slice(0, max - 1).trimEnd()}…` : plain;
}

/** JSON-LD for a <script type="application/ld+json">, safe against "</script>" in values. */
export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/** Non-production deployments (staging, review apps) set NOINDEX=true at build time to stay out of search results. */
export function noindex(): boolean {
  return process.env.NOINDEX === "true";
}

const NOINDEX_RULE: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: { index: false, follow: false, noimageindex: true },
};

/** Ad and analytics tags: they never change what a page shows, so a URL carrying them is not a filtered copy. */
const TRACKING_PARAM = /^(utm_[a-z_]+|gclid|gbraid|wbraid|dclid|fbclid|msclkid|ttclid|twclid|li_fat_id|mc_cid|mc_eid|_ga|_gl)$/i;

/**
 * robots for a page that reads query parameters: a URL with any parameter (a filter, search, sort or page number)
 * is a copy of the page, so search engines skip it but still follow its links. `indexable` names the parameters that
 * make a landing page of their own, whose canonical URL keeps them. Ad and analytics tags and empty values are ignored.
 */
export function queryRobots(params: Record<string, string | string[] | undefined>, indexable: readonly string[] = []): Metadata["robots"] {
  const filtered = Object.entries(params).some(
    ([key, value]) => !TRACKING_PARAM.test(key) && !indexable.includes(key) && [value].flat().some((item) => item !== undefined && item.trim() !== ""),
  );

  return robots(filtered ? { index: false, follow: true } : undefined);
}

/**
 * A page's `robots` replaces the layout's instead of merging with it — passing `undefined`
 * clears it too — so every page that sets `robots` builds it here to keep staging's noindex.
 */
export function robots(rule?: Metadata["robots"]): Metadata["robots"] {
  return noindex() ? NOINDEX_RULE : rule;
}
