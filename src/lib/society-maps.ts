import { cache } from "react";
import { NotFoundError, publicApi } from "@/lib/api";
import type { Paginated, PublicSocietyMap, Resource, SocietyMapCategory, SocietyMapFilters } from "@/types/api";

const MAPS_REVALIDATE = 300;

export const SOCIETY_MAPS_PER_PAGE = 12;

export function societyMapHref(slug: string): string {
  return `/map/${slug}`;
}

export const SOCIETY_MAP_CATEGORIES: SocietyMapCategory[] = ["master_plan", "sector", "block", "commercial", "location", "other"];

export function isSocietyMapCategory(value: string | undefined): value is SocietyMapCategory {
  return SOCIETY_MAP_CATEGORIES.includes(value as SocietyMapCategory);
}

/** One page of published maps with the filter options; null when the API is unavailable. */
export const getSocietyMaps = cache(
  async (page: number, filters: { category?: string; society?: string; search?: string } = {}, perPage = SOCIETY_MAPS_PER_PAGE): Promise<(Paginated<PublicSocietyMap> & { filters: SocietyMapFilters }) | null> => {
    try {
      return await publicApi<Paginated<PublicSocietyMap> & { filters: SocietyMapFilters }>("society-maps", {
        query: { page, per_page: perPage, ...filters },
        revalidate: MAPS_REVALIDATE,
      });
    } catch {
      return null;
    }
  },
);

export const getSocietyMap = cache(async (slug: string): Promise<(Resource<PublicSocietyMap> & { related: PublicSocietyMap[] }) | null> => {
  try {
    return await publicApi<Resource<PublicSocietyMap> & { related: PublicSocietyMap[] }>(`society-maps/${encodeURIComponent(slug)}`, { revalidate: MAPS_REVALIDATE });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null;
    }

    throw error;
  }
});

/** "DHA Gujranwala · Phase II · Sector G", leaving out what is not set. */
export function societyMapLocation(map: PublicSocietyMap): string {
  return [map.society?.name, map.phase ? `Phase ${map.phase.name}` : null, map.sector ? `Sector ${map.sector.name}` : null].filter(Boolean).join(" · ");
}

export function fileSizeLabel(bytes: number | null): string | null {
  if (!bytes) {
    return null;
  }

  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
