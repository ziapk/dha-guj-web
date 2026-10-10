import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, MapIcon, PlusIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { SectionIcon } from "@/components/section-icon";
import { SocietyMapCard } from "@/components/society-maps/society-map-card";
import { getMapsPage, MAPS_SLUG } from "@/lib/cms-sections";
import { cmsPageSchemas } from "@/lib/page-schema";
import { PAGE_META } from "@/lib/page-meta";
import { metaText, openGraph } from "@/lib/seo";
import { getSocietyMaps, isSocietyMapCategory } from "@/lib/society-maps";
import type { SectionHeading } from "@/types/api";

export const revalidate = 300;

/** "Load more" keeps earlier pages on screen, so page N shows pages 1…N. Capped to keep the render bounded. */
const MAX_LOADED_PAGES = 10;

const DESCRIPTION = PAGE_META.maps.description;

function pick(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? (value[0] ?? "") : (value ?? "")).trim().slice(0, 100);
}

function pageNumber(value: string | string[] | undefined): number {
  const page = Number.parseInt(pick(value), 10);

  return Number.isInteger(page) && page > 1 ? Math.min(page, MAX_LOADED_PAGES) : 1;
}

function filtersOf(params: Record<string, string | string[] | undefined>) {
  const category = pick(params.category);
  const society = pick(params.society);

  return {
    category: isSocietyMapCategory(category) ? category : undefined,
    society: /^[a-z0-9-]+$/.test(society) ? society : undefined,
    search: pick(params.q) || undefined,
  };
}

function hrefWith(filters: ReturnType<typeof filtersOf>, page = 1): string {
  const query = new URLSearchParams();

  if (filters.category) {
    query.set("category", filters.category);
  }

  if (filters.society) {
    query.set("society", filters.society);
  }

  if (filters.search) {
    query.set("q", filters.search);
  }

  if (page > 1) {
    query.set("page", String(page));
  }

  return query.size ? `/dha-gujranwala-maps?${query}` : "/dha-gujranwala-maps";
}

/** A heading's text, with its accented second part on its own line. */
function HeadingText({ heading, fallback }: { heading: SectionHeading; fallback: [string, string] }) {
  const title = heading.title ?? (heading.highlight ? null : fallback[0]);
  const highlight = heading.highlight ?? (heading.title ? null : fallback[1]);

  return (
    <>
      {title}
      {title && highlight && <br />}
      {highlight && <span>{highlight}</span>}
    </>
  );
}

export async function generateMetadata({ searchParams }: PageProps<"/dha-gujranwala-maps">): Promise<Metadata> {
  const filters = filtersOf(await searchParams);
  const [result, { page, sections }] = await Promise.all([getSocietyMaps(1, filters), getMapsPage()]);
  const category = result?.filters.categories.find((item) => item.value === filters.category);
  // The admin's SEO title is a full title, like the spec's default, so the layout's "| site name" is not added to it.
  const title = category ? `DHA Gujranwala ${category.label}s` : (page?.meta_title ?? PAGE_META.maps.title);
  const description = metaText(page?.meta_description ?? sections.hero.subtitle ?? DESCRIPTION);
  const filtered = Boolean(filters.society || filters.search);
  const image = sections.hero.image_url ?? sections.about.image_url;

  return {
    title: category ? title : { absolute: title },
    description,
    alternates: { canonical: filters.category ? `/dha-gujranwala-maps?category=${filters.category}` : "/dha-gujranwala-maps" },
    openGraph: await openGraph({ title, description, url: "/dha-gujranwala-maps", images: image ? [{ url: image }] : undefined }),
    // Searches and society filters are thin copies of the list.
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function SocietyMapsPage({ searchParams }: PageProps<"/dha-gujranwala-maps">) {
  const params = await searchParams;
  const filters = filtersOf(params);
  const page = pageNumber(params.page);
  const [content, ...pages] = await Promise.all([getMapsPage(), ...Array.from({ length: page }, (_, index) => getSocietyMaps(index + 1, filters))]);
  const { hero, about, features, collection, content_html: article } = content.sections;
  const first = pages[0];
  const maps = pages.flatMap((result) => result?.data ?? []);
  const lastPage = pages.at(-1)?.meta.last_page ?? 1;
  const total = first?.meta.total ?? 0;
  const categories = first?.filters.categories ?? [];
  const societies = first?.filters.societies ?? [];
  const isFiltered = Boolean(filters.category || filters.society || filters.search);
  const hasAbout = Boolean(about.title || about.highlight || about.text || features.length);

  return (
    <div className="smaps-index">
      {content.page && (
        <JsonLd
          data={cmsPageSchemas(content.page, `/${MAPS_SLUG}`, {
            "@type": "CollectionPage",
            name: content.page.meta_title ?? content.page.title,
            description: content.page.meta_description ?? hero.subtitle ?? DESCRIPTION,
          })}
        />
      )}

      <section className={`smaps-hero${hero.image_url ? " has-image" : ""}`}>
        {hero.image_url && <Image src={hero.image_url} alt="" fill priority sizes="100vw" className="smaps-hero-image" />}
        <div className="container smaps-hero-inner">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">›</span>
            <span aria-current="page">Maps</span>
          </nav>
          <p className="smaps-eyebrow">{hero.eyebrow ?? "DHA Gujranwala Maps"}</p>
          <h1>
            <HeadingText heading={hero} fallback={["Explore DHA Gujranwala", "Maps & Master Plan"]} />
          </h1>
          <p className="smaps-hero-text">{hero.subtitle ?? DESCRIPTION}</p>
          <Link href="/plot-finder" className="smaps-hero-link">
            <MapIcon className="icon" /> Looking for a specific plot? Open the Plot Finder <ArrowRightIcon className="icon" />
          </Link>
        </div>
      </section>

      {hasAbout && (
        <section className="section smaps-about">
          <div className={`container smaps-about-inner${about.image_url ? "" : " is-text-only"}`}>
            <div>
              {about.eyebrow && (
                <p className="smaps-eyebrow is-dark">
                  <span className="smaps-eyebrow-rule" aria-hidden="true" />
                  {about.eyebrow}
                </p>
              )}
              {(about.title || about.highlight) && (
                <h2 className="smaps-heading">
                  <HeadingText heading={about} fallback={["", ""]} />
                </h2>
              )}
              {about.text && <p className="smaps-about-text">{about.text}</p>}
              {features.length > 0 && (
                <ul className="smaps-features">
                  {features.map((feature) => (
                    <li key={feature.title}>
                      <span className="smaps-feature-icon">
                        <SectionIcon name={feature.icon} className="icon" />
                      </span>
                      <strong>{feature.title}</strong>
                      {feature.text && <small>{feature.text}</small>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {about.image_url && (
              <div className="smaps-about-image">
                <Image src={about.image_url} alt={about.highlight ?? about.title ?? "DHA Gujranwala master plan"} fill sizes="(max-width: 900px) 100vw, 640px" style={{ objectFit: "cover" }} />
              </div>
            )}
          </div>
        </section>
      )}

      <section className="section smaps-collection" id="maps">
        <div className="container">
          <div className="smaps-collection-panel">
            <div className="smaps-collection-head">
              <p className="smaps-eyebrow is-dark is-centered">
                <span className="smaps-eyebrow-rule" aria-hidden="true" />
                {collection.eyebrow ?? "Map Collection"}
                <span className="smaps-eyebrow-rule" aria-hidden="true" />
              </p>
              <h2 className="smaps-heading is-inline">
                {collection.title ?? (collection.highlight ? null : "Explore Our")} <span>{collection.highlight ?? (collection.title ? null : "Map Collection")}</span>
              </h2>
              <p>{collection.subtitle ?? "Browse detailed maps of different sectors and zones of DHA Gujranwala"}</p>
            </div>

            {categories.length > 1 && (
              <nav className="smaps-filters" aria-label="Map categories">
                <Link href={hrefWith({ ...filters, category: undefined })} className={filters.category ? undefined : "is-active"} aria-current={filters.category ? undefined : "page"}>
                  All maps
                </Link>
                {categories.map((category) => (
                  <Link
                    key={category.value}
                    href={hrefWith({ ...filters, category: category.value })}
                    className={filters.category === category.value ? "is-active" : undefined}
                    aria-current={filters.category === category.value ? "page" : undefined}
                  >
                    {category.label} <small>{category.count}</small>
                  </Link>
                ))}
              </nav>
            )}

            {societies.length > 1 && (
              <nav className="smaps-filters is-secondary" aria-label="Societies">
                <Link href={hrefWith({ ...filters, society: undefined })} className={filters.society ? undefined : "is-active"}>
                  All societies
                </Link>
                {societies.map((society) => (
                  <Link key={society.id} href={hrefWith({ ...filters, society: society.slug })} className={filters.society === society.slug ? "is-active" : undefined}>
                    {society.name}
                  </Link>
                ))}
              </nav>
            )}

            {!first ? (
              <div className="empty-results">
                <div style={{ fontSize: 44 }} aria-hidden="true">
                  🗺️
                </div>
                <h2>Maps are unavailable right now</h2>
                <p>Please try again in a few minutes.</p>
              </div>
            ) : maps.length === 0 ? (
              <div className="empty-results">
                <div style={{ fontSize: 44 }} aria-hidden="true">
                  🗺️
                </div>
                <h2>{isFiltered ? "No maps match" : "Maps are coming soon"}</h2>
                <p>{isFiltered ? "Try another category." : "Meanwhile, explore plots on the live Plot Finder."}</p>
                <Link className="btn btn-primary" href={isFiltered ? "/dha-gujranwala-maps" : "/plot-finder"}>
                  {isFiltered ? "Show all maps" : "Open Plot Finder"}
                </Link>
              </div>
            ) : (
              <>
                {isFiltered && (
                  <p className="smaps-count">
                    {total.toLocaleString("en-PK")} map{total === 1 ? "" : "s"} found · <Link href="/dha-gujranwala-maps">Clear filters</Link>
                  </p>
                )}
                <div className="smap-grid">
                  {maps.map((map) => (
                    <SocietyMapCard key={map.id} map={map} headingLevel="h3" />
                  ))}
                </div>

                {page < lastPage && page < MAX_LOADED_PAGES && (
                  <div className="load-more-row">
                    <Link className="load-more-btn" href={hrefWith(filters, page + 1)} scroll={false}>
                      <span className="load-more-plus" aria-hidden="true">
                        <PlusIcon className="icon" />
                      </span>
                      Load More
                      <ArrowRightIcon className="icon" />
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {article && (
        <section className="section smaps-article-section">
          <div className="container">
            {/* Sanitised by the API before it is stored. */}
            <div className="prose smaps-article" dangerouslySetInnerHTML={{ __html: article }} />
          </div>
        </section>
      )}
    </div>
  );
}
