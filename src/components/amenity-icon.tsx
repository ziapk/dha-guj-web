import Image from "next/image";
import { AmenityGlyph } from "@/components/amenity-icons";
import type { Amenity } from "@/types/api";

/** Whether this amenity has an icon to show (built-in or uploaded). */
export function hasAmenityIcon(amenity: Amenity): boolean {
  return (amenity.icon_type === "preset" && Boolean(amenity.icon)) || (amenity.icon_type === "custom" && Boolean(amenity.icon_url));
}

/**
 * The amenity's built-in or uploaded icon, or nothing when it has none.
 * Uploaded icons are served by the API, so they skip image optimisation (its host may not be in next.config).
 */
export function AmenityIcon({ amenity }: { amenity: Amenity }) {
  if (amenity.icon_type === "custom" && amenity.icon_url) {
    return <Image src={amenity.icon_url} alt="" width={20} height={20} className="amenity-icon" unoptimized />;
  }

  return amenity.icon_type === "preset" ? <AmenityGlyph name={amenity.icon} className="amenity-icon" /> : null;
}
