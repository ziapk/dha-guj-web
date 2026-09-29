/** The Buy (/buy) and Rent (/rent) listing pages: one design, each locked to one purpose. */

import type { Block, PropertyPurpose, Sector } from "@/types/api";

export type PurposePage = {
  purpose: PropertyPurpose;
  path: "/buy" | "/rent";
  /** Tab and menu label. */
  label: string;
  /** "Buy Property in", "Rent Property in"; the place name is added in the accent colour. */
  title: string;
  /** "for sale" / "for rent", for headings and page titles. */
  phrase: string;
};

export const PURPOSE_PAGES: Record<PropertyPurpose, PurposePage> = {
  sale: { purpose: "sale", path: "/buy", label: "Buy", title: "Buy Property in", phrase: "for sale" },
  rent: { purpose: "rent", path: "/rent", label: "Rent", title: "Rent Property in", phrase: "for rent" },
};

/** Results per page; "Load more" asks /api/properties for the next page of the same size. */
export const PURPOSE_PAGE_SIZE = 12;

/** Filters the Buy / Rent page reads from its URL; purpose is fixed by the route, so it is not one of them. */
export const PURPOSE_FILTER_KEYS = [
  "q",
  "category",
  "property_type_id",
  "city_id",
  "society_id",
  "sector",
  "block",
  "min_price",
  "max_price",
  "min_area",
  "max_area",
  "area_unit",
  "bedrooms",
  "bathrooms",
  "installments",
  "featured",
  "hot",
  "sort",
  "page",
] as const;

export function purposeFilters(searchParams: Record<string, string | string[] | undefined>): Record<string, string> {
  const filters: Record<string, string> = {};

  for (const key of PURPOSE_FILTER_KEYS) {
    const value = searchParams[key];

    if (typeof value === "string" && value.trim() !== "") {
      filters[key] = value.trim();
    }
  }

  return filters;
}

/** The page URL for a set of filters (never with page=1). */
export function purposeHref(path: string, filters: Record<string, string>): string {
  const params = new URLSearchParams(Object.entries(filters).filter(([key, value]) => value !== "" && !(key === "page" && value === "1")));
  const query = params.toString();

  return query ? `${path}?${query}` : path;
}

/**
 * Sector names for the filter (the same name can exist in several phases, so it is listed once),
 * each with the names of its blocks. Listings store the sector and block as text, which is what the API filters on.
 */
export type SectorOption = { name: string; blocks: string[] };

export function sectorOptions(sectors: Sector[], blocks: Block[]): SectorOption[] {
  const byName = new Map<string, Set<string>>();
  const nameOf = new Map(sectors.map((sector) => [sector.id, sector.name]));

  for (const sector of sectors) {
    if (!byName.has(sector.name)) {
      byName.set(sector.name, new Set());
    }
  }

  for (const block of blocks) {
    const sector = nameOf.get(block.sector_id);

    if (sector) {
      byName.get(sector)?.add(block.name);
    }
  }

  return [...byName].map(([name, names]) => ({ name, blocks: [...names] }));
}
