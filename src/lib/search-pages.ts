import { cache } from "react";
import { NotFoundError, publicApi } from "@/lib/api";
import { formatAreaRange, formatPriceRange } from "@/lib/labels";
import type { Collection, Resource, SearchPage } from "@/types/api";

const SEARCH_PAGES_REVALIDATE = 300;

export function searchPageHref(slug: string): string {
  return `/properties/${slug}`;
}

/** One active landing page, or null when there is none with this slug. */
export const getSearchPage = cache(async (slug: string): Promise<SearchPage | null> => {
  try {
    return (await publicApi<Resource<SearchPage>>(`search-pages/${encodeURIComponent(slug)}`, { revalidate: SEARCH_PAGES_REVALIDATE })).data;
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null;
    }

    throw error;
  }
});

/** Active landing pages in the admin's order; `homepage` keeps only the ones picked for the home page links. */
export async function getSearchPages(homepage = false, revalidate = SEARCH_PAGES_REVALIDATE): Promise<SearchPage[]> {
  return publicApi<Collection<SearchPage>>("search-pages", {
    query: homepage ? { homepage: 1 } : {},
    revalidate,
  })
    .then((response) => response.data)
    .catch(() => []);
}

export type SearchPageGroup = {
  title: string;
  links: { label: string; href: string }[];
};

/** Home page columns: pages grouped by their column name, columns in order of their first page. */
export function searchPageGroups(pages: SearchPage[]): SearchPageGroup[] {
  const groups = new Map<string, SearchPageGroup>();

  for (const page of pages) {
    const title = page.group?.trim() || "Popular Searches";
    const group = groups.get(title) ?? { title, links: [] };
    group.links.push({ label: page.title, href: searchPageHref(page.slug) });
    groups.set(title, group);
  }

  return [...groups.values()];
}

/** The page's filters as short chips ("5 Marla", "House", "Sector A"), including ones the hero bar has no field for. */
export function searchPageChips(page: SearchPage): string[] {
  return [
    formatAreaRange(page.min_area, page.max_area, page.area_unit ?? "marla"),
    page.property_type?.name ?? null,
    page.sector,
    page.block,
    page.bedrooms !== null ? `${page.bedrooms}+ beds` : null,
    formatPriceRange(page.min_price, page.max_price),
    page.keyword ? `“${page.keyword}”` : null,
  ].filter((chip): chip is string => Boolean(chip));
}
