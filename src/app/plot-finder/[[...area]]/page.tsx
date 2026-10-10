import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlotFinder } from "@/components/plot-finder/plot-finder";
import { getMapAreas, getMapConfig } from "@/lib/plot-finder";
import { areaTitle, mapsHref, resolveArea } from "@/lib/plot-finder-shared";
import { whatsappNumber } from "@/lib/property";
import { jsonLd, openGraph } from "@/lib/seo";
import { portalUrl, siteUrl } from "@/lib/site";
import { getSiteSettings } from "@/lib/site-data";
import type { MapAreas } from "@/types/api";

export const revalidate = 300;

const EMPTY_AREAS: MapAreas = { societies: [], overlays: [] };

function plotParam(value: string | string[] | undefined): number | null {
  const id = Number.parseInt(Array.isArray(value) ? (value[0] ?? "") : (value ?? ""), 10);

  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({ params }: PageProps<"/plot-finder/[[...area]]">): Promise<Metadata> {
  const { area = [] } = await params;
  const areas = (await getMapAreas()) ?? EMPTY_AREAS;
  const resolved = resolveArea(areas, area);

  if (!resolved) {
    return { title: "Map not found", robots: { index: false } };
  }

  const name = areaTitle(resolved.entry, resolved.block);
  const title = `${name} Plot Finder & Map`;
  const description = `Find any plot in ${name} on a live satellite map: plot numbers, sizes, parks, commercial areas and listings for sale or rent.`;
  const url = mapsHref(resolved.entry, resolved.block);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: await openGraph({ title, description, url }),
    twitter: { card: "summary", title, description },
  };
}

export default async function PlotFinderPage({ params, searchParams }: PageProps<"/plot-finder/[[...area]]">) {
  const { area = [] } = await params;
  const [config, fetchedAreas, settings] = await Promise.all([getMapConfig(), getMapAreas(), getSiteSettings()]);
  const areas = fetchedAreas ?? EMPTY_AREAS;
  const resolved = resolveArea(areas, area);

  // An unknown area is a 404, unless the API is down and nothing could be checked.
  if (!resolved) {
    if (fetchedAreas) {
      notFound();
    }
  }

  const entry = resolved?.entry ?? null;
  const block = resolved?.block ?? null;
  const name = areaTitle(entry, block);

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl() },
      { "@type": "ListItem", position: 2, name: "Plot Finder", item: `${siteUrl()}/plot-finder` },
      ...(entry ? [{ "@type": "ListItem", position: 3, name, item: `${siteUrl()}${mapsHref(entry, block)}` }] : []),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />
      <PlotFinder
        config={config}
        areas={areas}
        initialSectorId={entry?.sector.id ?? null}
        initialBlockId={block?.id ?? null}
        initialPlotId={plotParam((await searchParams).plot)}
        whatsapp={whatsappNumber(settings.contact.whatsapp ?? settings.contact.phone)}
        postPropertyUrl={portalUrl("/listings/new")}
      />
    </>
  );
}
