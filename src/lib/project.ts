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

export function projectMediaOf(project: PublicProject, type: "video" | "brochure"): ProjectMedia[] {
  return (project.media ?? []).filter((media) => media.type === type);
}

/** "DHA Phase 2, DHA Gujranwala, Gujranwala". */
export function projectLocationOf(project: PublicProject): string {
  return [project.phase, project.society?.name, project.city?.name].filter(Boolean).join(", ");
}

/** "Rs 50 Lakh – Rs 1.2 Crore" over all unit types, or null when no unit has a price. */
export function projectPriceOf(project: PublicProject): string | null {
  return formatPriceRange(project.price_from, project.price_to);
}

export function unitPriceOf(unit: ProjectUnit): string | null {
  return formatPriceRange(unit.price_from, unit.price_to ?? unit.price_from);
}

/** "House · 10 Marla · 4 beds", leaving out whatever the developer did not fill in. */
export function unitSummaryOf(unit: ProjectUnit): string {
  return [
    unit.property_type?.name,
    unit.area_size && unit.area_unit ? formatArea(unit.area_size, unit.area_unit) : null,
    unit.bedrooms !== null ? `${unit.bedrooms} ${unit.bedrooms === 1 ? "bed" : "beds"}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}
