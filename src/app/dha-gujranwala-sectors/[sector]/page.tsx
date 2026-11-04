import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { AreaGuidePage } from "@/components/sector-guides/area-guide-page";
import { altText } from "@/lib/alt-text";
import { getMapAreas } from "@/lib/plot-finder";
import { mapsHref, sectorEntries } from "@/lib/plot-finder-shared";
import { absoluteUrl, ref, webPageSchemas } from "@/lib/schema";
import { areaGuidePlaceSchema, propertyListSchema } from "@/lib/schema-entities";
import { notFoundMetadata, pageMetadata } from "@/lib/seo";
import { areaListingsHref, getAreaListings, getSectorGuide, SECTORS_PATH } from "@/lib/sector-guides";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/dha-gujranwala-sectors/[sector]">): Promise<Metadata> {
  const guide = await getSectorGuide((await params).sector);

  if (!guide) {
    return notFoundMetadata("Page not found");
  }

  return pageMetadata({
    title: guide.meta_title ?? `${guide.title}, ${guide.society.name}: Map, Blocks & Facilities`,
    description: guide.meta_description ?? guide.summary,
    path: guide.path,
    images: [guide.map && { url: guide.map.image_url, alt: altText(guide.map.image_alt, guide.map.title), fit: "contain" }],
  });
}

export default async function SectorGuidePage({ params }: PageProps<"/dha-gujranwala-sectors/[sector]">) {
  const guide = await getSectorGuide((await params).sector);

  if (!guide) {
    notFound();
  }

  const [listings, areas] = await Promise.all([getAreaListings(guide.society.id, guide.name), getMapAreas()]);
  const mapped = areas ? sectorEntries(areas).find((entry) => entry.sector.id === guide.id) : undefined;
  const trail = [
    { name: "DHA Gujranwala Sectors", path: SECTORS_PATH },
    { name: guide.title, path: guide.path },
  ];

  return (
    <>
      <JsonLd
        data={[
          ...webPageSchemas({
            path: guide.path,
            name: guide.meta_title ?? `${guide.title}, ${guide.society.name}`,
            description: guide.meta_description ?? guide.summary,
            breadcrumb: trail,
            mainEntity: ref(`${absoluteUrl(guide.path)}#place`),
            datePublished: guide.published_at,
            dateModified: guide.updated_at,
          }),
          areaGuidePlaceSchema(guide, { society: guide.society, phase: guide.phase }, mapped?.sector.boundary),
          propertyListSchema(guide.path, listings, `Properties in ${guide.title}`),
        ]}
      />
      <AreaGuidePage
        guide={guide}
        trail={trail}
        heading={`${guide.title}, ${guide.society.name}`}
        ratesTitle={guide.title}
        facts={[
          { label: "Society", value: guide.society.name },
          { label: "Phase", value: `Phase ${guide.phase.name}` },
          ...(guide.blocks.length > 0 ? [{ label: "Blocks", value: guide.blocks.length }] : []),
          { label: "Properties listed", value: guide.listings_count },
          { label: "All sectors", value: <Link href={SECTORS_PATH}>Sectors guide</Link> },
        ]}
        listings={listings}
        listingsHref={areaListingsHref(guide.society.id, guide.name)}
        plotFinderHref={mapped ? mapsHref(mapped) : null}
      >
        {guide.blocks.length > 0 && (
          <section className="detail-section" aria-labelledby="area-blocks">
            <h2 id="area-blocks">Blocks in {guide.title}</h2>
            <ul className="sg-blocks">
              {guide.blocks.map((block) => (
                <li key={block.id}>
                  {block.path ? <Link href={block.path}>{block.title}</Link> : <strong>{block.title}</strong>}
                  {block.summary && <p>{block.summary}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </AreaGuidePage>
    </>
  );
}
