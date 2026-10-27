import dayjs from "dayjs";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { BannerSlot } from "@/components/banner-slot";
import { DownloadIcon, MapIcon, PinIcon } from "@/components/icons";
import { ShareLinks } from "@/components/share-links";
import { MapViewer } from "@/components/society-maps/map-viewer";
import { SocietyMapCard } from "@/components/society-maps/society-map-card";
import { altText } from "@/lib/alt-text";
import { getMapAreas } from "@/lib/plot-finder";
import { mapsHref, resolveArea } from "@/lib/plot-finder-shared";
import { fileSizeLabel, getSocietyMap, societyMapHref, societyMapLocation } from "@/lib/society-maps";
import { adminShareImage, notFoundMetadata, pageMetadata } from "@/lib/seo";
import { absoluteUrl, ref, webPageSchemas } from "@/lib/schema";
import { societyMapSchema } from "@/lib/schema-entities";
import { JsonLd } from "@/components/json-ld";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/map/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await getSocietyMap(slug);

  if (!result) {
    return notFoundMetadata("Map not found");
  }

  const map = result.data;
  return pageMetadata({
    title: map.meta_title ?? map.title,
    description: map.meta_description ?? map.description_text ?? `${map.title}: view the DHA Gujranwala map in full size, zoom in and download it.`,
    path: societyMapHref(map.slug),
    // Maps are shared whole rather than cropped.
    images: [adminShareImage(map), map.image_url && { url: map.image_url, alt: altText(map.image_alt, map.title), fit: "contain" }],
    imageAlt: map.title,
  });
}

export default async function SocietyMapPage({ params }: PageProps<"/map/[slug]">) {
  const { slug } = await params;
  const result = await getSocietyMap(slug);

  if (!result) {
    // The Plot Finder used to live at /maps/{sector}: send old links there.
    const areas = await getMapAreas();
    const area = areas ? resolveArea(areas, [slug]) : null;

    if (area?.entry) {
      permanentRedirect(mapsHref(area.entry));
    }

    notFound();
  }

  const map = result.data;
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

  const mapPath = societyMapHref(map.slug);
  const structuredData = [
    ...webPageSchemas({
      path: mapPath,
      name: map.meta_title ?? map.title,
      description: map.meta_description ?? map.description_text,
      breadcrumb: [
        { name: "Society Maps", path: "/dha-gujranwala-maps" },
        { name: map.title, path: mapPath },
      ],
      mainEntity: ref(`${absoluteUrl(mapPath)}#map`),
      datePublished: map.published_at,
      dateModified: updated,
    }),
    societyMapSchema(map),
  ];

  return (
    <div className="smap-page">
      <JsonLd data={structuredData} />

      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">›</span>
          <Link href="/dha-gujranwala-maps">Society Maps</Link>
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
            <Link className="btn btn-outline" href="/plot-finder">
              <MapIcon className="icon" /> Plot Finder
            </Link>
          </div>
        </header>

        <MapViewer src={map.image_url} alt={altText(map.image_alt, map.title)} />

        <div className="smap-info">
          <section>
            <h2>About this map</h2>
            {map.description ? <div className="smap-description prose" dangerouslySetInnerHTML={{ __html: map.description }} /> : <p className="smap-description">View {map.title} in full size above, or download it to keep a copy.</p>}
            <ShareLinks url={absoluteUrl(mapPath)} title={map.title} />
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

        <BannerSlot key={map.slug} placement="maps_top" className="banner-page-top" />

        {result.related.length > 0 && (
          <section className="section smap-related" aria-labelledby="related-maps">
            <div className="home-head">
              <div className="home-head-text">
                <h2 id="related-maps">
                  More <span>Maps</span>
                </h2>
              </div>
              <div className="home-head-action">
                <Link className="pill-link" href="/dha-gujranwala-maps">
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
