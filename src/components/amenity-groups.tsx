import { AmenityIcon, hasAmenityIcon } from "@/components/amenity-icon";
import { groupAmenities } from "@/lib/amenities";
import type { Amenity } from "@/types/api";

/** A listing's or project's amenities under their group headings (a plain list when nothing is grouped), each with its icon or a check mark. */
export function AmenityGroups({ amenities }: { amenities: Amenity[] }) {
  return (
    <>
      {groupAmenities(amenities).map((block) => (
        <div key={block.key} className="feature-group">
          {block.label && <h3>{block.label}</h3>}
          <ul className="amenity-list">
            {block.amenities.map((amenity) => (
              <li key={amenity.id} className={hasAmenityIcon(amenity) ? "has-icon" : undefined}>
                <AmenityIcon amenity={amenity} />
                {amenity.name}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
