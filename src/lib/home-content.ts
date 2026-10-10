/**
 * Home page content the public API does not serve yet: the hero trust strip, the sector maps and
 * the SEO link columns. Edit this file to change them — no deploy-time data fetching is involved.
 * When the API grows an endpoint for maps, swap the array for a publicApi() call.
 *
 * Agents used to live here too; they now come from `lib/agents.ts` once an admin approves them.
 *
 * The maps ship without files. Put your own under public/maps and point `file` at them; until
 * then each card falls back to a placeholder tile, so nothing 404s.
 */

export type TrustItem = { title: string; text: string; icon: "shield" | "users" | "pin" | "chart" };

/** The four reassurance items across the bottom of the hero. */
export const HERO_TRUST: TrustItem[] = [
  { icon: "shield", title: "Verified Listings", text: "Genuine Properties" },
  { icon: "users", title: "Trusted Dealers", text: "Professional Network" },
  { icon: "pin", title: "Prime Location", text: "High Investment Value" },
  { icon: "chart", title: "Expert Support", text: "We're Here to Help" },
];


export type SectorMap = {
  slug: string;
  /** Pill over the thumbnail. */
  badge: string;
  /** Pill colour; matches the design's blue / green / purple set. */
  tone: "blue" | "green" | "purple";
  title: string;
  description: string;
  /**
   * The map itself, as a file under public/ (an image or a PDF). It is both the thumbnail and
   * where "View Map" goes. Leave it null until you have the file: the card then shows a
   * placeholder tile and the button is greyed out instead of linking to a 404.
   */
  file: string | null;
};

export const SECTOR_MAPS: SectorMap[] = [
  { slug: "complete-sector-map", badge: "Sector Map", tone: "blue", title: "Complete Sector Map", description: "View every sector of DHA Gujranwala.", file: null },
  { slug: "sector-a", badge: "Sector A", tone: "green", title: "Sector A Map", description: "Detailed map with streets and plot numbers.", file: null },
  { slug: "commercial-zone", badge: "Commercial Zone", tone: "purple", title: "Commercial Zone Map", description: "Explore commercial zones (CZ-01, CZ-02, CZ-03).", file: null },
  { slug: "location-map", badge: "Location Map", tone: "blue", title: "Location Map", description: "Find DHA Gujranwala location and access routes.", file: null },
];

