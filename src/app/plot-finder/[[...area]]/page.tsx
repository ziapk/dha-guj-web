import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlotFinder } from "@/components/plot-finder/plot-finder";
import { getMapAreas, getMapConfig } from "@/lib/plot-finder";
import { areaTitle, mapsHref, resolveArea, sectorEntries } from "@/lib/plot-finder-shared";
import { whatsappNumber } from "@/lib/property";
import { notFoundMetadata, pageMetadata, queryRobots } from "@/lib/seo";
import { portalUrl } from "@/lib/site";
import { getSiteSettings } from "@/lib/site-data";
import type { MapAreas } from "@/types/api";
import { absoluteUrl, itemListSchema, ref, webPageSchemas } from "@/lib/schema";
import { plotFinderPlaceSchema } from "@/lib/schema-entities";
import { JsonLd } from "@/components/json-ld";

export const revalidate = 300;

const EMPTY_AREAS: MapAreas = { societies: [], overlays: [] };

function plotParam(value: string | string[] | undefined): number | null {
  const id = Number.parseInt(Array.isArray(value) ? (value[0] ?? "") : (value ?? ""), 10);

  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({ params, searchParams }: PageProps<"/plot-finder/[[...area]]">): Promise<Metadata> {
  const { area = [] } = await params;
  const areas = (await getMapAreas()) ?? EMPTY_AREAS;
  const resolved = resolveArea(areas, area);

  if (!resolved) {
    return notFoundMetadata("Map not found");
  }

  const name = areaTitle(resolved.entry, resolved.block);
  const place = resolved.block ? "block" : "sector";

  return pageMetadata({
    title: resolved.entry ? `${name} – Plots, Map & Location` : `${name} Plot Finder & Map`,
    absoluteTitle: Boolean(resolved.entry),
    description: resolved.entry
      ? `Explore ${name}: find any plot on a live satellite map with plot numbers, sizes, parks, commercial areas, ${place} location and plots for sale or rent.`
      : `Find any plot in ${name} on a live satellite map: plot numbers, sizes, parks, commercial areas and listings for sale or rent.`,
    path: mapsHref(resolved.entry, resolved.block),
    robots: queryRobots(await searchParams),
  });
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

  const path = mapsHref(entry, block);
  const structuredData = [
    ...webPageSchemas({
      path,
      name: entry ? `${name} – Plots, Map & Location` : `${name} Plot Finder & Map`,
      breadcrumb: [
        { name: "Plot Finder", path: "/plot-finder" },
        ...(entry ? [{ name: areaTitle(entry, null), path: mapsHref(entry) }] : []),
        ...(entry && block ? [{ name: areaTitle(entry, block), path }] : []),
      ],
      mainEntity: entry ? ref(`${absoluteUrl(path)}#place`) : null,
    }),
    entry ? plotFinderPlaceSchema(entry, block) : null,
    // The areas the finder lists: every mapped sector on the main page, a sector's blocks on its own page.
    entry && !block
      ? itemListSchema(
          path,
          entry.sector.blocks.map((item) => ({ url: mapsHref(entry, item), name: areaTitle(entry, item) })),
          `Blocks in ${areaTitle(entry, null)}`,
        )
      : !entry
        ? itemListSchema(
            path,
            sectorEntries(areas).map((item) => ({ url: mapsHref(item), name: areaTitle(item, null) })),
            "Mapped sectors",
          )
        : null,
  ];

  return (
    <>
      <JsonLd data={structuredData} />
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
