import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { BannerSlot } from "@/components/banner-slot";
import { CompareButton } from "@/components/compare-button";
import { ContactCard } from "@/components/contact-card";
import { FavoriteButton } from "@/components/favorite-button";
import { AreaIcon, BathIcon, BedIcon, FlameIcon, HomeIcon, PinIcon } from "@/components/icons";
import { InquiryForm } from "@/components/inquiry-form";
import { PropertyCard } from "@/components/property-card";
import { PropertyGallery } from "@/components/property-gallery";
import { RecordRecentlyViewed } from "@/components/recently-viewed";
import { ViewTracker } from "@/components/view-tracker";
import { AmenityGroups } from "@/components/amenity-groups";
import { NotFoundError, publicApi } from "@/lib/api";
import { FURNISHED_LABELS, PROPERTY_PURPOSE_LABELS, formatArea, formatCompactPrice, formatDate, formatPrice } from "@/lib/labels";
import { JsonLd } from "@/components/json-ld";
import { coverOf, locationOf, mediumUrl, photosOf, propertyHref } from "@/lib/property";
import { openGraph, robots } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import type { Collection, PropertySeo, PublicProperty, Resource } from "@/types/api";

/**
 * Listing pages live at /property/{id}/{slug}; the id is permanent. The proxy has already redirected old
 * /properties/{slug} links and outdated slugs, and answered 410 / 301 for deleted listings.
 */
const getProperty = cache(async (id: string): Promise<PublicProperty | null> => {
  if (!/^\d+$/.test(id)) {
    return null;
  }

  try {
    const response = await publicApi<Resource<PublicProperty>>(`properties/${id}`, { revalidate: 60 });

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
      description: property.description.slice(0, 160),
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

export async function generateMetadata({ params }: PageProps<"/property/[id]/[slug]">): Promise<Metadata> {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    return { title: "Listing not found" };
  }

  const cover = coverOf(property);
  const seo = seoOf(property);
  const { description } = seo;
  const url = seo.path;

  return {
    title: seo.title,
    description,
    alternates: { canonical: url },
    robots: robots({ index: seo.index, follow: seo.follow }),
    openGraph: await openGraph({
      title: seo.title,
      description,
      url,
      images: cover ? [{ url: mediumUrl(cover), alt: property.title }] : undefined,
    }),
    twitter: { card: cover ? "summary_large_image" : "summary", title: seo.title, description, images: cover ? [mediumUrl(cover)] : undefined },
  };
}

export default async function PropertyPage({ params }: PageProps<"/property/[id]/[slug]">) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    notFound();
  }

  const seo = seoOf(property);
  const notice = seo.notice ? NOTICES[seo.notice] : null;
  const similar = await publicApi<Collection<PublicProperty>>(`properties/${property.id}/similar`, { revalidate: 300 })
    .then((response) => response.data)
    .catch(() => []);

  const photos = photosOf(property);
  const videos = (property.media ?? []).filter((media) => media.type === "video");
  const isPlot = property.property_type?.category === "plot";

  const facts = [
    { label: "Type", value: property.property_type?.name },
    { label: "Sector", value: property.sector },
    { label: "Block", value: property.block },
    { label: "Phase", value: property.phase },
    { label: "Area", value: formatArea(property.area_size, property.area_unit) },
    { label: "Bedrooms", value: isPlot ? null : property.bedrooms },
    { label: "Bathrooms", value: isPlot ? null : property.bathrooms },
    { label: "Floors", value: isPlot ? null : property.floors },
    { label: "Year built", value: property.year_built },
    { label: "Furnishing", value: property.furnished ? FURNISHED_LABELS[property.furnished] : null },
    { label: "Posted", value: formatDate(property.published_at) },
  ].filter((fact) => fact.value !== null && fact.value !== undefined && fact.value !== "");

  const listingUrl = seo.canonical_url;
  const buyOrRent = property.purpose === "rent" ? "Rent" : "Buy";
  const breadcrumbs = [
    { name: "Home", path: "/" },
    { name: buyOrRent, path: `/properties?purpose=${property.purpose}` },
    ...(property.city ? [{ name: property.city.name, path: `/properties?purpose=${property.purpose}&city_id=${property.city.id}` }] : []),
    { name: property.title, path: seo.path },
  ];
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, name: crumb.name, item: `${siteUrl()}${crumb.path}` })),
  };
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description,
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
      ...(property.contact?.agency ? { offeredBy: { "@type": "RealEstateAgent", name: property.contact.agency.name, url: `${siteUrl()}/agencies/${property.contact.agency.slug}` } } : {}),
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
    <div className="container page-section">
      <JsonLd data={[structuredData, breadcrumbData]} />
      <ViewTracker slug={String(property.id)} />
      <RecordRecentlyViewed propertyId={property.id} />

      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href={`/properties?purpose=${property.purpose}`}>{buyOrRent}</Link>
        {property.city && (
          <>
            <span>/</span>
            <Link href={`/properties?purpose=${property.purpose}&city_id=${property.city.id}`}>{property.city.name}</Link>
          </>
        )}
      </nav>

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

      <PropertyGallery photos={photos} title={property.title} />

      <div className="detail-layout">
        <div>
          <div className="detail-title-row">
            <div className="detail-badges">
              {property.is_hot && (
                <span className="badge badge-hot">
                  <FlameIcon /> Hot
                </span>
              )}
              {property.is_premium && <span className="badge badge-premium">Premium</span>}
              {property.is_featured && <span className="badge badge-featured">Featured</span>}
              {property.is_urgent && !notice && <span className="badge badge-urgent">Urgent</span>}
              {property.property_status === "under_offer" && !notice && <span className="badge badge-outline">Under offer</span>}
              <span className="badge badge-outline">{PROPERTY_PURPOSE_LABELS[property.purpose]}</span>
              {property.installment_available && <span className="tag">Installments available</span>}
            </div>
            <div className={`detail-price${notice ? " is-closed" : ""}`}>
              {formatCompactPrice(property.price)}
              <small>
                {property.purpose === "rent" ? " / month" : ""}
                {property.is_negotiable ? " · negotiable" : ""}
              </small>
            </div>
            <h1>{property.title}</h1>
            <p className="detail-location">
              <PinIcon /> {[property.block, property.sector, property.phase, locationOf(property)].filter(Boolean).join(", ")}
            </p>
            <ul className="detail-highlights">
              {property.property_type && (
                <li>
                  <HomeIcon /> {property.property_type.name}
                </li>
              )}
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
          </div>

          <section className="detail-section">
            <h2>Property details</h2>
            <dl className="detail-list">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="detail-section">
            <h2>About this property</h2>
            <p className="detail-description">{property.description}</p>
          </section>

          {property.installment_available && (
            <section className="detail-section">
              <h2>Installment plan</h2>
              <div className="fact-grid" style={{ marginBottom: 0 }}>
                <div className="fact">
                  <span>Advance</span>
                  <strong>{formatPrice(property.advance_amount)}</strong>
                </div>
                <div className="fact">
                  <span>Monthly</span>
                  <strong>{formatPrice(property.monthly_installment)}</strong>
                </div>
                <div className="fact">
                  <span>Installments</span>
                  <strong>{property.installments_count ?? "—"}</strong>
                </div>
              </div>
            </section>
          )}

          {(property.amenities ?? []).length > 0 && (
            <section className="detail-section">
              <h2>Main features</h2>
              <AmenityGroups amenities={property.amenities ?? []} />
            </section>
          )}

          {videos.length > 0 && (
            <section className="detail-section">
              <h2>Video tour</h2>
              {videos.map((video) => (
                <p key={video.id} style={{ margin: "0 0 8px" }}>
                  <a href={video.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
                    ▶ Watch video
                  </a>
                </p>
              ))}
            </section>
          )}

          <section className="detail-section">
            <h2>Location</h2>
            <p style={{ margin: 0 }}>{[property.address, property.block, property.sector, property.phase, property.society?.name, property.city?.name].filter(Boolean).join(", ")}</p>
          </section>
        </div>

        <aside className="detail-sidebar">
          <div className="detail-sidebar-actions">
            <FavoriteButton propertyId={property.id} variant="button" />
            <CompareButton propertyId={property.id} variant="button" />
          </div>
          {notice ? (
            <div className="contact-card listing-closed-card">
              <strong>{notice.badge}</strong>
              <p>The owner is no longer taking inquiries for this listing.</p>
              <Link href={`/properties?purpose=${property.purpose}&city_id=${property.city?.id ?? ""}`} className="btn btn-primary">
                Browse available properties
              </Link>
            </div>
          ) : (
            <>
              <ContactCard property={property} />
              <div className="contact-card">
                <InquiryForm slug={String(property.id)} title={property.title} />
              </div>
            </>
          )}
          <div className="fact" style={{ textAlign: "center" }}>
            <span>Listing ID</span>
            <strong>#{property.id}</strong>
          </div>
          <BannerSlot key={property.id} placement="listing_sidebar" />
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="section" id="similar" style={{ paddingBottom: 0 }}>
          <div className="section-head">
            <div>
              <h2>{notice ? "Similar available properties" : "Similar properties"}</h2>
              <p>{notice ? "Still on the market" : "More listings like this"} in {property.city?.name}</p>
            </div>
            <Link href={`/properties?purpose=${property.purpose}&city_id=${property.city?.id ?? ""}`}>View all →</Link>
          </div>
          <div className="property-grid">
            {similar.map((item) => (
              <PropertyCard key={item.id} property={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
