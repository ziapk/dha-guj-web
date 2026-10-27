/**
 * Schema.org entities for the site's records (listings, projects, dealers, agents, developers, authors, posts and
 * maps), built from the same API data the pages render. See src/lib/schema.ts for the shared building blocks.
 */

import { agentHref, agentSocials } from "@/lib/agents";
import { altText, galleryPhotoAlt, logoAlt } from "@/lib/alt-text";
import { authorHref, authorSocials } from "@/lib/authors";
import { AREA_UNIT_LABELS } from "@/lib/labels";
import { postHref } from "@/lib/blog";
import { areaTitle, blockName, mapsHref, sectorName, type SectorEntry } from "@/lib/plot-finder-shared";
import { societyMapHref } from "@/lib/society-maps";
import { developerHref } from "@/lib/developers";
import { projectHref, projectPhotosOf } from "@/lib/project";
import { descriptionText, mediumUrl, photosOf, propertyHref } from "@/lib/property";
import {
  absoluteUrl,
  brandRef,
  geoCoordinates,
  imageObject,
  itemListSchema,
  postalAddress,
  ref,
  sameAsLinks,
  schemaId,
  schemaNumber,
  schemaText,
  videoSchema,
  type Schema,
} from "@/lib/schema";
import type { AgencyProfile, AreaUnit, BlogPost, GeoPolygon, MapBlock, PublicSocietyMap, PropertySeo, PublicAgent, PublicAuthor, PublicDeveloper, PublicProject, PublicProperty } from "@/types/api";

/** Prices on the website are in Pakistani rupees. */
export const SCHEMA_CURRENCY = "PKR";

/** UN/CEFACT codes for the area units that have one; marla and kanal are local units, so they go as text only. */
const AREA_UNIT_CODES: Partial<Record<AreaUnit, string>> = { sq_ft: "FTK", sq_yd: "YDK", sq_m: "MTK" };

/** An area as a QuantitativeValue, e.g. 10 Marla. */
export function areaSchema(size: string | number | null | undefined, unit: AreaUnit | null | undefined): Schema | null {
  const value = schemaNumber(size);

  if (!value || !unit) {
    return null;
  }

  return { "@type": "QuantitativeValue", value, unitCode: AREA_UNIT_CODES[unit], unitText: AREA_UNIT_LABELS[unit] };
}

/** A society (e.g. DHA Gujranwala) as the Place a listing or project is in. */
function societyPlace(society: { name: string } | null | undefined, city: { name: string } | null | undefined): Schema | null {
  if (!society) {
    return city ? { "@type": "City", name: city.name } : null;
  }

  return { "@type": "Place", name: society.name, containedInPlace: city ? { "@type": "City", name: city.name } : undefined };
}

/** A brief dealer reference (full details live on the dealer's own page under the same id). */
export function dealerRef(agency: { name: string; slug: string } | null | undefined): Schema | null {
  return agency ? { "@type": "RealEstateAgent", "@id": schemaId.dealer(agency.slug), name: agency.name, url: absoluteUrl(`/dealer/${agency.slug}`) } : null;
}

/* ---------- Property listings ---------- */

/**
 * The schema type of what a listing offers: Apartment for flats, House / SingleFamilyResidence for houses and villas,
 * Accommodation for portions, and a plain Place for plots, files and commercial units.
 */
function listingTypeOf(property: PublicProperty): string {
  const slug = property.property_type?.slug ?? "";

  if (property.property_type?.category !== "residential") {
    return "Place";
  }

  if (/flat|apartment/.test(slug)) {
    return "Apartment";
  }

  if (/villa|bungalow/.test(slug)) {
    return "SingleFamilyResidence";
  }

  if (/house|home/.test(slug)) {
    return "House";
  }

  return "Accommodation";
}

/** schema.org availability of a listing: sold / rented / expired listings are no longer on offer. */
export function listingAvailability(property: PublicProperty, notice: PropertySeo["notice"]): string {
  if (notice === "sold" || notice === "rented" || property.property_status === "sold" || property.property_status === "rented") {
    return "https://schema.org/SoldOut";
  }

  if (notice === "expired") {
    return "https://schema.org/Discontinued";
  }

  return property.property_status === "under_offer" ? "https://schema.org/LimitedAvailability" : "https://schema.org/InStock";
}

/**
 * A listing page: the property (House, Apartment, Place…) with its address, position, size, rooms, amenities and
 * photos; the sale or rent Offer for it, offered by the dealer; and YouTube videos shown on the page.
 */
export function propertySchemas(property: PublicProperty, path: string, notice: PropertySeo["notice"]): Schema[] {
  const url = absoluteUrl(path);
  const propertyId = `${url}#property`;
  const type = listingTypeOf(property);
  const isAccommodation = type !== "Place";
  const photos = photosOf(property).slice(0, 10);
  const area = areaSchema(property.area_size, property.area_unit);
  const price = schemaNumber(property.price);
  const description = schemaText(descriptionText(property.description));
  const videos = (property.media ?? []).filter((media) => media.type === "video");

  const place: Schema = {
    "@type": type,
    "@id": propertyId,
    name: property.title,
    description,
    url,
    image: photos.map((photo, index) => imageObject(mediumUrl(photo), { caption: galleryPhotoAlt(photo.alt_text, property.title, index, photos.length) })),
    address: postalAddress({
      street: [property.address, property.block, property.sector, property.phase, property.society?.name].filter(Boolean).join(", "),
      locality: property.city?.name,
      country: "PK",
    }),
    geo: geoCoordinates(property.latitude, property.longitude),
    containedInPlace: societyPlace(property.society, property.city),
    // Accommodation types have a floor size and rooms; a plot or shop gives its size as a plain property instead.
    floorSize: isAccommodation ? area : undefined,
    additionalProperty: isAccommodation || !area ? undefined : [{ "@type": "PropertyValue", name: "Area", value: area.value, unitCode: area.unitCode, unitText: area.unitText }],
    numberOfBedrooms: isAccommodation ? (property.bedrooms ?? undefined) : undefined,
    numberOfBathroomsTotal: isAccommodation ? (property.bathrooms ?? undefined) : undefined,
    yearBuilt: isAccommodation ? (property.year_built ?? undefined) : undefined,
    amenityFeature: (property.amenities ?? []).map((amenity) => ({ "@type": "LocationFeatureSpecification", name: amenity.name, value: true })),
  };

  const offer: Schema | null = price
    ? {
        "@type": "Offer",
        "@id": `${url}#offer`,
        url,
        name: property.title,
        category: property.property_type?.name,
        price,
        priceCurrency: SCHEMA_CURRENCY,
        priceSpecification:
          property.purpose === "rent" ? { "@type": "UnitPriceSpecification", price, priceCurrency: SCHEMA_CURRENCY, unitCode: "MON", unitText: "month" } : undefined,
        businessFunction: property.purpose === "rent" ? "http://purl.org/goodrelations/v1#LeaseOut" : "http://purl.org/goodrelations/v1#Sell",
        availability: listingAvailability(property, notice),
        validFrom: property.published_at ?? undefined,
        itemOffered: ref(propertyId),
        offeredBy: dealerRef(property.contact?.agency),
      }
    : null;

  const videoBlocks = videos.map((video, index) =>
    videoSchema(video.url, {
      id: `${url}#video-${index + 1}`,
      name: videos.length > 1 ? `${property.title} — video ${index + 1}` : `${property.title} — video`,
      description,
      uploadDate: property.published_at,
    }),
  );

  return [place, offer, ...videoBlocks].filter((block): block is Schema => Boolean(block));
}

/* ---------- Projects and developers ---------- */

/** A brief developer reference (full details live on the developer's own page under the same id). */
export function developerRef(developer: { name: string; slug: string } | null | undefined): Schema | null {
  return developer ? { "@type": "Organization", "@id": schemaId.developer(developer.slug), name: developer.name, url: absoluteUrl(developerHref(developer.slug)) } : null;
}

/**
 * The schema type of a project: ApartmentComplex for apartment / tower projects, a plain Place for purely
 * commercial ones, else a Residence (a housing project).
 */
function projectTypeOf(project: PublicProject): string {
  const text = [project.project_type, project.category, project.unit_type].filter(Boolean).join(" ").toLowerCase();

  if (/apartment|flat|tower|condo/.test(text)) {
    return "ApartmentComplex";
  }

  if (/commercial|mall|plaza|office|shop|retail/.test(text) && !/residential|housing|villa|house|home/.test(text)) {
    return "Place";
  }

  return "Residence";
}

/**
 * A project page: the project as a Residence / ApartmentComplex / Place with its address, position, photos, floor
 * plans and amenities; a price range AggregateOffer only when the developer publishes prices; YouTube videos.
 */
export function projectSchemas(project: PublicProject): Schema[] {
  const path = projectHref(project.slug);
  const url = absoluteUrl(path);
  const type = projectTypeOf(project);
  const isResidence = type !== "Place";
  const photos = projectPhotosOf(project).slice(0, 10);
  const description = project.short_description || schemaText(descriptionText(project.description ?? ""));
  const developer = developerRef(project.developer) ?? (project.developer_name ? { "@type": "Organization", name: project.developer_name, url: project.developer_website ?? undefined } : null);
  const lowPrice = project.hide_price ? undefined : schemaNumber(project.price_from);
  const highPrice = project.hide_price ? undefined : schemaNumber(project.price_to);
  const unitCount = (project.units ?? []).length;
  const floorPlans = (project.floor_plans ?? []).filter((plan) => plan.image_url);
  const videoUrls = [project.video_url, ...(project.media ?? []).filter((media) => media.type === "video").map((media) => media.url)].filter(
    (link, index, all): link is string => Boolean(link) && all.indexOf(link) === index,
  );

  const place: Schema = {
    "@type": type,
    "@id": schemaId.project(project.slug),
    name: project.name,
    description,
    url,
    logo: imageObject(project.logo_url, { caption: logoAlt(project.name, project.logo_alt) }),
    image: [
      ...photos.map((photo, index) => imageObject(mediumUrl(photo), { caption: galleryPhotoAlt(photo.alt_text, project.name, index, photos.length) })),
      ...(photos.length === 0 ? [imageObject(project.cover_url, { caption: project.cover_alt || project.name })] : []),
    ],
    address: postalAddress({
      street: [project.street, project.address, project.block, project.sector, project.phase, project.society?.name].filter(Boolean).join(", "),
      locality: project.city?.name,
      region: project.province,
      country: project.country && /^[a-z]{2}$/i.test(project.country) ? project.country : "PK",
    }),
    geo: geoCoordinates(project.latitude, project.longitude),
    hasMap: project.maps_url ?? undefined,
    containedInPlace: societyPlace(project.society, project.city),
    amenityFeature: (project.amenities ?? []).map((amenity) => ({ "@type": "LocationFeatureSpecification", name: amenity.name, value: true })),
    numberOfAccommodationUnits: type === "ApartmentComplex" && project.units_total ? { "@type": "QuantitativeValue", value: project.units_total } : undefined,
    accommodationFloorPlan: isResidence
      ? floorPlans.map((plan) => ({
          "@type": "FloorPlan",
          name: plan.name,
          description: plan.description ?? undefined,
          layoutImage: imageObject(plan.image_url, { caption: `${project.name} — ${plan.name} floor plan` }),
          floorSize: areaSchema(plan.area_size, plan.area_unit),
          numberOfBedrooms: plan.bedrooms ?? undefined,
          numberOfBathroomsTotal: plan.bathrooms ?? undefined,
        }))
      : undefined,
  };

  const offer: Schema | null = lowPrice
    ? {
        "@type": "AggregateOffer",
        "@id": `${url}#offer`,
        url,
        priceCurrency: project.currency || SCHEMA_CURRENCY,
        lowPrice,
        highPrice: highPrice && highPrice >= lowPrice ? highPrice : undefined,
        offerCount: unitCount || undefined,
        availability: project.construction_status === "ready" ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
        itemOffered: ref(schemaId.project(project.slug)),
        // A directory developer is described once, on the page node; the offer only points at it.
        offeredBy: project.developer ? ref(schemaId.developer(project.developer.slug)) : developer,
      }
    : null;

  const videos = videoUrls.map((link, index) =>
    videoSchema(link, {
      id: `${url}#video-${index + 1}`,
      name: videoUrls.length > 1 ? `${project.name} — video ${index + 1}` : `${project.name} — video`,
      description,
      uploadDate: project.published_at,
    }),
  );

  return [place, offer, ...videos].filter((block): block is Schema => Boolean(block));
}

/* ---------- Dealers and agents ---------- */

/** The image a profile is shared with: the admin's featured image, else the profile's own picture. */
function featuredImage(record: { og_image_url?: string | null; og_image_alt?: string | null }, fallback: string | null | undefined, caption: string): Schema | null {
  return record.og_image_url ? imageObject(record.og_image_url, { caption: record.og_image_alt || caption }) : imageObject(fallback, { caption });
}

/**
 * A dealer (agency) as a RealEstateAgent with its own logo, featured image, contact details, address and the agents
 * that have an approved public profile. Only approved dealers have a page, so only they are described.
 */
export function dealerSchema(agency: AgencyProfile): Schema {
  const path = `/dealer/${agency.slug}`;

  return {
    "@type": "RealEstateAgent",
    "@id": schemaId.dealer(agency.slug),
    name: agency.name,
    url: absoluteUrl(path),
    logo: imageObject(agency.logo_url, { caption: logoAlt(agency.name, agency.logo_alt) }),
    image: featuredImage(agency, agency.cover_url ?? agency.logo_url, altText(agency.cover_alt, agency.name)),
    description: schemaText(agency.about),
    telephone: agency.phone ?? undefined,
    email: agency.email ?? undefined,
    foundingDate: agency.established_year ? String(agency.established_year) : undefined,
    address: postalAddress({ street: agency.address, locality: agency.city?.name, country: "PK" }),
    areaServed: agency.service_areas ?? (agency.city ? { "@type": "City", name: agency.city.name } : undefined),
    sameAs: sameAsLinks([agency.website, agency.facebook, agency.instagram, agency.youtube, agency.tiktok, agency.linkedin]),
    // Agents without an approved profile are not public, so they are left out.
    employee: (agency.agents ?? [])
      .filter((agent) => agent.slug)
      .map((agent) => ({ "@type": "Person", "@id": schemaId.agent(agent.slug!), name: agent.name, jobTitle: agent.designation ?? undefined, url: absoluteUrl(agentHref(agent.slug!)) })),
  };
}

/** An agent as a Person with their own photo, contact details and expertise, working for their dealer. */
export function agentSchema(agent: PublicAgent): Schema {
  return {
    "@type": "Person",
    "@id": schemaId.agent(agent.slug),
    name: agent.name,
    url: absoluteUrl(agentHref(agent.slug)),
    image: featuredImage(agent, agent.photo_url, altText(agent.photo_alt, agent.name)),
    jobTitle: agent.designation ?? undefined,
    description: agent.short_bio ?? undefined,
    telephone: agent.phone ?? undefined,
    email: agent.email ?? undefined,
    knowsLanguage: (agent.languages ?? "").split(/[,/]/).map((language) => language.trim()),
    knowsAbout: [agent.specialisation, ...agent.areas_of_expertise],
    homeLocation: agent.city ? { "@type": "City", name: agent.city.name } : undefined,
    worksFor: dealerRef(agent.agency),
    sameAs: sameAsLinks(agentSocials(agent).map((social) => social.url)),
  };
}

/** The listings shown on a page, as an ItemList of their pages. */
export function propertyListSchema(path: string, properties: PublicProperty[], name?: string): Schema | null {
  return itemListSchema(
    path,
    properties.map((property) => ({ url: propertyHref(property), name: property.title, image: photosOf(property)[0] ? mediumUrl(photosOf(property)[0]) : null })),
    name,
  );
}

/**
 * A developer or construction company as an Organization with its logo, featured image, registration, contact
 * details and the leadership and team shown on its page.
 */
export function developerSchema(developer: PublicDeveloper): Schema {
  const people = [...(developer.leadership ?? []), ...(developer.team ?? [])];

  return {
    "@type": "Organization",
    "@id": schemaId.developer(developer.slug),
    name: developer.name,
    legalName: developer.legal_name ?? developer.registered_name ?? undefined,
    url: absoluteUrl(developerHref(developer.slug)),
    logo: imageObject(developer.logo_url, { caption: logoAlt(developer.name, developer.logo_alt) }),
    image: featuredImage(developer, developer.cover_url ?? developer.logo_url, altText(developer.cover_alt, developer.name)),
    description: developer.short_description ?? schemaText(developer.description),
    slogan: developer.tagline ?? undefined,
    telephone: developer.phone ?? undefined,
    email: developer.email ?? undefined,
    taxID: developer.ntn_number ?? undefined,
    foundingDate: developer.established_year ? String(developer.established_year) : undefined,
    address: postalAddress({ street: developer.address, locality: developer.city?.name, country: "PK" }),
    hasMap: developer.google_maps_url ?? undefined,
    sameAs: sameAsLinks([developer.website, ...developer.social_links.map((link) => link.url)]),
    employee: people.map((member) => ({
      "@type": "Person",
      name: member.name,
      jobTitle: member.designation ?? undefined,
      image: imageObject(member.photo_url, { caption: member.name }),
      sameAs: sameAsLinks([member.linkedin, member.facebook]),
    })),
  };
}

/* ---------- Authors and blog posts ---------- */

/** An article author as a Person writing for the brand. */
export function authorSchema(author: PublicAuthor): Schema {
  return {
    "@type": "Person",
    "@id": schemaId.author(author.slug),
    name: author.name,
    url: absoluteUrl(authorHref(author.slug)),
    image: featuredImage({}, author.photo_url, author.name),
    jobTitle: author.designation || undefined,
    description: author.short_bio || undefined,
    knowsAbout: [author.specialisation, ...author.areas_of_expertise],
    knowsLanguage: author.languages,
    award: author.awards,
    worksFor: brandRef(),
    sameAs: sameAsLinks(authorSocials(author).map((social) => social.url)),
  };
}

/** A blog post as a BlogPosting by its author (or the brand), published by the brand. */
export function blogPostSchema(post: BlogPost, description?: string): Schema {
  const url = absoluteUrl(postHref(post.slug));

  return {
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.title.length > 110 ? `${post.title.slice(0, 109)}…` : post.title,
    name: post.title,
    description: description || post.meta_description || post.excerpt || undefined,
    url,
    mainEntityOfPage: ref(schemaId.webPage(postHref(post.slug))),
    image: post.cover_image_url ? imageObject(post.cover_image_url, { caption: post.title }) : imageObject(post.og_image_url, { caption: post.og_image_alt || post.title }),
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at ?? post.published_at ?? undefined,
    author: post.author
      ? { "@type": "Person", "@id": schemaId.author(post.author.slug), name: post.author.name, url: absoluteUrl(authorHref(post.author.slug)), jobTitle: post.author.designation ?? undefined }
      : brandRef(),
    publisher: brandRef(),
    articleSection: post.category?.name,
    wordCount: schemaText(post.content_html)?.split(" ").length,
    inLanguage: "en",
  };
}

/* ---------- Maps, sectors and blocks ---------- */

function phaseName(name: string): string {
  return /^phase\b/i.test(name) ? name : `Phase ${name}`;
}

/** The middle of an area's mapped boundary (its bounding box), or null when it has not been drawn. */
export function boundaryCentre(boundary: GeoPolygon | null | undefined): Schema | null {
  const ring = boundary?.coordinates?.[0] ?? [];

  if (ring.length < 3) {
    return null;
  }

  const lngs = ring.map(([lng]) => lng);
  const lats = ring.map(([, lat]) => lat);

  return geoCoordinates((Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2);
}

/** "Sector G" inside "Phase 1" inside "DHA Gujranwala", from whichever of the three are known. */
function areaChain(society: { name: string } | null | undefined, phase: { name: string } | null | undefined, sector?: { name: string } | null): Schema | null {
  const societyPlace = society ? { "@type": "Place", name: society.name } : null;
  const phasePlace = phase ? { "@type": "Place", name: phaseName(phase.name), containedInPlace: societyPlace ?? undefined } : societyPlace;

  return sector ? { "@type": "Place", name: sectorName(sector.name), containedInPlace: phasePlace ?? undefined } : phasePlace;
}

/** A Plot Finder sector or block as a Place, with its position taken from the boundary drawn on the map. */
export function plotFinderPlaceSchema(entry: SectorEntry, block: MapBlock | null): Schema {
  const sectorUrl = absoluteUrl(mapsHref(entry));
  const sector: Schema = {
    "@type": "Place",
    "@id": `${sectorUrl}#place`,
    name: areaTitle(entry, null),
    url: sectorUrl,
    geo: boundaryCentre(entry.sector.boundary),
    containedInPlace: areaChain(entry.society, entry.phase),
  };

  if (!block) {
    return sector;
  }

  const blockUrl = absoluteUrl(mapsHref(entry, block));

  return {
    "@type": "Place",
    "@id": `${blockUrl}#place`,
    name: areaTitle(entry, block),
    alternateName: blockName(block.name),
    url: blockUrl,
    geo: boundaryCentre(block.boundary),
    containedInPlace: sector,
  };
}

/** A society map (master plan, sector map…) as a Map of the area it shows. */
export function societyMapSchema(map: PublicSocietyMap): Schema {
  const url = absoluteUrl(societyMapHref(map.slug));

  return {
    "@type": "Map",
    "@id": `${url}#map`,
    name: map.title,
    url,
    description: map.description_text ?? map.subtitle ?? undefined,
    image: imageObject(map.image_url, { caption: altText(map.image_alt, map.title), width: map.image_width, height: map.image_height }),
    mapType: "https://schema.org/VenueMap",
    datePublished: map.published_at ?? undefined,
    dateModified: map.updated_at ?? undefined,
    contentLocation: areaChain(map.society, map.phase, map.sector),
    publisher: brandRef(),
  };
}
