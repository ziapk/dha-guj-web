import { siteUrl } from "@/lib/site";
import type { CmsPage } from "@/types/api";

type Schema = Record<string, unknown>;

/**
 * The JSON-LD for a CMS page, in order: the page block (the layout's default type unless the admin picked
 * another, left out when they picked "none"), breadcrumbs, then any blocks the admin pasted in.
 */
export function cmsPageSchemas(page: Pick<CmsPage, "title" | "schema_type" | "schema_custom">, path: string, main: Schema): Schema[] {
  const url = `${siteUrl()}${path}`;
  const blocks: Schema[] = [];

  if (page.schema_type !== "none") {
    blocks.push({ "@context": "https://schema.org", ...main, ...(page.schema_type ? { "@type": page.schema_type } : {}), url });
  }

  blocks.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl() },
      { "@type": "ListItem", position: 2, name: page.title, item: url },
    ],
  });

  const custom = page.schema_custom;

  for (const block of Array.isArray(custom) ? custom : custom ? [custom] : []) {
    blocks.push({ "@context": "https://schema.org", ...block });
  }

  return blocks;
}
