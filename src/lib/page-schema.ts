import { breadcrumbList, webPageSchemas, type Schema, type WebPageOptions } from "@/lib/schema";
import type { CmsPage } from "@/types/api";

/** What a CMS layout says about its page; the admin's schema type, when set, replaces `type`. */
export type CmsPageSchema = Omit<WebPageOptions, "path" | "name" | "breadcrumb" | "dateModified">;

/**
 * The JSON-LD for a CMS page, in order: the page node (the layout's default type unless the admin picked another;
 * left out when they picked "none"), breadcrumbs, then any blocks the admin pasted in.
 */
export function cmsPageSchemas(page: Pick<CmsPage, "title" | "meta_title" | "meta_description" | "updated_at" | "schema_type" | "schema_custom">, path: string, main: CmsPageSchema = {}): Schema[] {
  const trail = [{ name: page.title, path }];
  const blocks: Schema[] =
    page.schema_type === "none"
      ? [breadcrumbList(path, trail)]
      : webPageSchemas({
          description: page.meta_description,
          ...main,
          type: page.schema_type ?? main.type,
          path,
          name: page.meta_title ?? page.title,
          breadcrumb: trail,
          dateModified: page.updated_at,
        });

  const custom = page.schema_custom;

  return [...blocks, ...(Array.isArray(custom) ? custom : custom ? [custom] : [])];
}
