/** Cities, societies and property types for forms. Server-only (uses publicApi); each list is empty when the API is unavailable. */

import { publicApi } from "@/lib/api";
import type { City, Collection, PropertyType, Society } from "@/types/api";

export type MasterData = { cities: City[]; societies: Society[]; propertyTypes: PropertyType[] };

export async function getMasterData(): Promise<MasterData> {
  const [cities, societies, propertyTypes] = await Promise.all([
    publicApi<Collection<City>>("cities", { revalidate: 3600 }).then((response) => response.data).catch(() => []),
    publicApi<Collection<Society>>("societies", { revalidate: 3600 }).then((response) => response.data).catch(() => []),
    publicApi<Collection<PropertyType>>("property-types", { revalidate: 3600 }).then((response) => response.data).catch(() => []),
  ]);

  return { cities, societies, propertyTypes };
}
