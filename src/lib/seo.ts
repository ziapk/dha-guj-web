/**
 * Website-wide SEO metadata. Every public page builds its metadata with pageMetadata(), which gives it a title,
 * description, canonical URL, robots rule, Open Graph and Twitter tags and a share image, falling back to the
 * defaults below only for what the page does not have. Server-only.
 */

import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE, OG_HEIGHT, OG_WIDTH, ogImageSrc, type OgFit } from "@/lib/og-image";
import { getSiteSettings } from "@/lib/site-data";

/** Site-wide defaults from the client's SEO spec. */
export const SEO = {
  siteName: "DHA GRW Properties",
  title: "DHA Gujranwala Properties | Buy, Sell & Rent Properties",
  description:
    "Explore DHA Gujranwala properties for sale and rent, latest plot rates, real estate projects, sector maps, dealers and investment opportunities.",
  locale: "en_PK",
  themeColor: "#1DB2FF",
  defaultImageAlt: "DHA GRW Properties – DHA Gujranwala real estate",
} as const;

/** A picture a page can share; `fit: "contain"` keeps a logo whole instead of cropping it. */
export type ShareImage = { url: string; alt?: string | null; fit?: OgFit };

type OgImage = { url: string; alt: string; width?: number; height?: number; type?: string };

/** The admin's share image of a record, or null when none is set. Pass it first in pageMetadata's `images`. */
export function adminShareImage(record: { og_image_url?: string | null; og_image_alt?: string | null } | null | undefined): ShareImage | null {
  return record?.og_image_url ? { url: record.og_image_url, alt: record.og_image_alt } : null;
}

/** A share image as crawlers see it: uploads come back as a 1200×630 JPEG, so its size is known. */
function ogImage(image: ShareImage, alt: string): OgImage {
  const { url, sized } = ogImageSrc(image.url, image.fit);
  const text = image.alt?.trim() || alt;

  return sized ? { url, alt: text, width: OG_WIDTH, height: OG_HEIGHT, type: "image/jpeg" } : { url, alt: text };
}

/** The share image when a page has none: the one set in SEO settings, else the branded default. */
async function defaultImage(): Promise<OgImage> {
  const settings = await getSiteSettings();

  return settings.seo.og_image_url
    ? ogImage({ url: settings.seo.og_image_url, alt: settings.seo.og_image_alt }, SEO.defaultImageAlt)
    : { url: DEFAULT_OG_IMAGE, alt: SEO.defaultImageAlt, width: OG_WIDTH, height: OG_HEIGHT, type: "image/jpeg" };
}

export type PageSeo = {
  title: string;
  /** The title is complete as written, so the layout's "| site name" is not added to it. */
  absoluteTitle?: boolean;
  description?: string | null;
  /** Canonical path (with any query that makes the page a landing page of its own), e.g. "/dealer/prime-estates". */
  path: string;
  /** Share image candidates, best first (usually adminShareImage(record), then the page's cover or photo); empty ones are skipped. */
  images?: (ShareImage | null | undefined | false | "")[];
  /** Alt text for a share image that has none; the page title by default. */
  imageAlt?: string;
  type?: "website" | "article" | "profile";
  /** Robots rule; indexable by default. Staging's noindex always wins. */
  robots?: Metadata["robots"];
  keywords?: string[] | null;
  /** Social title and description, when an admin wrote different ones for sharing. */
  social?: { title?: string | null; description?: string | null };
  article?: { publishedTime?: string | null; modifiedTime?: string | null; authors?: string[]; section?: string | null; tags?: string[] };
};

/**
 * A page's complete metadata. Next.js replaces (rather than merges) a parent's openGraph, twitter and robots, so
 * every page gets all of them here, with the site name, locale and default share image filled in.
 */
export async function pageMetadata(page: PageSeo): Promise<Metadata> {
  const description = metaText(page.description) || SEO.description;
  const fullTitle = page.absoluteTitle ? page.title : `${page.title} | ${SEO.siteName}`;
  const socialTitle = page.social?.title?.trim() || fullTitle;
  const socialDescription = metaText(page.social?.description) || description;
  const candidate = page.images?.find((image): image is ShareImage => Boolean(image && image.url));
  const image = candidate ? ogImage(candidate, page.imageAlt ?? page.title) : await defaultImage();
  const article = page.type === "article" && page.article
    ? {
        publishedTime: page.article.publishedTime ?? undefined,
        modifiedTime: page.article.modifiedTime ?? undefined,
        authors: page.article.authors,
        section: page.article.section ?? undefined,
        tags: page.article.tags,
      }
    : {};

  return {
    title: page.absoluteTitle ? { absolute: page.title } : page.title,
    description,
    keywords: page.keywords?.length ? page.keywords : undefined,
    alternates: { canonical: page.path },
    robots: robots(page.robots),
    openGraph: {
      type: page.type ?? "website",
      siteName: SEO.siteName,
      locale: SEO.locale,
      url: page.path,
      title: socialTitle,
      description: socialDescription,
      images: [image],
      ...article,
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description: socialDescription,
      images: [{ url: image.url, alt: image.alt }],
    },
  };
}

/** Metadata of a page whose record is missing or unpublished: it renders the 404 page, which is never indexed. */
export function notFoundMetadata(title: string): Metadata {
  return { title, robots: robots({ index: false, follow: false }) };
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

const INDEX_RULE: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
};

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
 * A page's `robots` replaces the layout's instead of merging with it, so every page that sets `robots` builds it
 * here to keep staging's noindex. Without a rule the page is indexable, with large image previews.
 */
export function robots(rule: Metadata["robots"] = INDEX_RULE): Metadata["robots"] {
  return noindex() ? NOINDEX_RULE : rule;
}
