import type { CSSProperties } from "react";
import Image from "next/image";
import { AmenityGlyph } from "@/components/amenity-icons";
import { sizedImage } from "@/lib/image";
import { uploadUrl } from "@/lib/og-image";
import type { Amenity } from "@/types/api";

/** Whether this amenity has an icon to show (built-in or uploaded). */
export function hasAmenityIcon(amenity: Amenity): boolean {
  return (amenity.icon_type === "preset" && Boolean(amenity.icon)) || (amenity.icon_type === "custom" && Boolean(amenity.icon_url));
}

/**
 * The amenity's built-in or uploaded icon, or nothing when it has none.
 * An uploaded SVG is drawn as a mask in the text colour (via /amenity-icon), so it matches the built-in icons
 * whatever colour it was drawn in; other uploads are shown as they are. Uploaded icons skip image optimisation
 * (the API host may not be in next.config).
 */
export function AmenityIcon({ amenity }: { amenity: Amenity }) {
  if (amenity.icon_type === "custom" && amenity.icon_url) {
    const upload = uploadUrl(amenity.icon_url);

    if (upload && /\.svg$/i.test(upload.pathname)) {
      const mask = `url("/amenity-icon?${new URLSearchParams({ src: upload.href })}")`;

      return <span className="amenity-icon amenity-icon-mask" style={{ "--amenity-icon": mask } as CSSProperties} aria-hidden="true" />;
    }

    return <Image src={sizedImage(amenity.icon_url, "thumbnail")} alt="" width={20} height={20} className="amenity-icon" unoptimized />;
  }

  return amenity.icon_type === "preset" ? <AmenityGlyph name={amenity.icon} className="amenity-icon" /> : null;
}
