import dayjs from "dayjs";
import { formatArea, formatPriceRange } from "@/lib/labels";
import type { ProjectMedia, ProjectUnit, PublicProject } from "@/types/api";

/** Construction statuses a buyer can filter by, in the order they happen. */
export const CONSTRUCTION_STATUSES = ["upcoming", "under_construction", "ready"] as const;

/** Expected completion as a month, e.g. "Dec 2027". */
export function completionOf(date: string | null): string | null {
  return date ? dayjs(date).format("MMM YYYY") : null;
}

export function projectHref(slug: string): string {
  return `/projects/${slug}`;
}

/** Photos with the cover first. */
export function projectPhotosOf(project: PublicProject): ProjectMedia[] {
  const photos = (project.media ?? []).filter((media) => media.type === "image");

  return [...photos.filter((photo) => photo.is_cover), ...photos.filter((photo) => !photo.is_cover)];
}

export function projectMediaOf(project: PublicProject, type: ProjectMedia["type"]): ProjectMedia[] {
  return (project.media ?? []).filter((media) => media.type === type);
}

/** The single image of a given kind, e.g. the master plan, or null when there is none. */
export function projectSingleMediaOf(project: PublicProject, type: ProjectMedia["type"]): ProjectMedia | null {
  return projectMediaOf(project, type)[0] ?? null;
}

/** "Block A, Sector K, DHA Phase 2, DHA Gujranwala, Gujranwala". */
export function projectLocationOf(project: PublicProject): string {
  return [project.block, project.sector, project.phase, project.society?.name, project.city?.name].filter(Boolean).join(", ");
}

/** The full postal address, for the location section and schema.org. */
export function projectAddressOf(project: PublicProject): string {
  return [project.street, project.address, project.block, project.sector, project.phase, project.society?.name, project.city?.name]
    .filter(Boolean)
    .join(", ");
}

/** "1.2 km" — how far a nearby place is, however the developer measured it. */
export function nearbyDistanceOf(place: { distance: string | null; distance_unit: string | null }): string | null {
  if (place.distance === null) {
    return null;
  }

  const value = Number(place.distance);

  return `${Number.isInteger(value) ? value : value.toFixed(1)}${place.distance_unit ? ` ${place.distance_unit}` : ""}`;
}

/** "Rs 50 Lakh – Rs 1.2 Crore" over all unit types, or null when no unit has a price. */
export function projectPriceOf(project: PublicProject): string | null {
  return formatPriceRange(project.price_from, project.price_to);
}

export function unitPriceOf(unit: ProjectUnit): string | null {
  return formatPriceRange(unit.price_from, unit.price_to ?? unit.price_from);
}

/** "House · 10 Marla · 4 beds · 3 baths", leaving out whatever the developer did not fill in. */
export function unitSummaryOf(unit: ProjectUnit): string {
  return [
    unit.property_type?.name,
    unit.area_size && unit.area_unit ? formatArea(unit.area_size, unit.area_unit) : null,
    unit.bedrooms !== null ? `${unit.bedrooms} ${unit.bedrooms === 1 ? "bed" : "beds"}` : null,
    unit.bathrooms !== null ? `${unit.bathrooms} ${unit.bathrooms === 1 ? "bath" : "baths"}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** The rooms a unit lists, ready to render as a fact grid. */
export function unitRoomsOf(unit: ProjectUnit): { label: string; value: number }[] {
  const rooms: { label: string; value: number | null }[] = [
    { label: "Bedrooms", value: unit.bedrooms },
    { label: "Bathrooms", value: unit.bathrooms },
    { label: "Drawing room", value: unit.drawing_rooms },
    { label: "Lounge", value: unit.lounges },
    { label: "Kitchen", value: unit.kitchens },
    { label: "Study", value: unit.study_rooms },
    { label: "Store", value: unit.store_rooms },
    { label: "Balcony", value: unit.balconies },
    { label: "Terrace", value: unit.terraces },
    { label: "Parking", value: unit.parking_spaces },
  ];

  return rooms.filter((room): room is { label: string; value: number } => room.value !== null && room.value > 0);
}

/** How a unit's availability reads on the page. */
export const UNIT_AVAILABILITY_LABELS: Record<string, string> = {
  available: "Available",
  limited: "Limited availability",
  sold_out: "Sold out",
  coming_soon: "Coming soon",
};
