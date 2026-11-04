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
import { areaListingsHref, getAreaListings, getBlockGuide, SECTORS_PATH } from "@/lib/sector-guides";

export const revalidate = 300;

type Params = PageProps<"/dha-gujranwala-sectors/[sector]/[block]">;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { sector, block } = await params;
  const guide = await getBlockGuide(sector, block);

  if (!guide) {
    return notFoundMetadata("Page not found");
  }

  return pageMetadata({
    title: guide.meta_title ?? `${guide.title}, ${guide.sector.title}, ${guide.sector.society.name}: Map & Location`,
    description: guide.meta_description ?? guide.summary,
    path: guide.path,
    images: [guide.map && { url: guide.map.image_url, alt: altText(guide.map.image_alt, guide.map.title), fit: "contain" }],
  });
}

export default async function BlockGuidePage({ params }: Params) {
  const { sector: sectorSegment, block } = await params;
  const guide = await getBlockGuide(sectorSegment, block);

  if (!guide) {
    notFound();
  }

  const { sector } = guide;
  const [listings, areas] = await Promise.all([getAreaListings(sector.society.id, sector.name, guide.name), getMapAreas()]);
  const mappedSector = areas ? sectorEntries(areas).find((entry) => entry.sector.id === sector.id) : undefined;
  const mappedBlock = mappedSector?.sector.blocks.find((item) => item.id === guide.id);
  const others = sector.blocks.filter((item): item is typeof item & { path: string } => item.id !== guide.id && item.path !== null);
  const trail = [
    { name: "DHA Gujranwala Sectors", path: SECTORS_PATH },
    { name: sector.title, path: sector.path },
    { name: guide.title, path: guide.path },
  ];

  return (
    <>
      <JsonLd
        data={[
          ...webPageSchemas({
            path: guide.path,
            name: guide.meta_title ?? `${guide.title}, ${sector.title}, ${sector.society.name}`,
            description: guide.meta_description ?? guide.summary,
            breadcrumb: trail,
            mainEntity: ref(`${absoluteUrl(guide.path)}#place`),
            datePublished: guide.published_at,
            dateModified: guide.updated_at,
          }),
          areaGuidePlaceSchema(guide, { society: sector.society, phase: sector.phase, sector }, mappedBlock?.boundary),
          propertyListSchema(guide.path, listings, `Properties in ${guide.title}`),
        ]}
      />
      <AreaGuidePage
        guide={guide}
        trail={trail}
        heading={`${guide.title}, ${sector.title}, ${sector.society.name}`}
        ratesTitle={sector.title}
        facts={[
          { label: "Sector", value: <Link href={sector.path}>{sector.title}</Link> },
          { label: "Phase", value: `Phase ${sector.phase.name}` },
          { label: "Properties listed", value: guide.listings_count },
        ]}
        listings={listings}
        listingsHref={areaListingsHref(sector.society.id, sector.name, guide.name)}
        plotFinderHref={mappedSector ? mapsHref(mappedSector, mappedBlock) : null}
      >
        <section className="detail-section sg-rates">
          <h2>More in {sector.title}</h2>
          <p>
            Read the full <Link href={sector.path}>{sector.title} guide</Link>
            {others.length > 0 ? ", or see another block:" : "."}
          </p>
          {others.length > 0 && (
            <ul className="sg-chips">
              {others.map((item) => (
                <li key={item.id}>
                  <Link href={item.path}>{item.title}</Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </AreaGuidePage>
    </>
  );
}
