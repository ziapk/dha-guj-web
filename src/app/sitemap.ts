import type { MetadataRoute } from "next";
import { publicApi } from "@/lib/api";
import { postHref } from "@/lib/blog";
import { siteUrl } from "@/lib/site";
import { cmsPageHref, getCmsPages } from "@/lib/site-data";
import type { AgencyProfile, BlogPostSummary, Paginated, PublicProperty } from "@/types/api";

/** Rebuild the sitemap at most once an hour. */
export const revalidate = 3600;

/** The public API returns at most 48 items per page. */
const PER_PAGE = 48;

/** Safety limits: 48 × 200 = 9,600 listings, 48 × 20 = 960 agencies and 48 × 50 = 2,400 posts. A sitemap file may hold 50,000 URLs. */
const MAX_LISTING_PAGES = 200;
const MAX_AGENCY_PAGES = 20;
const MAX_POST_PAGES = 50;

/**
 * Walk every page of a paginated public endpoint. Stops quietly at the first failure,
 * so a build without the API still produces a sitemap with the static pages.
 */
async function collect<T>(path: string, query: Record<string, string | number>, maxPages: number): Promise<T[]> {
  const items: T[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const result = await publicApi<Paginated<T>>(path, { query: { ...query, per_page: PER_PAGE, page }, revalidate }).catch(() => null);

    if (!result) {
      break;
    }

    items.push(...result.data);

    if (page >= result.meta.last_page) {
      break;
    }
  }

  return items;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = siteUrl();

  const [properties, agencies, posts, pages] = await Promise.all([
    collect<PublicProperty>("properties", { sort: "newest" }, MAX_LISTING_PAGES),
    collect<AgencyProfile>("agencies", {}, MAX_AGENCY_PAGES),
    collect<BlogPostSummary>("posts", {}, MAX_POST_PAGES),
    getCmsPages(),
  ]);

  return [
    { url: `${site}/`, changeFrequency: "daily", priority: 1 },
    { url: `${site}/properties`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${site}/properties?purpose=sale`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${site}/properties?purpose=rent`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${site}/agencies`, changeFrequency: "daily", priority: 0.6 },
    { url: `${site}/wanted`, changeFrequency: "daily", priority: 0.5 },
    { url: `${site}/blog`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${site}/pricing`, changeFrequency: "monthly", priority: 0.5 },
    ...properties.map((property) => ({
      url: `${site}/properties/${property.slug}`,
      lastModified: property.refreshed_at ?? property.published_at ?? undefined,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...agencies.map((agency) => ({
      url: `${site}/agencies/${agency.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...posts.map((post) => ({
      url: `${site}${postHref(post.slug)}`,
      lastModified: post.updated_at ?? post.published_at ?? undefined,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...pages.map((page) => ({
      url: `${site}${cmsPageHref(page.slug)}`,
      lastModified: page.updated_at ?? undefined,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ];
}
