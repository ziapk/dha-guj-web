import { cache } from "react";
import { NotFoundError, publicApi } from "@/lib/api";
import { cmsPageHref } from "@/lib/site-data";
import type { BlockGuide, CmsPageSummary, Collection, Paginated, PublicProperty, Resource, SectorGuide, SectorGuideDetail } from "@/types/api";

const REVALIDATE = 300;

/** The CMS page holding the directory's overview; publishing it is what puts the whole guide section live. */
export const SECTORS_SLUG = "dha-gujranwala-sectors";
export const SECTORS_PATH = `/${SECTORS_SLUG}`;

/** The pricing hub, a CMS page of its own. Sector guides link to it and never live under its URL. */
export const PLOT_RATES_SLUG = "dha-gujranwala-plot-rates";
export const PLOT_RATES_PATH = `/${PLOT_RATES_SLUG}`;

/** Public sector guides with their blocks; empty when there are none or the API is unavailable. */
export const getSectorGuides = cache(async (revalidate: number = REVALIDATE): Promise<SectorGuide[]> => {
  return publicApi<Collection<SectorGuide>>("sector-guides", { revalidate })
    .then((response) => response.data)
    .catch(() => []);
});

async function orNull<T>(request: Promise<Resource<T>>): Promise<T | null> {
  try {
    return (await request).data;
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null;
    }

    throw error;
  }
}

/** One sector guide from its URL segment; anything but "sector-…" is not a guide address. */
export const getSectorGuide = cache(async (segment: string): Promise<SectorGuideDetail | null> => {
  if (!/^sector-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(segment)) {
    return null;
  }

  return orNull(publicApi<Resource<SectorGuideDetail>>(`sector-guides/${segment}`, { revalidate: REVALIDATE }));
});

/** One block guide from its URL segments; anything but "sector-…/block-…" is not a guide address. */
export const getBlockGuide = cache(async (sector: string, block: string): Promise<BlockGuide | null> => {
  if (!/^sector-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(sector) || !/^block-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(block)) {
    return null;
  }

  return orNull(publicApi<Resource<BlockGuide>>(`sector-guides/${sector}/${block}`, { revalidate: REVALIDATE }));
});

/** Listings store the sector and block as text, which is what the API filters on. */
function listingFilters(societyId: number, sector: string, block?: string): Record<string, string> {
  return { society_id: String(societyId), sector, ...(block ? { block } : {}) };
}

/** The newest listings on the market in an area; empty when the API is unavailable. */
export async function getAreaListings(societyId: number, sector: string, block?: string): Promise<PublicProperty[]> {
  return publicApi<Paginated<PublicProperty>>("properties", { query: { ...listingFilters(societyId, sector, block), sort: "newest", per_page: 6 }, revalidate: 60 })
    .then((response) => response.data)
    .catch(() => []);
}

/** The search page showing every listing in an area. */
export function areaListingsHref(societyId: number, sector: string, block?: string): string {
  return `/properties?${new URLSearchParams(listingFilters(societyId, sector, block))}`;
}

export type MenuLink = { href: string; label: string };

/**
 * The website's Guides menu, from what admins switched on: the header gets every page and guide marked "in header",
 * the footer every guide marked "in footer" plus the sectors directory. The directory always comes first.
 */
export function guidesMenus(pages: CmsPageSummary[], sectors: SectorGuide[]): { header: MenuLink[]; footer: MenuLink[] } {
  const directoryFirst = [...pages].sort((a, b) => Number(b.slug === SECTORS_SLUG) - Number(a.slug === SECTORS_SLUG));
  const pageLink = (page: CmsPageSummary): MenuLink => ({ href: cmsPageHref(page.slug), label: page.title });
  const guides = sectors.flatMap((sector) => [
    { href: sector.path, label: sector.title, header: sector.show_in_header, footer: sector.show_in_footer },
    ...sector.blocks.flatMap((block) => (block.path ? [{ href: block.path, label: `${block.title}, ${sector.title}`, header: block.show_in_header, footer: block.show_in_footer }] : [])),
  ]);
  const links = (shown: typeof guides) => shown.map(({ href, label }) => ({ href, label }));

  return {
    header: [...directoryFirst.filter((page) => page.show_in_header).map(pageLink), ...links(guides.filter((guide) => guide.header))],
    footer: [...directoryFirst.filter((page) => page.slug === SECTORS_SLUG && page.show_in_footer).map(pageLink), ...links(guides.filter((guide) => guide.footer))],
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * The id of an area's section on the plot rates page. The zones share one section ("Commercial Zone Plot Rates"), so
 * "Commercial Zone 2" points at "rates-commercial-zone". An area with no section of its own opens the page at the top.
 */
export function ratesAnchor(title: string): string {
  return `rates-${slugify(title.replace(/\s+\d+$/, ""))}`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * The plot rates page is written in the CMS, one "Sector A Plot Rates" heading per area. This gives each heading an id
 * for the guides to link to, and adds a link to that area's published guide right below it, so the two stay connected
 * without anyone editing the rates text. Runs on the server, so the links are in the HTML crawlers read.
 */
export function withSectorGuideLinks(html: string, guides: SectorGuide[]): string {
  return html.replace(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/gi, (heading, attributes: string, inner: string) => {
    const text = inner
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;| /g, " ")
      .trim();
    const area = /^(.+?)\s+plots?\s+rates\b/i.exec(text)?.[1];

    if (!area) {
      return heading;
    }

    const anchor = ratesAnchor(area);
    const matches = guides.filter((guide) => ratesAnchor(guide.title) === anchor);
    const links = matches.map((guide) => `<a href="${escapeHtml(guide.path)}">${escapeHtml(guide.title)} guide</a>`).join(", ");
    const id = /\bid=/i.test(attributes) ? "" : ` id="${anchor}"`;

    return `<h2${id}${attributes}>${inner}</h2>${links ? `<p class="sg-rates-link">Maps, blocks, roads and facilities: read the ${links}.</p>` : ""}`;
  });
}
