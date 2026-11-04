import dayjs from "dayjs";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { ArrowRightIcon, DownloadIcon, MapIcon, ShieldCheckIcon } from "@/components/icons";
import { PropertyCard } from "@/components/property-card";
import { MapViewer } from "@/components/society-maps/map-viewer";
import { altText } from "@/lib/alt-text";
import { PLOT_RATES_PATH, ratesAnchor } from "@/lib/sector-guides";
import { societyMapHref } from "@/lib/society-maps";
import type { PublicProperty, BlockGuide, SectorGuideDetail } from "@/types/api";

type Props = {
  guide: SectorGuideDetail | BlockGuide;
  /** The trail after Home, ending with this page. */
  trail: { name: string; path: string }[];
  heading: string;
  /** The area whose section the plot rates link opens: a block's prices are listed under its sector. */
  ratesTitle: string;
  facts: { label: string; value: ReactNode }[];
  listings: PublicProperty[];
  listingsHref: string;
  plotFinderHref: string | null;
  /** The blocks of a sector, or the links around a block. */
  children: ReactNode;
};

function RichSection({ heading, html, children }: { heading: string; html: string | null; children?: ReactNode }) {
  if (!html) {
    return null;
  }

  return (
    <section className="detail-section">
      <h2>{heading}</h2>
      {children}
      {/* Sanitised by the API before it is stored. */}
      <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}

/** The page of a sector or block guide. All of it is rendered on the server, so crawlers read every section and link. */
export function AreaGuidePage({ guide, trail, heading, ratesTitle, facts, listings, listingsHref, plotFinderHref, children }: Props) {
  const ratesHref = `${PLOT_RATES_PATH}#${ratesAnchor(ratesTitle)}`;

  return (
    <div className="container page-section sg-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        {trail.map((crumb, index) => (
          <Fragment key={crumb.path}>
            <span aria-hidden="true">/</span>
            {index === trail.length - 1 ? <span aria-current="page">{crumb.name}</span> : <Link href={crumb.path}>{crumb.name}</Link>}
          </Fragment>
        ))}
      </nav>

      <header className="cms-header">
        <h1>{heading}</h1>
        <p>{guide.summary}</p>
      </header>

      <div className="sg-layout">
        <div className="sg-main">
          <RichSection heading={`${guide.title} overview`} html={guide.overview} />

          {guide.map && (
            <section className="detail-section" aria-labelledby="area-map">
              <h2 id="area-map">{guide.title} map</h2>
              <MapViewer src={guide.map.image_url} alt={altText(guide.map.image_alt, guide.map.title)} />
              <p className="sg-map-links">
                <Link href={societyMapHref(guide.map.slug)}>
                  <DownloadIcon className="icon" /> View and download {guide.map.title}
                </Link>
                {plotFinderHref && (
                  <Link href={plotFinderHref}>
                    <MapIcon className="icon" /> Open in Plot Finder
                  </Link>
                )}
              </p>
            </section>
          )}

          {children}

          <RichSection heading={`Where ${guide.title} is`} html={guide.location_details} />
          <RichSection heading={`Roads and facilities in ${guide.title}`} html={guide.roads_facilities} />
          <RichSection heading={`${guide.title} development status`} html={guide.development_info}>
            <p className="sg-verified">
              <ShieldCheckIcon className="icon" /> Verified on {dayjs(guide.verified_on).format("MMMM D, YYYY")}. Source: {guide.verified_source}.
            </p>
          </RichSection>
        </div>

        <aside className="aside-card sg-aside">
          <h2>At a glance</h2>
          <dl className="smap-details">
            {facts.map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
          <Link className="btn btn-primary btn-block" href={ratesHref}>
            {ratesTitle} plot rates
          </Link>
        </aside>
      </div>

      <section className="detail-section" aria-labelledby="area-listings">
        <div className="sg-section-head">
          <h2 id="area-listings">Available properties in {guide.title}</h2>
          {listings.length > 0 && (
            <Link className="sg-card-more" href={listingsHref}>
              View all <ArrowRightIcon className="icon" />
            </Link>
          )}
        </div>
        {listings.length > 0 ? (
          <div className="property-grid">
            {listings.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <p>
            No properties are listed in {guide.title} right now. <Link href="/properties-for-sale">Browse all DHA Gujranwala properties for sale</Link>.
          </p>
        )}
      </section>

      <section className="detail-section sg-rates">
        <h2>{ratesTitle} plot rates</h2>
        <p>
          Prices are kept on one page, updated separately from this guide. Compare current prices by plot size on the <Link href={ratesHref}>DHA Gujranwala plot rates</Link> page.
        </p>
      </section>
    </div>
  );
}
