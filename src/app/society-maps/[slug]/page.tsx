import dayjs from "dayjs";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DownloadIcon, MapIcon, PinIcon } from "@/components/icons";
import { ShareLinks } from "@/components/share-links";
import { MapViewer } from "@/components/society-maps/map-viewer";
import { SocietyMapCard } from "@/components/society-maps/society-map-card";
import { fileSizeLabel, getSocietyMap, societyMapHref, societyMapLocation } from "@/lib/society-maps";
import { jsonLd, metaText, openGraph } from "@/lib/seo";
import { siteUrl } from "@/lib/site";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/society-maps/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await getSocietyMap(slug);

  if (!result) {
    return { title: "Map not found", robots: { index: false } };
  }

  const map = result.data;
  const title = map.meta_title ?? map.title;
  const description = metaText(map.meta_description ?? map.description ?? `${map.title}: view in full size, zoom in and download.`);
  const url = societyMapHref(map.slug);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: await openGraph({ title, description, url, images: [{ url: map.image_url }] }),
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SocietyMapPage({ params }: PageProps<"/society-maps/[slug]">) {
  const { slug } = await params;
  const result = await getSocietyMap(slug);

  if (!result) {
    notFound();
  }

  const map = result.data;
  const url = `${siteUrl()}${societyMapHref(map.slug)}`;
  const location = societyMapLocation(map);
  const size = fileSizeLabel(map.download_size);
  const updated = map.updated_at ?? map.published_at;

  const details = [
    { label: "Category", value: map.category_label },
    { label: "Society", value: map.society?.name },
    { label: "Phase", value: map.phase ? `Phase ${map.phase.name}` : null },
    { label: "Sector", value: map.sector ? `Sector ${map.sector.name}` : null },
    { label: "File", value: [map.download_type.toUpperCase(), size].filter(Boolean).join(" · ") },
    { label: "Last updated", value: updated ? dayjs(updated).format("MMMM D, YYYY") : null },
  ].filter((item) => item.value);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Map",
    name: map.title,
    url,
    image: map.image_url,
    description: map.description ?? undefined,
    dateModified: updated ?? undefined,
    contentLocation: location ? { "@type": "Place", name: location } : undefined,
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl() },
      { "@type": "ListItem", position: 2, name: "Society Maps", item: `${siteUrl()}/society-maps` },
      { "@type": "ListItem", position: 3, name: map.title, item: url },
    ],
  };

  return (
    <div className="smap-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />

      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">›</span>
          <Link href="/society-maps">Society Maps</Link>
          <span aria-hidden="true">›</span>
          <span aria-current="page">{map.title}</span>
        </nav>

        <header className="smap-head">
          <div>
            <span className="smap-tag is-inline">
              <MapIcon className="icon" /> {map.category_label}
            </span>
            <h1>{map.title}</h1>
            {location && (
              <p className="smap-card-location">
                <PinIcon className="icon" /> {location}
              </p>
            )}
          </div>
          <div className="smap-head-actions">
            <a className="btn btn-primary" href={map.download_url} download={map.download_name} target="_blank" rel="noopener noreferrer">
              <DownloadIcon className="icon" /> Download {map.download_type.toUpperCase()}
              {size ? ` · ${size}` : ""}
            </a>
            <Link className="btn btn-outline" href="/maps">
              <MapIcon className="icon" /> Plot Finder
            </Link>
          </div>
        </header>

        <MapViewer src={map.image_url} alt={map.title} />

        <div className="smap-info">
          <section>
            <h2>About this map</h2>
            {map.description ? <p className="smap-description">{map.description}</p> : <p className="smap-description">View {map.title} in full size above, or download it to keep a copy.</p>}
            <ShareLinks url={url} title={map.title} />
          </section>
          <aside className="aside-card">
            <h2>Map details</h2>
            <dl className="smap-details">
              {details.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>

        {result.related.length > 0 && (
          <section className="section smap-related" aria-labelledby="related-maps">
            <div className="home-head">
              <div className="home-head-text">
                <h2 id="related-maps">
                  More <span>Maps</span>
                </h2>
              </div>
              <div className="home-head-action">
                <Link className="pill-link" href="/society-maps">
                  View all maps
                </Link>
              </div>
            </div>
            <div className="smap-grid">
              {result.related.map((item) => (
                <SocietyMapCard key={item.id} map={item} headingLevel="h3" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
