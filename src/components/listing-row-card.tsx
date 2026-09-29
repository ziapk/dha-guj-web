import Image from "next/image";
import Link from "next/link";
import { AgencyLogo } from "@/components/agency-card";
import { ListingPhotoSlider } from "@/components/listing-photo-slider";
import { FavoriteButton } from "@/components/favorite-button";
import { AreaIcon, BathIcon, BedIcon, BoulevardIcon, FlameIcon, PhoneIcon, PinIcon, PlotIcon, ShieldCheckIcon, StarIcon, WhatsAppIcon } from "@/components/icons";
import { formatArea, formatCompactPrice } from "@/lib/labels";
import { locationOf, photosOf, propertyHref, thumbnailUrl, whatsappNumber } from "@/lib/property";
import type { PublicProperty } from "@/types/api";

/**
 * Who the listing belongs to: the agency (on its page) or the agent's agency (on an agent page). Named in the
 * footer when the listing has no agent, and its numbers are the fallback for Call and WhatsApp.
 */
export type ListingOwner = {
  name: string;
  logo_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  is_verified: boolean;
  /** Line under the name when no agent is shown; defaults to "Real Estate Agency". */
  subtitle?: string;
};

const ACCOUNT_SUBTITLES: Record<string, string> = { individual: "Property Owner", agency: "Real Estate Agency", agent: "Property Agent", developer: "Developer" };

/** The owner of a search result, from the contact the API sends with it: the agency when there is one, else the person. */
export function ownerOf(property: PublicProperty): ListingOwner {
  const contact = property.contact;
  const agency = contact?.agency ?? null;

  return {
    name: agency?.name ?? contact?.name ?? "Property Owner",
    logo_url: agency?.logo_url ?? null,
    phone: contact?.phone ?? null,
    whatsapp: contact?.whatsapp ?? null,
    is_verified: agency?.is_verified ?? false,
    subtitle: agency ? "Real Estate Agency" : (ACCOUNT_SUBTITLES[contact?.account_type ?? ""] ?? "Property Owner"),
  };
}

const HIGHLIGHTS_SHOWN = 3;

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/** The strongest promotion on the listing, shown under the Verified badge. */
function promotion(property: PublicProperty): { label: string; icon: React.ReactNode } | null {
  if (property.is_hot) {
    return { label: "Hot", icon: <FlameIcon /> };
  }

  if (property.is_premium) {
    return { label: "Premium", icon: <StarIcon /> };
  }

  if (property.is_urgent) {
    return { label: "Urgent", icon: <FlameIcon /> };
  }

  return null;
}

/**
 * A wide listing card for agency and agent pages: photo slider, details, and a footer naming the agent who
 * posted it (or the owner) with Call, WhatsApp and Save.
 */
export function ListingRowCard({ property, owner, priority = false }: { property: PublicProperty; owner: ListingOwner; priority?: boolean }) {
  const href = propertyHref(property);
  const photos = photosOf(property).map(thumbnailUrl);
  const isPlot = property.property_type?.category === "plot";
  const location = [property.sector, property.phase, locationOf(property)].filter(Boolean).join(", ");
  const badge = promotion(property);
  const area = formatArea(property.area_size, property.area_unit);

  const agent = property.agent ?? null;
  const phone = agent?.phone ?? owner.phone;
  const whatsapp = whatsappNumber(agent?.whatsapp ?? agent?.phone ?? owner.whatsapp ?? owner.phone);
  const contactName = agent?.name ?? owner.name;

  const highlights = [
    !isPlot && property.bedrooms !== null ? `${property.bedrooms} ${property.bedrooms === 1 ? "Bedroom" : "Bedrooms"}` : null,
    !isPlot && property.bathrooms !== null ? `${property.bathrooms} ${property.bathrooms === 1 ? "Bathroom" : "Bathrooms"}` : null,
    ...(property.amenities ?? []).slice(0, HIGHLIGHTS_SHOWN).map((amenity) => amenity.name),
  ].filter((item): item is string => Boolean(item));

  return (
    <article className="listing-row">
      <div className="listing-row-main">
        <ListingPhotoSlider photos={photos} href={href} title={property.title} priority={priority}>
          <div className="listing-slider-badges">
            {owner.is_verified && (
              <span className="listing-badge is-verified">
                <ShieldCheckIcon /> Verified
              </span>
            )}
            {badge && (
              <span className="listing-badge is-promo">
                {badge.icon} {badge.label}
              </span>
            )}
          </div>
        </ListingPhotoSlider>

        <div className="listing-row-body">
          <div className="listing-row-top">
            <span className="listing-row-type">
              {property.property_type?.name ?? "Property"}
              {property.purpose === "rent" ? " for Rent" : ""}
            </span>
            {property.is_featured && <span className="listing-row-featured">Featured</span>}
          </div>
          <h3>
            <Link href={href}>{property.title}</Link>
          </h3>
          {location && (
            <p className="listing-row-location">
              <PinIcon /> {location}
            </p>
          )}
          <p className="listing-row-price">
            {formatCompactPrice(property.price)}
            {property.purpose === "rent" && <small> / Month</small>}
          </p>
          {highlights.length > 0 && (
            <ul className="listing-row-highlights">
              {highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          <ul className="listing-row-facts">
            {isPlot ? (
              <>
                <li>
                  <PlotIcon />
                  <span>
                    <strong>{area}</strong> Plot Size
                  </span>
                </li>
                <li>
                  <BoulevardIcon />
                  <span>
                    <strong>{property.property_type?.name ?? "Plot"}</strong> Type
                  </span>
                </li>
              </>
            ) : (
              <>
                {property.bedrooms !== null && (
                  <li>
                    <BedIcon />
                    <span>
                      <strong>{property.bedrooms}</strong> Bedrooms
                    </span>
                  </li>
                )}
                {property.bathrooms !== null && (
                  <li>
                    <BathIcon />
                    <span>
                      <strong>{property.bathrooms}</strong> Bathrooms
                    </span>
                  </li>
                )}
                <li>
                  <AreaIcon />
                  <span>
                    <strong>{area}</strong> Area Size
                  </span>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>

      <footer className="listing-row-foot">
        <div className="listing-row-agent">
          {agent ? (
            <Link href={`/agents/${agent.slug}`} className="listing-row-avatar" aria-hidden="true" tabIndex={-1}>
              {agent.photo_url ? <Image src={agent.photo_url} alt="" width={52} height={52} /> : <span>{initials(agent.name)}</span>}
            </Link>
          ) : (
            <AgencyLogo name={owner.name} logoUrl={owner.logo_url} size={52} />
          )}
          <div>
            <strong>
              {agent ? <Link href={`/agents/${agent.slug}`}>{agent.name}</Link> : owner.name}
              {owner.is_verified && <ShieldCheckIcon className="icon agency-verified-tick" />}
            </strong>
            <span>{agent ? owner.name : (owner.subtitle ?? "Real Estate Agency")}</span>
          </div>
        </div>
        <div className="listing-row-actions">
          {phone && (
            <a className="btn btn-outline" href={`tel:${phone.replace(/[^\d+]/g, "")}`} aria-label={`Call ${contactName}`}>
              <PhoneIcon /> Call
            </a>
          )}
          {whatsapp && (
            <a
              className="btn btn-whatsapp"
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi, I'm interested in "${property.title}".`)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`WhatsApp ${contactName} (opens in a new tab)`}
            >
              <WhatsAppIcon /> WhatsApp
            </a>
          )}
          <FavoriteButton propertyId={property.id} variant="square" />
        </div>
      </footer>
    </article>
  );
}
