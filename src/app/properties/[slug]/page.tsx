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
import { coverOf, locationOf, mediumUrl, photosOf } from "@/lib/property";
import { jsonLd, metaText, openGraph } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import type { Collection, PublicProperty, Resource } from "@/types/api";

const getProperty = cache(async (slug: string): Promise<PublicProperty | null> => {
  try {
    const response = await publicApi<Resource<PublicProperty>>(`properties/${encodeURIComponent(slug)}`, { revalidate: 60 });

    return response.data;
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null;
    }

    throw error;
  }
});

export async function generateMetadata({ params }: PageProps<"/properties/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const property = await getProperty(slug);

  if (!property) {
    return { title: "Listing not found" };
  }

  const cover = coverOf(property);
  const location = [property.block, property.sector, property.phase, locationOf(property)].filter(Boolean).join(", ");
  const purpose = property.purpose === "rent" ? "for rent" : "for sale";
  const price = `${formatCompactPrice(property.price)}${property.purpose === "rent" ? " / month" : ""}`;
  const description = metaText(`${property.property_type?.name ?? "Property"} ${purpose}: ${price} · ${formatArea(property.area_size, property.area_unit)}${location ? ` · ${location}` : ""}. ${property.description}`);
  const url = `/properties/${property.slug}`;

  return {
    title: property.title,
    description,
    alternates: { canonical: url },
    openGraph: await openGraph({
      title: property.title,
      description,
      url,
      images: cover ? [{ url: mediumUrl(cover), alt: property.title }] : undefined,
    }),
    twitter: { card: cover ? "summary_large_image" : "summary", title: property.title, description, images: cover ? [mediumUrl(cover)] : undefined },
  };
}

export default async function PropertyPage({ params }: PageProps<"/properties/[slug]">) {
  const { slug } = await params;
  const property = await getProperty(slug);

  if (!property) {
    notFound();
  }

  const similar = await publicApi<Collection<PublicProperty>>(`properties/${encodeURIComponent(slug)}/similar`, { revalidate: 300 })
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

  const listingUrl = `${siteUrl()}/properties/${property.slug}`;
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
      availability: "https://schema.org/InStock",
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <ViewTracker slug={property.slug} />
      <RecordRecentlyViewed propertyId={property.id} />

      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href={`/properties?purpose=${property.purpose}`}>{property.purpose === "rent" ? "Rent" : "Buy"}</Link>
        {property.city && (
          <>
            <span>/</span>
            <Link href={`/properties?purpose=${property.purpose}&city_id=${property.city.id}`}>{property.city.name}</Link>
          </>
        )}
      </nav>

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
              {property.is_featured && <span className="badge badge-featured">Featured</span>}
              <span className="badge badge-outline">{PROPERTY_PURPOSE_LABELS[property.purpose]}</span>
              {property.installment_available && <span className="tag">Installments available</span>}
            </div>
            <div className="detail-price">
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
              <h2>Amenities</h2>
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
          <ContactCard property={property} />
          <div className="contact-card">
            <InquiryForm slug={property.slug} title={property.title} />
          </div>
          <div className="fact" style={{ textAlign: "center" }}>
            <span>Listing ID</span>
            <strong>#{property.id}</strong>
          </div>
          <BannerSlot key={property.slug} placement="listing_sidebar" />
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="section" style={{ paddingBottom: 0 }}>
          <div className="section-head">
            <div>
              <h2>Similar properties</h2>
              <p>More listings like this in {property.city?.name}</p>
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
