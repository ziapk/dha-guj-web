import Image from "next/image";
import Link from "next/link";
import { CompareButton } from "@/components/compare-button";
import { FavoriteButton } from "@/components/favorite-button";
import { AreaIcon, BathIcon, BedIcon, CameraIcon, ClockIcon, FlameIcon, HomeIcon, PinIcon } from "@/components/icons";
import { PROPERTY_PURPOSE_LABELS, formatArea, formatCompactPrice, listedAgo } from "@/lib/labels";
import { coverOf, locationOf, photosOf, thumbnailUrl } from "@/lib/property";
import type { PublicProperty } from "@/types/api";

type CardLayout = "grid" | "list";

export function PropertyCard({ property, priority = false, layout = "grid" }: { property: PublicProperty; priority?: boolean; layout?: CardLayout }) {
  const cover = coverOf(property);
  const photoCount = photosOf(property).length;
  const isList = layout === "list";
  const isPlot = property.property_type?.category === "plot";

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
              sizes={isList ? "(max-width: 719px) 100vw, 340px" : "(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 25vw"}
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
            <span className="badge">{PROPERTY_PURPOSE_LABELS[property.purpose]}</span>
          </div>
          {photoCount > 1 && (
            <span className="photo-count">
              <CameraIcon /> {photoCount}
            </span>
          )}
        </div>

        <div className="property-card-body">
          {property.property_type && <span className="property-card-type">{property.property_type.name}</span>}
          <div className="property-card-price">
            {formatCompactPrice(property.price)}
            {property.purpose === "rent" && <small> / month</small>}
          </div>
          <h3 className="property-card-title">{property.title}</h3>
          <ul className="property-card-facts">
            {!isPlot && property.bedrooms !== null && (
              <li>
                <BedIcon /> {property.bedrooms} {property.bedrooms === 1 ? "bed" : "beds"}
              </li>
            )}
            {!isPlot && property.bathrooms !== null && (
              <li>
                <BathIcon /> {property.bathrooms} {property.bathrooms === 1 ? "bath" : "baths"}
              </li>
            )}
            <li>
              <AreaIcon /> {formatArea(property.area_size, property.area_unit)}
            </li>
          </ul>
          <p className="property-card-location">
            <PinIcon /> <span>{[property.block, property.phase, locationOf(property)].filter(Boolean).join(", ")}</span>
          </p>
          {isList && <p className="property-card-description">{property.description}</p>}
          <div className="property-card-foot">
            <span>
              <ClockIcon /> Listed {listedAgo(property.published_at ?? property.refreshed_at)}
            </span>
            {property.installment_available && <span className="tag">Installments</span>}
          </div>
        </div>
      </Link>
      <FavoriteButton propertyId={property.id} />
      <CompareButton propertyId={property.id} />
    </article>
  );
}
