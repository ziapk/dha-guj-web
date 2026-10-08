import { publicApi } from "@/lib/api";
import { agentHref } from "@/lib/agents";
import { authorHref } from "@/lib/authors";
import { postHref } from "@/lib/blog";
import { developerHref } from "@/lib/developers";
import { getMapAreas } from "@/lib/plot-finder";
import { mapsHref, sectorEntries } from "@/lib/plot-finder-shared";
import { projectHref } from "@/lib/project";
import { siteUrl } from "@/lib/site";
import { cmsPageHref, getCmsPages } from "@/lib/site-data";
import { societyMapHref } from "@/lib/society-maps";
import type { AgencyProfile, BlogPostSummary, Paginated, PublicAgent, PublicAuthor, PublicDeveloper, PublicProject, PublicSocietyMap } from "@/types/api";

/** Rebuild each sitemap at most once an hour. */
export const SITEMAP_REVALIDATE = 3600;

/** The public API returns at most 48 items per page. */
const PER_PAGE = 48;

/** Safety limits in pages of 48 (e.g. 20 pages = 960 projects). A sitemap file may hold 50,000 URLs. */
const MAX_PROJECT_PAGES = 20;
const MAX_AGENCY_PAGES = 20;
const MAX_AGENT_PAGES = 50;
const MAX_DEVELOPER_PAGES = 10;
const MAX_POST_PAGES = 50;
const MAX_AUTHOR_PAGES = 5;
const MAX_SOCIETY_MAP_PAGES = 5;

type ChangeFrequency = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

export type SitemapEntry = { url: string; lastModified?: string | null; changeFrequency?: ChangeFrequency; priority?: number };

/**
 * Walk every page of a paginated public endpoint. Stops quietly at the first failure,
 * so a build without the API still produces sitemaps with the static pages.
 */
async function collect<T>(path: string, maxPages: number): Promise<T[]> {
  const items: T[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const result = await publicApi<Paginated<T>>(path, { query: { per_page: PER_PAGE, page }, revalidate: SITEMAP_REVALIDATE }).catch(() => null);

    if (!result) {
      break;
    }

    items.push(...result.data);

    if (page >= result.meta.last_page) {
      break;
    }
  }

  return items;
}

/** Each child sitemap: its file name (served from the site root) and how to build its entries. */
export const SITEMAPS = {
  "sitemap-main.xml": {
    description: "all the main pages of the website",
    async entries(site: string): Promise<SitemapEntry[]> {
      const pages = await getCmsPages();

      return [
        { url: `${site}/`, changeFrequency: "daily", priority: 1 },
        { url: `${site}/properties`, changeFrequency: "hourly", priority: 0.9 },
        { url: `${site}/buy`, changeFrequency: "hourly", priority: 0.8 },
        { url: `${site}/rent`, changeFrequency: "hourly", priority: 0.8 },
        { url: `${site}/projects`, changeFrequency: "daily", priority: 0.7 },
        { url: `${site}/agencies`, changeFrequency: "daily", priority: 0.6 },
        { url: `${site}/agents`, changeFrequency: "daily", priority: 0.6 },
        { url: `${site}/developers`, changeFrequency: "weekly", priority: 0.6 },
        { url: `${site}/wanted`, changeFrequency: "daily", priority: 0.5 },
        { url: `${site}/dha-gujranwala-files-rates`, changeFrequency: "daily", priority: 0.6 },
        { url: `${site}/pricing`, changeFrequency: "monthly", priority: 0.5 },
        { url: `${site}/about-us`, changeFrequency: "monthly", priority: 0.3 },
        { url: `${site}/contact`, changeFrequency: "monthly", priority: 0.3 },
        ...pages.map((page) => ({ url: `${site}${cmsPageHref(page.slug)}`, lastModified: page.updated_at, changeFrequency: "monthly" as const, priority: 0.3 })),
      ];
    },
  },
  "property.xml": {
    description: "all properties of the website",
    async entries(site: string): Promise<SitemapEntry[]> {
      // The API decides which listings belong: live ones (sold included), expired ones worth keeping, and admin overrides.
      const properties = await publicApi<{ data: { path: string; last_modified: string | null }[] }>("sitemap/properties", { revalidate: SITEMAP_REVALIDATE })
        .then((response) => response.data)
        .catch(() => []);

      return properties.map((property) => ({ url: `${site}${property.path}`, lastModified: property.last_modified, changeFrequency: "daily", priority: 0.8 }));
    },
  },
  "dealers.xml": {
    description: "all dealers / agencies of the website",
    async entries(site: string): Promise<SitemapEntry[]> {
      const agencies = await collect<AgencyProfile>("agencies", MAX_AGENCY_PAGES);

      return agencies.map((agency) => ({ url: `${site}/agencies/${agency.slug}`, changeFrequency: "weekly", priority: 0.6 }));
    },
  },
  "maps.xml": {
    description: "all maps of the website",
    async entries(site: string): Promise<SitemapEntry[]> {
      const [mapAreas, societyMaps] = await Promise.all([getMapAreas(), collect<PublicSocietyMap>("society-maps", MAX_SOCIETY_MAP_PAGES)]);
      const mapPages = mapAreas ? sectorEntries(mapAreas).flatMap((entry) => [mapsHref(entry), ...entry.sector.blocks.map((block) => mapsHref(entry, block))]) : [];

      return [
        { url: `${site}/maps`, changeFrequency: "weekly", priority: 0.6 },
        { url: `${site}/society-maps`, changeFrequency: "weekly", priority: 0.6 },
        ...societyMaps.map((map) => ({ url: `${site}${societyMapHref(map.slug)}`, lastModified: map.updated_at, changeFrequency: "monthly" as const, priority: 0.5 })),
        ...mapPages.map((path) => ({ url: `${site}${path}`, changeFrequency: "weekly" as const, priority: 0.5 })),
      ];
    },
  },
  "agents.xml": {
    description: "all agents of the website",
    async entries(site: string): Promise<SitemapEntry[]> {
      const agents = await collect<PublicAgent>("agents", MAX_AGENT_PAGES);

      return agents.map((agent) => ({ url: `${site}${agentHref(agent.slug)}`, changeFrequency: "weekly", priority: 0.5 }));
    },
  },
  "projects.xml": {
    description: "all projects of the website",
    async entries(site: string): Promise<SitemapEntry[]> {
      const projects = await collect<PublicProject>("projects", MAX_PROJECT_PAGES);

      return projects.map((project) => ({ url: `${site}${projectHref(project.slug)}`, lastModified: project.published_at, changeFrequency: "daily", priority: 0.7 }));
    },
  },
  "developers.xml": {
    description: "all developers of the website",
    async entries(site: string): Promise<SitemapEntry[]> {
      const developers = await collect<PublicDeveloper>("developers", MAX_DEVELOPER_PAGES);

      return developers.map((developer) => ({ url: `${site}${developerHref(developer.slug)}`, changeFrequency: "weekly", priority: 0.6 }));
    },
  },
  "sitemap-blogs.xml": {
    description: "all blogs of the website",
    async entries(site: string): Promise<SitemapEntry[]> {
      const [posts, authors] = await Promise.all([collect<BlogPostSummary>("posts", MAX_POST_PAGES), collect<PublicAuthor>("authors", MAX_AUTHOR_PAGES)]);

      return [
        { url: `${site}/blog`, changeFrequency: "weekly", priority: 0.5 },
        { url: `${site}/authors`, changeFrequency: "weekly", priority: 0.4 },
        ...posts.map((post) => ({ url: `${site}${postHref(post.slug)}`, lastModified: post.updated_at ?? post.published_at, changeFrequency: "monthly" as const, priority: 0.5 })),
        ...authors.map((author) => ({ url: `${site}${authorHref(author.slug)}`, changeFrequency: "weekly" as const, priority: 0.4 })),
      ];
    },
  },
} satisfies Record<string, { description: string; entries: (site: string) => Promise<SitemapEntry[]> }>;

export type SitemapName = keyof typeof SITEMAPS;

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/** W3C datetime for <lastmod>; skips values that don't parse. */
function lastmod(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function xmlResponse(body: string): Response {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n${body}`, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": `public, max-age=0, s-maxage=${SITEMAP_REVALIDATE}` },
  });
}

/** GET /sitemap.xml — the index pointing at every child sitemap. */
export function sitemapIndexResponse(): Response {
  const site = siteUrl();
  const items = Object.entries(SITEMAPS).map(
    ([file, { description }]) => `  <!-- This sitemap contains ${escapeXml(description)} -->\n  <sitemap>\n    <loc>${escapeXml(`${site}/${file}`)}</loc>\n  </sitemap>`,
  );

  return xmlResponse(`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join("\n")}\n</sitemapindex>\n`);
}

/** GET /{name} — one child sitemap as a <urlset>. */
export async function sitemapResponse(name: SitemapName): Promise<Response> {
  const entries = await SITEMAPS[name].entries(siteUrl());
  const urls = entries.map((entry) => {
    const modified = lastmod(entry.lastModified);

    return [
      "  <url>",
      `    <loc>${escapeXml(entry.url)}</loc>`,
      modified ? `    <lastmod>${modified}</lastmod>` : null,
      entry.changeFrequency ? `    <changefreq>${entry.changeFrequency}</changefreq>` : null,
      entry.priority !== undefined ? `    <priority>${entry.priority}</priority>` : null,
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n");
  });

  return xmlResponse(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`);
}
