"use client";

import { useQuery } from "@tanstack/react-query";
import type { Collection, PublicProperty } from "@/types/api";

/**
 * Live listings for ids kept in the browser, in the same order as the ids. Listings that are no longer live are left out.
 * `details` loads full listings (with amenities) and is meant for three ids at most.
 */
export function useListingsByIds(ids: number[], { details = false }: { details?: boolean } = {}) {
  const key = ids.join(",");

  return useQuery({
    queryKey: ["listings-by-ids", key, details],
    enabled: ids.length > 0,
    staleTime: 60 * 1000,
    retry: 1,
    queryFn: async (): Promise<PublicProperty[]> => {
      const response = await fetch(`/api/listings?ids=${key}${details ? "&details=1" : ""}`);

      if (!response.ok) {
        throw new Error("Could not load listings.");
      }

      const payload = (await response.json()) as Collection<PublicProperty>;
      const byId = new Map(payload.data.map((property) => [property.id, property]));

      return key
        .split(",")
        .map((id) => byId.get(Number(id)))
        .filter((property): property is PublicProperty => Boolean(property));
    },
  });
}
