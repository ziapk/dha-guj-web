import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment, cache } from "react";
import { BannerSlot } from "@/components/banner-slot";
import { ContactCard } from "@/components/contact-card";
import {
  AreaIcon,
  ArrowRightIcon,
  BathIcon,
  KitchenIcon,
  BedIcon,
  CalendarIcon,
  ChevronRightIcon,
  DocumentIcon,
  FlameIcon,
  HashIcon,
  HomeIcon,
  LayersIcon,
  MapIcon,
  PinIcon,
  SofaIcon,
  TagIcon,
} from "@/components/icons";
import { PropertyCard } from "@/components/property-card";
import { Expandable } from "@/components/property-detail/expandable";
import { ListingActions } from "@/components/property-detail/listing-actions";
import { MobileContactBar } from "@/components/property-detail/mobile-contact-bar";
import { ListingGallery } from "@/components/listing-gallery";
import { Rail } from "@/components/rail";
import { RecordRecentlyViewed } from "@/components/recently-viewed";
import { ViewTracker } from "@/components/view-tracker";
import { AmenityGroups } from "@/components/amenity-groups";
import { altText } from "@/lib/alt-text";
import { NotFoundError, publicApi } from "@/lib/api";
import { FURNISHED_LABELS, PROPERTY_PURPOSE_LABELS, formatArea, formatCompactPrice, formatDate, formatPrice } from "@/lib/labels";
import { JsonLd } from "@/components/json-ld";
import { coverOf, descriptionText, locationOf, mediumUrl, photosOf, propertyHref, purposeTagOf, thumbnailUrl, videoEmbedUrl } from "@/lib/property";
import { adminShareImage, notFoundMetadata, pageMetadata } from "@/lib/seo";
import { getListingPageSettings } from "@/lib/site-data";
import { siteUrl } from "@/lib/site";
import type { Collection, PropertySeo, PublicProperty, Resource } from "@/types/api";

/**
 * Listing pages live at /property/{slug}-{ref}; the random ref at the end is permanent. An admin can drop the ref,
 * leaving /property/{slug}, so the whole segment goes to the API, which tells the two apart. The proxy has already
 * redirected old /property/{id}/{slug} and /properties/{slug} links and outdated slugs, and answered 410 / 301
 * for deleted listings.
 */
const getProperty = cache(async (listing: string): Promise<PublicProperty | null> => {
  const key = decodeURIComponent(listing);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key) || /^\d+$/.test(key)) {
    return null;
  }

  try {
    const response = await publicApi<Resource<PublicProperty>>(`properties/${key}`, { revalidate: 60 });

    return response.data;
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null;
    }

    throw error;
  }
});

/** What the API decided for the page; older API responses without it fall back to an indexable page. */
function seoOf(property: PublicProperty): PropertySeo {
  return (
    property.seo ?? {
      title: property.title,
      description: descriptionText(property.description).slice(0, 160),
      path: propertyHref(property),
      canonical_url: `${siteUrl()}${propertyHref(property)}`,
      index: true,
      follow: true,
      sitemap: true,
      notice: null,
    }
  );
}

const NOTICES: Record<NonNullable<PropertySeo["notice"]>, { badge: string; title: string; text: string }> = {
  sold: { badge: "Sold", title: "This property has been sold", text: "It is no longer available. Have a look at similar properties that are still on the market below." },
  rented: { badge: "Rented", title: "This property has been rented out", text: "It is no longer available. Have a look at similar properties that are still available below." },
  expired: { badge: "Listing expired", title: "This listing has expired", text: "The owner has not renewed it, so it may no longer be available. See similar properties that are still on the market below." },
};

/** schema.org availability for the Offer, from the property and listing status. */
function availabilityOf(property: PublicProperty, notice: PropertySeo["notice"]): string {
  if (notice === "sold" || notice === "rented") {
    return "https://schema.org/SoldOut";
  }

  if (notice === "expired") {
    return "https://schema.org/Discontinued";
  }

  return property.property_status === "under_offer" ? "https://schema.org/LimitedAvailability" : "https://schema.org/InStock";
}

export async function generateMetadata({ params }: PageProps<"/property/[listing]">): Promise<Metadata> {
  const { listing } = await params;
  const property = await getProperty(listing);

  if (!property) {
    return notFoundMetadata("Listing not found");
  }

  const cover = coverOf(property);
  const seo = seoOf(property);

  return pageMetadata({
    title: seo.title,
    description: seo.description,
    path: seo.path,
    // The listing's featured image: an admin's share image, else its cover photo.
    images: [adminShareImage(property.seo), cover && { url: mediumUrl(cover), alt: altText(cover.alt_text, property.title) }],
    imageAlt: property.title,
    robots: seo.index && seo.follow ? undefined : { index: seo.index, follow: seo.follow },
  });
}

export default async function PropertyPage({ params }: PageProps<"/property/[listing]">) {
  const { listing } = await params;
  const property = await getProperty(listing);

  if (!property) {
    notFound();
  }

  const seo = seoOf(property);
  const notice = seo.notice ? NOTICES[seo.notice] : null;
  const [similar, pageSettings] = await Promise.all([
    publicApi<Collection<PublicProperty>>(`properties/${property.id}/similar`, { revalidate: 300 })
      .then((response) => response.data)
      .catch(() => []),
    getListingPageSettings(),
  ]);

  const photos = photosOf(property);
  const videos = (property.media ?? []).filter((media) => media.type === "video");
  const isPlot = property.property_type?.category === "plot";
  /** The "Location" amenity group (near a mosque, school, park…) gets its own section above the rest. */
  const amenities = property.amenities ?? [];
  const isNearby = (amenity: (typeof amenities)[number]) => /location|nearby/.test(amenity.group?.slug ?? "");
  const nearby = amenities.filter(isNearby);
  const features = amenities.filter((amenity) => !isNearby(amenity));

  const location = [property.block, property.sector, property.phase, locationOf(property)].filter(Boolean).join(", ");
  const fullAddress = [property.address, property.society?.name, property.city?.name].filter(Boolean).join(", ");

  /** The four big tiles under the title; plots have no rooms, so they show purpose and sector instead. */
  const stats = [
    ...(isPlot
      ? [
          { label: "Purpose", value: PROPERTY_PURPOSE_LABELS[property.purpose], icon: <DocumentIcon /> },
          { label: "Sector", value: property.sector, icon: <MapIcon /> },
        ]
      : [
          { label: "Bedrooms", value: property.bedrooms, icon: <BedIcon /> },
          { label: "Bathrooms", value: property.bathrooms, icon: <BathIcon /> },
        ]),
    { label: "Property Type", value: property.property_type?.name, icon: <HomeIcon /> },
    { label: "Property Area", value: formatArea(property.area_size, property.area_unit), icon: <AreaIcon /> },
  ].filter((stat) => stat.value !== null && stat.value !== undefined && stat.value !== "");

  const facts = [
    { label: "Type", value: property.property_type?.name, icon: <HomeIcon /> },
    { label: "Price", value: formatCompactPrice(property.price), icon: <TagIcon /> },
    { label: "Area", value: formatArea(property.area_size, property.area_unit), icon: <AreaIcon /> },
    { label: "Bedrooms", value: isPlot ? null : property.bedrooms, icon: <BedIcon /> },
    { label: "Bathrooms", value: isPlot ? null : property.bathrooms, icon: <BathIcon /> },
    { label: "Kitchens", value: isPlot ? null : property.kitchens, icon: <KitchenIcon /> },
    { label: "Floors", value: isPlot ? null : property.floors, icon: <LayersIcon /> },
    { label: "Furnishing", value: property.furnished ? FURNISHED_LABELS[property.furnished] : null, icon: <SofaIcon /> },
    { label: "Year built", value: property.year_built, icon: <CalendarIcon /> },
    { label: "Purpose", value: PROPERTY_PURPOSE_LABELS[property.purpose], icon: <DocumentIcon /> },
    { label: "Phase", value: property.phase, icon: <MapIcon /> },
    { label: "Sector", value: property.sector, icon: <MapIcon /> },
    { label: "Block", value: property.block, icon: <MapIcon /> },
    { label: "Location", value: fullAddress, icon: <PinIcon /> },
    { label: "Posted", value: property.published_at ? formatDate(property.published_at) : null, icon: <CalendarIcon /> },
    { label: "Listing ID", value: `#${property.id}`, icon: <HashIcon /> },
  ].filter((fact) => fact.value !== null && fact.value !== undefined && fact.value !== "");
  const factColumns = [facts.slice(0, Math.ceil(facts.length / 2)), facts.slice(Math.ceil(facts.length / 2))];

  /** A featured listing from the similar ones goes in the sidebar; the rest fill the related rail. */
  const spotlight = notice ? null : (similar.find((item) => item.is_featured) ?? null);
  const related = similar.filter((item) => item !== spotlight);
  const spotlightCover = spotlight ? coverOf(spotlight) : null;
  const [currency, ...priceWords] = formatCompactPrice(property.price).split(" ");
  const browseHref = `/properties?purpose=${property.purpose}${property.city ? `&city_id=${property.city.id}` : ""}`;

  const listingUrl = seo.canonical_url;
  /** Breadcrumb steps chosen in Site Settings → Listing page; each one narrows the search of the step before it. */
  const crumbFilters = new URLSearchParams({ purpose: property.purpose });
  const searchCrumb = (name: string, key: string, value: number) => {
    crumbFilters.set(key, String(value));

    return { name, path: `/properties?${crumbFilters.toString()}` };
  };
  const trail = [
    pageSettings.breadcrumb_show_purpose && {
      name: property.purpose === "rent" ? pageSettings.breadcrumb_rent_label : pageSettings.breadcrumb_sale_label,
      path: `/properties?purpose=${property.purpose}`,
    },
    pageSettings.breadcrumb_show_property_type && property.property_type && searchCrumb(property.property_type.name, "property_type_id", property.property_type.id),
    pageSettings.breadcrumb_show_city && property.city && searchCrumb(property.city.name, "city_id", property.city.id),
    pageSettings.breadcrumb_show_society && property.society && searchCrumb(property.society.name, "society_id", property.society.id),
  ].filter((crumb) => !!crumb);
  const breadcrumbs = [{ name: pageSettings.breadcrumb_home_label, path: "/" }, ...trail];
  const currentCrumb = { name: property.title, path: seo.path };
  /** Search engines always get the listing as the last step, even when the visible trail leaves the title out. */
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [...breadcrumbs, currentCrumb].map((crumb, index) => ({ "@type": "ListItem", position: index + 1, name: crumb.name, item: `${siteUrl()}${crumb.path}` })),
  };
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: descriptionText(property.description),
    url: listingUrl,
    datePosted: property.published_at ?? undefined,
    dateModified: property.refreshed_at ?? undefined,
    image: photos.map((photo) => mediumUrl(photo)),
    offers: {
      "@type": "Offer",
      url: listingUrl,
      price: Number(property.price),
      priceCurrency: "PKR",
      availability: availabilityOf(property, seo.notice),
      businessFunction: property.purpose === "rent" ? "http://purl.org/goodrelations/v1#LeaseOut" : "http://purl.org/goodrelations/v1#Sell",
      ...(property.purpose === "rent" ? { priceSpecification: { "@type": "UnitPriceSpecification", price: Number(property.price), priceCurrency: "PKR", unitCode: "MON" } } : {}),
      ...(property.contact?.agency ? { offeredBy: { "@type": "RealEstateAgent", name: property.contact.agency.name, url: `${siteUrl()}/dealer/${property.contact.agency.slug}` } } : {}),
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: [property.address, property.block, property.sector, property.phase, property.society?.name].filter(Boolean).join(", ") || undefined,
      addressLocality: property.city?.name,
      addressCountry: "PK",
    },
    ...(property.property_type ? { category: property.property_type.name } : {}),
  };

  return (
    <div className="container page-section pd-page">
      <JsonLd data={pageSettings.breadcrumb_enabled ? [structuredData, breadcrumbData] : [structuredData]} />
      <ViewTracker slug={String(property.id)} />
      <RecordRecentlyViewed propertyId={property.id} />

      {pageSettings.breadcrumb_enabled && (
        <nav className="breadcrumbs pd-breadcrumbs" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => (
            <Fragment key={crumb.path}>
              {index > 0 && <ChevronRightIcon />}
              <Link href={crumb.path}>{crumb.name}</Link>
            </Fragment>
          ))}
          {pageSettings.breadcrumb_show_title && (
            <>
              <ChevronRightIcon />
              <span aria-current="page">{property.title}</span>
            </>
          )}
        </nav>
      )}

      {notice && (
        <div className={`listing-notice listing-notice-${seo.notice}`} role="status">
          <span className="listing-notice-badge">{notice.badge}</span>
          <div>
            <strong>{notice.title}</strong>
            <p>{notice.text}</p>
          </div>
          {similar.length > 0 && (
            <a href="#similar" className="btn btn-outline">
              See similar
            </a>
          )}
        </div>
      )}

      <ListingGallery photos={photos} title={property.title} />

      <div className="detail-layout pd-layout">
        <div className="pd-main">
          <div className="pd-head">
            <div className="pd-head-top">
              <div className={`pd-price${notice ? " is-closed" : ""}`}>
                <small>{currency}</small> {priceWords.join(" ")}
                {property.purpose === "rent" && <span> / month</span>}
                {property.is_negotiable && <span className="pd-negotiable">Negotiable</span>}
              </div>
              <ListingActions propertyId={property.id} title={property.title} />
            </div>
            <h1>{property.title}</h1>
            {location && (
              <p className="pd-location">
                <PinIcon /> {location}
              </p>
            )}
            <div className="detail-badges pd-badges">
              {property.is_hot && (
                <span className="badge badge-hot">
                  <FlameIcon /> Hot
                </span>
              )}
              {property.is_premium && <span className="badge badge-premium">Premium</span>}
              {property.is_featured && <span className="badge badge-featured">Featured</span>}
              {property.is_urgent && !notice && <span className="badge badge-urgent">Urgent</span>}
              {property.property_status === "under_offer" && !notice && <span className="badge badge-outline">Under offer</span>}
              <span className={`badge badge-purpose badge-${purposeTagOf(property).tone}`}>{purposeTagOf(property).label}</span>
              {property.installment_available && <span className="tag">Installments available</span>}
            </div>
          </div>

          {stats.length > 0 && (
            <ul className="pd-stats">
              {stats.map((stat) => (
                <li key={stat.label}>
                  <span className="pd-stat-label">{stat.label}</span>
                  <span className="pd-stat-value">
                    {stat.icon}
                    <strong>{stat.value}</strong>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <section className="pd-section">
            <h2>About This Property</h2>
            <div className="pd-facts">
              {factColumns.map((column, index) => (
                <dl key={index}>
                  {column.map((fact) => (
                    <div key={fact.label}>
                      <dt>
                        {fact.icon}
                        {fact.label}
                      </dt>
                      <dd>{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              ))}
            </div>
          </section>

          <section className="pd-section">
            <h2>Property Description</h2>
            <Expandable collapsedHeight={170}>
              {/* HTML from the listing editor, sanitised by the API when it was saved. */}
              <div className="detail-description pd-description is-html" dangerouslySetInnerHTML={{ __html: property.description }} />
            </Expandable>
          </section>

          {property.installment_available && (
            <section className="pd-section">
              <h2>Installment Plan</h2>
              <ul className="pd-stats pd-stats-plain">
                <li>
                  <span className="pd-stat-label">Advance</span>
                  <strong>{formatPrice(property.advance_amount)}</strong>
                </li>
                <li>
                  <span className="pd-stat-label">Monthly</span>
                  <strong>{formatPrice(property.monthly_installment)}</strong>
                </li>
                <li>
                  <span className="pd-stat-label">Installments</span>
                  <strong>{property.installments_count ?? "—"}</strong>
                </li>
              </ul>
            </section>
          )}

          {nearby.length > 0 && (
            <section className="pd-section pd-amenities pd-nearby">
              <h2>Nearby Locations</h2>
              <AmenityGroups amenities={nearby.map((amenity) => ({ ...amenity, group: null }))} />
            </section>
          )}

          {features.length > 0 && (
            <section className="pd-section pd-amenities pd-features">
              <h2>Features &amp; Amenities</h2>
              <Expandable collapsedHeight={330}>
                <AmenityGroups amenities={features} />
              </Expandable>
            </section>
          )}

          {videos.length > 0 && (
            <section className="pd-section">
              <h2>Property Video</h2>
              {videos.map((video) => {
                const embed = videoEmbedUrl(video.url);

                return embed ? (
                  <div key={video.id} className={`pd-video${/\/shorts\//.test(video.url) ? " is-vertical" : ""}`}>
                    <iframe
                      src={embed}
                      title={`${property.title} — video`}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <p key={video.id} style={{ margin: "0 0 8px" }}>
                    <a href={video.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
                      ▶ Watch video
                    </a>
                  </p>
                );
              })}
            </section>
          )}
        </div>

        <aside className="detail-sidebar pd-sidebar">
          {notice ? (
            <div className="contact-card listing-closed-card">
              <strong>{notice.badge}</strong>
              <p>The owner is no longer taking inquiries for this listing.</p>
              <Link href={browseHref} className="btn btn-primary">
                Browse available properties
              </Link>
            </div>
          ) : (
            <ContactCard property={property} />
          )}

          {spotlight && (
            <Link href={propertyHref(spotlight)} className="pd-spotlight">
              <div className="pd-spotlight-cover">
                {spotlightCover ? (
                  <Image src={thumbnailUrl(spotlightCover)} alt="" fill sizes="(max-width: 991px) 100vw, 360px" style={{ objectFit: "cover" }} />
                ) : (
                  <HomeIcon className="placeholder-icon" />
                )}
                <span className="badge badge-featured">Featured</span>
              </div>
              <div className="pd-spotlight-body">
                <strong>{spotlight.title}</strong>
                <span className="pd-spotlight-location">
                  <PinIcon /> {[spotlight.sector, locationOf(spotlight)].filter(Boolean).join(", ")}
                </span>
                <span className="pd-spotlight-foot">
                  <b>{formatCompactPrice(spotlight.price)}</b>
                  <small>{formatArea(spotlight.area_size, spotlight.area_unit)}</small>
                </span>
              </div>
            </Link>
          )}

          <BannerSlot key={property.id} placement="listing_sidebar" />
        </aside>
      </div>

      {related.length > 0 && (
        <section className="section pd-related" id="similar">
          <div className="section-head">
            <div>
              <h2>{notice ? "Similar Available Properties" : "Related Properties"}</h2>
              <p>
                {notice ? "Still on the market" : "Explore similar properties you might also like"}
                {property.city ? ` in ${property.city.name}` : ""}
              </p>
            </div>
            <Link href={browseHref} className="pd-view-all">
              View All <ArrowRightIcon />
            </Link>
          </div>
          <Rail label="Related properties">
            {related.map((item) => (
              <PropertyCard key={item.id} property={item} />
            ))}
          </Rail>
        </section>
      )}

      {!notice && <MobileContactBar property={property} />}
    </div>
  );
}
