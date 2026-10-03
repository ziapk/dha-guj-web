import { cache } from "react";
import { publicApi } from "@/lib/api";
import type { MapAreas, MapConfig, Resource } from "@/types/api";

const MAP_REVALIDATE = 300;

/** Shown when the API is unavailable, so the page still opens on DHA Gujranwala with free imagery. */
const FALLBACK_CONFIG: MapConfig = {
  provider: "esri",
  center: { lat: 32.2869, lng: 74.114 },
  zoom: 15,
  layers: [
    {
      key: "satellite",
      label: "Satellite",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics",
      max_native_zoom: 19,
      labels_url: null,
    },
    {
      key: "streets",
      label: "Streets",
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      max_native_zoom: 19,
      labels_url: null,
    },
  ],
};

export const getMapConfig = cache(async (): Promise<MapConfig> => {
  try {
    const { data } = await publicApi<Resource<MapConfig>>("map/config", { revalidate: MAP_REVALIDATE });

    return data.layers.length > 0 ? data : FALLBACK_CONFIG;
  } catch {
    return FALLBACK_CONFIG;
  }
});

/** The mapped society → phase → sector → block tree and public overlays; null when the API is unavailable. */
export const getMapAreas = cache(async (): Promise<MapAreas | null> => {
  try {
    const { data } = await publicApi<Resource<MapAreas>>("map/areas", { revalidate: MAP_REVALIDATE });

    return data;
  } catch {
    return null;
  }
});
