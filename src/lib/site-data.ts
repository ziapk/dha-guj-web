/** Site settings and CMS pages from the Laravel public API. Server-only (uses publicApi). */

import { cache } from "react";
import { NotFoundError, publicApi } from "@/lib/api";
import type { CmsPage, CmsPageSummary, Collection, Resource, SiteSettings } from "@/types/api";

export const DEFAULT_SITE_NAME = "DHA GUJ Properties";
export const DEFAULT_TAGLINE = "Homes, plots and commercial property for sale and rent across DHA Gujranwala, Lahore, Islamabad and Karachi.";

const SETTINGS_REVALIDATE = 300;
const PAGES_REVALIDATE = 300;

export const EMPTY_SETTINGS: SiteSettings = {
  general: { site_name: null, tagline: null, logo_url: null },
  contact: { email: null, phone: null, whatsapp: null, address: null, office_hours: null },
  social: { facebook: null, instagram: null, youtube: null, x: null, linkedin: null, tiktok: null },
};

/** Top-level routes of this app. A CMS page with one of these slugs would be hidden by the route, so it is never linked. */
export const RESERVED_SLUGS = new Set([
  "account",
  "agencies",
  "api",
  "blog",
  "compare",
  "forgot-password",
  "login",
  "pages",
  "pricing",
  "projects",
  "properties",
  "register",
  "robots.txt",
  "sitemap.xml",
  "wanted",
]);

/** CMS slugs are generated with Str::slug, so anything else (e.g. "wp-login.php") is rejected without calling the API. */
export function isCmsSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 100 && !RESERVED_SLUGS.has(slug);
}

export function cmsPageHref(slug: string): string {
  return `/${slug}`;
}

/** Trimmed value, or null when empty. */
function clean(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

/** Site settings; falls back to empty values so the site still renders when the API is unavailable. */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const { data } = await publicApi<Resource<Partial<SiteSettings>>>("settings", { revalidate: SETTINGS_REVALIDATE });
    const pick = <G extends keyof SiteSettings>(group: G): SiteSettings[G] => {
      const values = { ...EMPTY_SETTINGS[group] } as Record<string, string | null>;
      const source = (data?.[group] ?? {}) as Record<string, unknown>;

      for (const key of Object.keys(values)) {
        values[key] = clean(source[key]);
      }

      return values as SiteSettings[G];
    };

    return { general: pick("general"), contact: pick("contact"), social: pick("social") };
  } catch {
    return EMPTY_SETTINGS;
  }
});

export function hasContactDetails(settings: SiteSettings): boolean {
  return Object.values(settings.contact).some(Boolean);
}

export function siteNameOf(settings: SiteSettings): string {
  return settings.general.site_name ?? DEFAULT_SITE_NAME;
}

/** Published CMS pages (no content); empty when the API is unavailable. Pages whose slug clashes with a route are left out. */
export const getCmsPages = cache(async (): Promise<CmsPageSummary[]> => {
  try {
    const { data } = await publicApi<Collection<CmsPageSummary>>("pages", { revalidate: PAGES_REVALIDATE });

    return data.filter((page) => isCmsSlug(page.slug));
  } catch {
    return [];
  }
});

/** One published CMS page, or null when it does not exist or is a draft. Other API errors are thrown. */
export const getCmsPage = cache(async (slug: string): Promise<CmsPage | null> => {
  if (!isCmsSlug(slug)) {
    return null;
  }

  try {
    const { data } = await publicApi<Resource<CmsPage>>(`pages/${encodeURIComponent(slug)}`, { revalidate: PAGES_REVALIDATE });

    return data;
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null;
    }

    throw error;
  }
});
