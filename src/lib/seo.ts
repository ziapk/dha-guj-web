/** Metadata helpers shared by pages. Server-only. */

import type { Metadata } from "next";
import { getSiteSettings, siteNameOf } from "@/lib/site-data";

type OpenGraph = NonNullable<Metadata["openGraph"]>;

/**
 * A page's openGraph replaces the layout's instead of merging with it, so every page builds it here
 * to keep the site name, locale and type.
 */
export async function openGraph(values: OpenGraph & { url: string }): Promise<OpenGraph> {
  const settings = await getSiteSettings();

  return { siteName: siteNameOf(settings), locale: "en_PK", type: "website", ...values } as OpenGraph;
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

/**
 * A page's `robots` replaces the layout's instead of merging with it — passing `undefined`
 * clears it too — so every page that sets `robots` builds it here to keep staging's noindex.
 */
export function robots(rule?: Metadata["robots"]): Metadata["robots"] {
  return noindex() ? NOINDEX_RULE : rule;
}
