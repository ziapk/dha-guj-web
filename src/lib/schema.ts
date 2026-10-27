/**
 * Schema.org structured data (JSON-LD). Every public page describes itself with the builders here, so the same
 * thing always has the same "@id" across pages: the brand (built once in the root layout from the API's settings),
 * the website, each dealer, agent, author, developer, project and listing. Pages refer to an entity defined
 * elsewhere with ref(id) instead of repeating its details, which keeps names, phone numbers and logos consistent.
 *
 * Only what the page actually shows goes in: builders take nullable values and clean() drops anything empty, so
 * nothing is guessed (no ratings, coordinates, prices or opening hours the API does not have). Server-only.
 */

import { agentHref } from "@/lib/agents";
import { authorHref } from "@/lib/authors";
import { developerHref } from "@/lib/developers";
import { MAIN_NAV } from "@/lib/navigation";
import { projectHref } from "@/lib/project";
import { SEO } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import { siteNameOf } from "@/lib/site-data";
import type { SiteSettings, SocialNetwork } from "@/types/api";

export type Schema = Record<string, unknown>;
export type Ref = { "@id": string };

/** A full URL for a site path ("/dealers" → "https://site/dealers"); full URLs pass through. */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  return `${siteUrl()}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

/** Shared identifiers: a page that mentions a dealer uses the same "@id" as the dealer's own profile page. */
export const schemaId = {
  organization: () => `${siteUrl()}/#organization`,
  logo: () => `${siteUrl()}/#logo`,
  website: () => `${siteUrl()}/#website`,
  navigation: () => `${siteUrl()}/#navigation`,
  webPage: (path: string) => `${absoluteUrl(path)}#webpage`,
  breadcrumb: (path: string) => `${absoluteUrl(path)}#breadcrumb`,
  itemList: (path: string) => `${absoluteUrl(path)}#list`,
  faq: (path: string) => `${absoluteUrl(path)}#faq`,
  dealer: (slug: string) => `${siteUrl()}/dealer/${slug}#organization`,
  agent: (slug: string) => `${absoluteUrl(agentHref(slug))}#person`,
  author: (slug: string) => `${absoluteUrl(authorHref(slug))}#person`,
  developer: (slug: string) => `${absoluteUrl(developerHref(slug))}#organization`,
  project: (slug: string) => `${absoluteUrl(projectHref(slug))}#place`,
};

export function ref(id: string): Ref {
  return { "@id": id };
}

/**
 * Drops empty values all the way down: null, undefined, "", NaN, empty lists and objects, and objects left with
 * nothing but their "@type" (a Place with no name or address says nothing).
 */
export function clean<T>(value: T): T | undefined {
  if (value === null || value === undefined || (typeof value === "number" && !Number.isFinite(value))) {
    return undefined;
  }

  if (typeof value === "string") {
    return (value.trim() === "" ? undefined : value) as T | undefined;
  }

  if (Array.isArray(value)) {
    const items = value.map((item) => clean(item)).filter((item) => item !== undefined);

    return (items.length > 0 ? items : undefined) as T | undefined;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Schema)
      .map(([key, item]) => [key, clean(item)] as const)
      .filter(([, item]) => item !== undefined);
    const keys = entries.map(([key]) => key);

    return (entries.length === 0 || (keys.length === 1 && keys[0] === "@type") ? undefined : Object.fromEntries(entries)) as T | undefined;
  }

  return value;
}

/**
 * One JSON-LD document for a page: its blocks as a single "@graph", cleaned. Blocks pasted in by an admin may carry
 * their own "@context" or "@graph"; both are folded in.
 */
export function schemaGraph(blocks: (Schema | null | undefined | false)[]): Schema {
  const nodes = blocks
    .filter((block): block is Schema => Boolean(block))
    .flatMap((block) => (Array.isArray(block["@graph"]) ? (block["@graph"] as Schema[]) : [block]))
    .map((block) => clean(Object.fromEntries(Object.entries(block).filter(([key]) => key !== "@context"))))
    .filter((node): node is Schema => Boolean(node));

  return { "@context": "https://schema.org", "@graph": nodes };
}

/** Plain text for descriptions: tags stripped, whitespace collapsed, at most `max` characters. */
export function schemaText(html: string | null | undefined, max = 5000): string | undefined {
  const text = (html ?? "")
    .replace(/<(br|\/p|\/li|\/h[1-6])\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) {
    return undefined;
  }

  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** A positive number from an API decimal ("12.50"), or undefined. */
export function schemaNumber(value: string | number | null | undefined): number | undefined {
  const number = typeof value === "number" ? value : Number.parseFloat(value ?? "");

  return Number.isFinite(number) && number > 0 ? number : undefined;
}

/* ---------- Building blocks ---------- */

export function imageObject(url: string | null | undefined, options: { caption?: string | null; width?: number | null; height?: number | null; id?: string } = {}): Schema | null {
  if (!url) {
    return null;
  }

  const full = absoluteUrl(url);

  return {
    "@type": "ImageObject",
    "@id": options.id,
    url: full,
    contentUrl: full,
    caption: options.caption ?? undefined,
    width: options.width ?? undefined,
    height: options.height ?? undefined,
  };
}

/** GeoCoordinates only for a real position: both values present, in range and not the 0,0 placeholder. */
export function geoCoordinates(latitude: string | number | null | undefined, longitude: string | number | null | undefined): Schema | null {
  const lat = typeof latitude === "number" ? latitude : Number.parseFloat(latitude ?? "");
  const lng = typeof longitude === "number" ? longitude : Number.parseFloat(longitude ?? "");

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0)) {
    return null;
  }

  return { "@type": "GeoCoordinates", latitude: Number(lat.toFixed(7)), longitude: Number(lng.toFixed(7)) };
}

export type AddressParts = {
  street?: string | null;
  locality?: string | null;
  region?: string | null;
  postalCode?: string | null;
  /** Two-letter code; only kept when there is something else to go with it. */
  country?: string | null;
};

export function postalAddress(parts: AddressParts): Schema | null {
  if (![parts.street, parts.locality, parts.region, parts.postalCode].some((part) => part?.trim())) {
    return null;
  }

  return {
    "@type": "PostalAddress",
    streetAddress: parts.street ?? undefined,
    addressLocality: parts.locality ?? undefined,
    addressRegion: parts.region ?? undefined,
    postalCode: parts.postalCode ?? undefined,
    addressCountry: parts.country?.toUpperCase() ?? undefined,
  };
}

export type Crumb = { name: string; path: string };

/** The breadcrumb trail of a page, Home first (added when the trail does not start with it), the page itself last. */
export function breadcrumbList(path: string, trail: Crumb[]): Schema {
  const crumbs = trail[0]?.path === "/" ? trail : [{ name: "Home", path: "/" }, ...trail];

  return {
    "@type": "BreadcrumbList",
    "@id": schemaId.breadcrumb(path),
    itemListElement: crumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, name: crumb.name, item: absoluteUrl(crumb.path) })),
  };
}

export type WebPageOptions = {
  /** Canonical path of the page. */
  path: string;
  name: string;
  description?: string | null;
  /** WebPage by default; CollectionPage, ProfilePage, ContactPage, AboutPage, SearchResultsPage, RealEstateListing… */
  type?: string;
  /** The trail after Home; leave out on the home page. */
  breadcrumb?: Crumb[] | false;
  image?: Schema | null;
  mainEntity?: Ref | Schema | null;
  about?: Ref | Schema | (Ref | Schema)[] | null;
  datePublished?: string | null;
  dateModified?: string | null;
  /** Extra properties of the page node. */
  extra?: Schema;
};

/** The page node (linked to the website and its breadcrumb) and its BreadcrumbList. */
export function webPageSchemas(page: WebPageOptions): Schema[] {
  const crumbs = page.breadcrumb ? breadcrumbList(page.path, page.breadcrumb) : null;

  return [
    {
      "@type": page.type ?? "WebPage",
      "@id": schemaId.webPage(page.path),
      url: absoluteUrl(page.path),
      name: page.name,
      description: page.description ?? undefined,
      inLanguage: "en",
      isPartOf: ref(schemaId.website()),
      primaryImageOfPage: page.image ?? undefined,
      breadcrumb: crumbs ? ref(schemaId.breadcrumb(page.path)) : undefined,
      about: page.about ?? undefined,
      mainEntity: page.mainEntity ?? undefined,
      datePublished: page.datePublished ?? undefined,
      dateModified: page.dateModified ?? undefined,
      ...page.extra,
    },
    ...(crumbs ? [crumbs] : []),
  ];
}

export type ListEntry = { url: string; name: string; image?: string | null };

/** The visible items of a list page, in the order shown. */
export function itemListSchema(path: string, items: ListEntry[], name?: string): Schema | null {
  if (items.length === 0) {
    return null;
  }

  return {
    "@type": "ItemList",
    "@id": schemaId.itemList(path),
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, url: absoluteUrl(item.url), name: item.name, image: item.image ?? undefined })),
  };
}

/** A FAQPage for questions and answers that are shown on the page; null when there are none. */
export function faqSchema(path: string, faqs: { question: string; answer: string }[]): Schema | null {
  const items = faqs.filter((faq) => faq.question.trim() && faq.answer.trim());

  if (items.length === 0) {
    return null;
  }

  return {
    "@type": "FAQPage",
    "@id": schemaId.faq(path),
    url: absoluteUrl(path),
    isPartOf: ref(schemaId.website()),
    mainEntity: items.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
  };
}

/**
 * A VideoObject for an embedded YouTube video (its thumbnail URL is known without an API call). Other hosts are left
 * out rather than given a made-up thumbnail. `uploadDate` is when the video was published on this page.
 */
export function videoSchema(url: string | null | undefined, video: { name: string; description?: string | null; uploadDate?: string | null; id?: string }): Schema | null {
  const youtubeId = url ? youtubeIdOf(url) : null;

  if (!youtubeId || !video.uploadDate) {
    return null;
  }

  return {
    "@type": "VideoObject",
    "@id": video.id,
    name: video.name,
    description: video.description || video.name,
    thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
    uploadDate: video.uploadDate,
    contentUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
    embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
  };
}

function youtubeIdOf(url: string): string | null {
  try {
    const link = new URL(url);
    const host = link.hostname.replace(/^(www|m)\./, "");
    const id =
      host === "youtu.be"
        ? link.pathname.slice(1)
        : host === "youtube.com" || host === "youtube-nocookie.com"
          ? (link.searchParams.get("v") ?? link.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]+)/)?.[1])
          : null;

    return id && /^[\w-]{6,20}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** Profile links of an entity, for sameAs: only full http(s) URLs. */
export function sameAsLinks(links: (string | null | undefined)[]): string[] {
  return links.filter((link): link is string => Boolean(link && /^https?:\/\//i.test(link)));
}

/* ---------- Website-wide entities (root layout) ---------- */

const DAYS: Record<string, string> = { Mo: "Monday", Tu: "Tuesday", We: "Wednesday", Th: "Thursday", Fr: "Friday", Sa: "Saturday", Su: "Sunday" };
const DAY_ORDER = Object.keys(DAYS);

/**
 * OpeningHoursSpecification from the admin's "Mo-Fr 10:00-18:00" lines (validated by the API). A line that does not
 * parse is skipped rather than guessed.
 */
export function openingHoursSchema(text: string | null | undefined): Schema[] {
  return (text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim().match(/^([A-Za-z,-]+)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map(([, days, opens, closes]) => {
      const dayOfWeek = days.split(",").flatMap((part) => {
        const [from, to = from] = part.split("-");
        const start = DAY_ORDER.indexOf(from);
        const end = DAY_ORDER.indexOf(to);

        return start < 0 || end < start ? [] : DAY_ORDER.slice(start, end + 1).map((day) => DAYS[day]);
      });

      return { "@type": "OpeningHoursSpecification", dayOfWeek, opens, closes };
    })
    .filter((spec) => spec.dayOfWeek.length > 0);
}

/** The brand's logo: the uploaded one, else the logo shipped with the site. */
export function brandLogoUrl(settings: SiteSettings): string {
  return settings.general.logo_url ?? absoluteUrl("/brand/logo-wide.png");
}

/**
 * The brand (DHA GRW Properties) as an Organization, and as a RealEstateAgent (a LocalBusiness) once the office
 * address is entered in Site Settings → Business details. Built once, in the root layout; pages refer to it by id.
 */
export function organizationSchema(settings: SiteSettings): Schema {
  const { business, contact, general } = settings;
  const name = siteNameOf(settings);
  const address = postalAddress({
    street: business.street_address,
    locality: business.locality,
    region: business.region,
    postalCode: business.postal_code,
    country: business.country_code,
  });
  const social = (Object.keys(settings.social) as SocialNetwork[]).map((network) => settings.social[network]);

  return {
    "@type": address ? "RealEstateAgent" : "Organization",
    "@id": schemaId.organization(),
    name,
    alternateName: name === SEO.siteName ? undefined : SEO.siteName,
    legalName: business.legal_name ?? undefined,
    url: `${siteUrl()}/`,
    description: general.tagline ?? SEO.description,
    logo: imageObject(brandLogoUrl(settings), { id: schemaId.logo(), caption: `${name} logo` }),
    image: ref(schemaId.logo()),
    email: contact.email ?? undefined,
    telephone: contact.phone ?? undefined,
    address,
    geo: address ? geoCoordinates(business.latitude, business.longitude) : null,
    hasMap: business.map_url ?? undefined,
    openingHoursSpecification: address ? openingHoursSchema(business.opening_hours) : undefined,
    foundingDate: business.founding_year ? String(business.founding_year) : undefined,
    contactPoint:
      contact.phone || contact.email
        ? [{ "@type": "ContactPoint", contactType: "customer service", telephone: contact.phone ?? undefined, email: contact.email ?? undefined, areaServed: business.country_code ?? undefined }]
        : undefined,
    sameAs: sameAsLinks(social),
  };
}

/** The website, published by the brand, with its property search. */
export function websiteSchema(settings: SiteSettings): Schema {
  const name = siteNameOf(settings);

  return {
    "@type": "WebSite",
    "@id": schemaId.website(),
    url: `${siteUrl()}/`,
    name,
    alternateName: name === SEO.siteName ? undefined : SEO.siteName,
    description: SEO.description,
    inLanguage: "en",
    publisher: ref(schemaId.organization()),
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteUrl()}/properties-for-sale?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

/** The main menu as SiteNavigationElement items (the same links as the header). */
export function navigationSchema(): Schema {
  return {
    "@type": "ItemList",
    "@id": schemaId.navigation(),
    name: "Main menu",
    itemListElement: MAIN_NAV.map((link, index) => ({ "@type": "SiteNavigationElement", position: index + 1, name: link.label, url: absoluteUrl(link.href) })),
  };
}

/** A reference to the brand, for publisher / provider fields. */
export function brandRef(): Ref {
  return ref(schemaId.organization());
}

/**
 * A list page: a CollectionPage (a SearchResultsPage for a search) whose main entity is the ItemList of what it
 * shows. `path` is the URL as visited, so a filtered copy does not claim the plain page's identity.
 */
export function collectionPageSchemas(page: { path: string; name: string; description?: string | null; breadcrumb: Crumb[]; items: ListEntry[]; search?: boolean }): Schema[] {
  const list = itemListSchema(page.path, page.items, page.name);

  return [
    ...webPageSchemas({
      path: page.path,
      type: page.search ? "SearchResultsPage" : "CollectionPage",
      name: page.name,
      description: page.description,
      breadcrumb: page.breadcrumb,
      mainEntity: list ? ref(schemaId.itemList(page.path)) : null,
    }),
    ...(list ? [list] : []),
  ];
}
