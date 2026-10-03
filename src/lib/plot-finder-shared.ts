/** Plot Finder helpers shared by the server page and the client map (no server-only imports). */

import type { MapAreas, MapBlock, MapPhase, MapSector, MapSociety, PlotType } from "@/types/api";

export const PLOT_TYPES: Record<PlotType, { label: string; color: string }> = {
  residential: { label: "Residential", color: "#f5c542" },
  commercial: { label: "Commercial", color: "#e2554f" },
  park: { label: "Park", color: "#3fb36b" },
  mosque: { label: "Mosque", color: "#2f9e9a" },
  school: { label: "School", color: "#4c7ce5" },
  hospital: { label: "Hospital", color: "#d65db1" },
  graveyard: { label: "Graveyard", color: "#8a8f98" },
  utility: { label: "Utility", color: "#a26b3f" },
  other: { label: "Other", color: "#b7a7e8" },
};

/** A sector with where it sits, for lists and URLs. */
export type SectorEntry = { society: MapSociety; phase: MapPhase; sector: MapSector; key: string };

/**
 * Every mapped sector with its URL key. The key is the sector's slug ("g"), or "phase-sector" ("ii-g") when two
 * phases have a sector with the same slug, so /maps/{key}/{block} always means one place.
 */
export function sectorEntries(areas: MapAreas): SectorEntry[] {
  const all = areas.societies.flatMap((society) => society.phases.flatMap((phase) => phase.sectors.map((sector) => ({ society, phase, sector }))));
  const counts = new Map<string, number>();

  for (const { sector } of all) {
    counts.set(sector.slug, (counts.get(sector.slug) ?? 0) + 1);
  }

  return all.map((entry) => ({ ...entry, key: (counts.get(entry.sector.slug) ?? 0) > 1 ? `${entry.phase.slug}-${entry.sector.slug}` : entry.sector.slug }));
}

export function mapsHref(entry?: SectorEntry | null, block?: MapBlock | null): string {
  if (!entry) {
    return "/maps";
  }

  return block ? `/maps/${entry.key}/${block.slug}` : `/maps/${entry.key}`;
}

/** The sector and block a /maps/… path points to; null when the path names something that is not mapped. */
export function resolveArea(areas: MapAreas, path: string[]): { entry: SectorEntry | null; block: MapBlock | null } | null {
  if (path.length === 0) {
    return { entry: null, block: null };
  }

  const entry = sectorEntries(areas).find((item) => item.key === path[0]);

  if (!entry || path.length > 2) {
    return null;
  }

  if (path.length === 1) {
    return { entry, block: null };
  }

  const block = entry.sector.blocks.find((item) => item.slug === path[1]);

  return block ? { entry, block } : null;
}

/** "Sector G", leaving names that already say "Sector" alone. */
export function sectorName(name: string): string {
  return /^sector\b/i.test(name) ? name : `Sector ${name}`;
}

export function blockName(name: string): string {
  return /^block\b/i.test(name) ? name : `Block ${name}`;
}

/** "DHA Gujranwala Sector G Block 4" style title for the area. */
export function areaTitle(entry: SectorEntry | null, block: MapBlock | null): string {
  if (!entry) {
    return "DHA Gujranwala";
  }

  return [entry.society.name, sectorName(entry.sector.name), block ? blockName(block.name) : null].filter(Boolean).join(" ");
}
