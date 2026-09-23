import Image from "next/image";
import Link from "next/link";
import { CompareButton } from "@/components/compare-button";
import { FavoriteButton } from "@/components/favorite-button";
import { AreaIcon, BathIcon, BedIcon, BoulevardIcon, CameraIcon, FlameIcon, HomeIcon, PinIcon, PlotIcon } from "@/components/icons";
import { PROPERTY_PURPOSE_LABELS, formatArea, formatCompactPrice } from "@/lib/labels";
import { coverOf, locationOf, photosOf, thumbnailUrl } from "@/lib/property";
import type { PublicProperty } from "@/types/api";

type CardLayout = "grid" | "list";

/** The purpose badge: blue for sale, violet for rent, green for plots, amber for commercial. */
function purposeBadge(property: PublicProperty): { tone: string; label: string } {
  const category = property.property_type?.category;

  if (property.purpose === "rent") {
    return { tone: "rent", label: PROPERTY_PURPOSE_LABELS.rent };
  }

  if (category === "commercial") {
    return { tone: "commercial", label: "Commercial" };
  }

  return { tone: category === "plot" ? "plot" : "sale", label: PROPERTY_PURPOSE_LABELS.sale };
}

export function PropertyCard({ property, priority = false, layout = "grid" }: { property: PublicProperty; priority?: boolean; layout?: CardLayout }) {
  const cover = coverOf(property);
  const photoCount = photosOf(property).length;
  const isList = layout === "list";
  const isPlot = property.property_type?.category === "plot";
  const badge = purposeBadge(property);
  const location = [property.block, property.sector, property.phase, locationOf(property)].filter(Boolean).join(", ");

  return (
    <article className={`property-card${isList ? " is-list" : ""}`}>
      <Link href={`/properties/${property.slug}`} className="property-card-link">
        <div className="property-card-cover">
          {cover ? (
            <Image
              src={thumbnailUrl(cover)}
              alt={property.title}
              fill
              priority={priority}
              sizes={isList ? "(max-width: 719px) 100vw, 340px" : "(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 33vw"}
              style={{ objectFit: "cover" }}
            />
          ) : (
            <HomeIcon className="placeholder-icon" />
          )}
          <div className="property-card-badges">
            {property.is_hot && (
              <span className="badge badge-hot">
                <FlameIcon /> Hot
              </span>
            )}
            {property.is_featured && <span className="badge badge-featured">Featured</span>}
            <span className={`badge badge-purpose badge-${badge.tone}`}>{badge.label}</span>
          </div>
          {photoCount > 1 && (
            <span className="photo-count">
              <CameraIcon /> {photoCount}
            </span>
          )}
        </div>

        <div className="property-card-body">
          <h3 className="property-card-title">{property.title}</h3>
          {location && (
            <p className="property-card-location">
              <PinIcon /> <span>{location}</span>
            </p>
          )}
          <ul className="property-card-facts">
            {isPlot ? (
              <>
                <li>
                  <PlotIcon /> {formatArea(property.area_size, property.area_unit)}
                </li>
                <li>
                  <BoulevardIcon /> {property.property_type?.name ?? "Plot"}
                </li>
              </>
            ) : (
              <>
                {property.bedrooms !== null && (
                  <li>
                    <BedIcon /> {property.bedrooms} {property.bedrooms === 1 ? "Bed" : "Beds"}
                  </li>
                )}
                {property.bathrooms !== null && (
                  <li>
                    <BathIcon /> {property.bathrooms} {property.bathrooms === 1 ? "Bath" : "Baths"}
                  </li>
                )}
                <li>
                  <AreaIcon /> {formatArea(property.area_size, property.area_unit)}
                </li>
              </>
            )}
          </ul>
          {isList && <p className="property-card-description">{property.description}</p>}
          <div className="property-card-price">
            {formatCompactPrice(property.price)}
            {property.purpose === "rent" && <small> / Month</small>}
            {property.installment_available && <span className="tag">Installments</span>}
          </div>
        </div>
      </Link>
      <FavoriteButton propertyId={property.id} />
      <CompareButton propertyId={property.id} />
    </article>
  );
}
