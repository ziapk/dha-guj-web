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
