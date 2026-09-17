import type { City, PropertyMedia, PropertyType, PublicProperty } from "@/types/api";

export function photosOf(property: PublicProperty): PropertyMedia[] {
  const photos = (property.media ?? []).filter((media) => media.type === "image");

  return [...photos.filter((photo) => photo.is_cover), ...photos.filter((photo) => !photo.is_cover)];
}

export function coverOf(property: PublicProperty): PropertyMedia | undefined {
  return photosOf(property)[0];
}

/** The photo fields shared by property and project media. */
export type Photo = Pick<PropertyMedia, "id" | "url" | "thumbnail_url" | "medium_url">;

/** Small (≈480px) photo for cards and thumbnails. */
export function thumbnailUrl(photo: Photo): string {
  return photo.thumbnail_url || photo.url;
}

/** Large (≈1280px) photo for the gallery, lightbox and social previews; the API watermarks this copy. */
export function mediumUrl(photo: Photo): string {
  return photo.medium_url || photo.url;
}

export function locationOf(property: PublicProperty): string {
  return [property.society?.name, property.city?.name].filter(Boolean).join(", ");
}

/** Pakistani mobile number → international digits for wa.me links (03001234567 → 923001234567). */
export function whatsappNumber(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  const international = digits.startsWith("0") ? `92${digits.slice(1)}` : digits;

  return international.length >= 11 ? international : null;
}

export const SEARCH_FILTER_KEYS = [
  "q",
  "purpose",
  "category",
  "property_type_id",
  "city_id",
  "society_id",
  "agency",
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

/** Keep only known, non-empty search parameters. */
export function pickFilters(searchParams: Record<string, string | string[] | undefined>): Record<string, string> {
  const filters: Record<string, string> = {};

  for (const key of SEARCH_FILTER_KEYS) {
    const value = searchParams[key];

    if (typeof value === "string" && value.trim() !== "") {
      filters[key] = value.trim();
    }
  }

  return filters;
}

/** A human heading for the current search, e.g. "Houses for rent in Lahore". */
export function searchHeading(filters: Record<string, string>, cities: City[], propertyTypes: PropertyType[]): string {
  const type = propertyTypes.find((item) => String(item.id) === filters.property_type_id);
  const city = cities.find((item) => String(item.id) === filters.city_id);
  const categoryNames: Record<string, string> = { residential: "Homes", plot: "Plots", commercial: "Commercial properties" };
  const subject = type ? `${type.name}s` : (categoryNames[filters.category ?? ""] ?? "Properties");
  const purpose = filters.purpose === "rent" ? " for rent" : filters.purpose === "sale" ? " for sale" : "";
  const promotion = filters.hot === "1" ? "Hot" : filters.featured === "1" ? "Featured" : "";
  const promoted = promotion ? `${promotion} ${subject.charAt(0).toLowerCase()}${subject.slice(1)}` : subject;

  return `${promoted}${purpose}${city ? ` in ${city.name}` : ""}`;
}
