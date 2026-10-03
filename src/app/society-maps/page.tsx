import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, MapIcon, PlusIcon, SearchIcon } from "@/components/icons";
import { SocietyMapCard } from "@/components/society-maps/society-map-card";
import { getSocietyMaps, isSocietyMapCategory } from "@/lib/society-maps";
import { openGraph } from "@/lib/seo";

export const revalidate = 300;

/** "Load more" keeps earlier pages on screen, so page N shows pages 1…N. Capped to keep the render bounded. */
const MAX_LOADED_PAGES = 10;

const TITLE = "DHA Gujranwala Maps";
const DESCRIPTION = "Master plan, sector, block and commercial maps of DHA Gujranwala. View them in full size, zoom in and download.";

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

  return query.size ? `/society-maps?${query}` : "/society-maps";
}

export async function generateMetadata({ searchParams }: PageProps<"/society-maps">): Promise<Metadata> {
  const filters = filtersOf(await searchParams);
  const result = await getSocietyMaps(1, filters);
  const category = result?.filters.categories.find((item) => item.value === filters.category);
  const title = category ? `DHA Gujranwala ${category.label}s` : TITLE;
  const filtered = Boolean(filters.society || filters.search);

  return {
    title,
    description: DESCRIPTION,
    alternates: { canonical: filters.category ? `/society-maps?category=${filters.category}` : "/society-maps" },
    openGraph: await openGraph({ title, description: DESCRIPTION, url: "/society-maps" }),
    // Searches and society filters are thin copies of the list.
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function SocietyMapsPage({ searchParams }: PageProps<"/society-maps">) {
  const params = await searchParams;
  const filters = filtersOf(params);
  const page = pageNumber(params.page);
  const pages = await Promise.all(Array.from({ length: page }, (_, index) => getSocietyMaps(index + 1, filters)));
  const first = pages[0];
  const maps = pages.flatMap((result) => result?.data ?? []);
  const lastPage = pages.at(-1)?.meta.last_page ?? 1;
  const total = first?.meta.total ?? 0;
  const categories = first?.filters.categories ?? [];
  const societies = first?.filters.societies ?? [];
  const isFiltered = Boolean(filters.category || filters.society || filters.search);

  return (
    <div className="smaps-index">
      <section className="smaps-hero">
        <div className="container smaps-hero-inner">
          <div>
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span aria-hidden="true">›</span>
              <span aria-current="page">Society Maps</span>
            </nav>
            <h1>
              DHA Gujranwala <span>Society Maps</span>
            </h1>
            <p>Master plan, sector, block and commercial maps. Open any map in full size, zoom into the detail and download it.</p>
            <form className="smaps-search" action="/society-maps" role="search">
              {filters.category && <input type="hidden" name="category" value={filters.category} />}
              {filters.society && <input type="hidden" name="society" value={filters.society} />}
              <SearchIcon className="icon" />
              <input type="search" name="q" defaultValue={filters.search} placeholder="Search maps, e.g. Sector G" maxLength={100} aria-label="Search maps" />
              <button type="submit" className="btn btn-primary">
                Search
              </button>
            </form>
          </div>

          <Link href="/maps" className="smaps-finder">
            <span className="smaps-finder-icon">
              <MapIcon className="icon" />
            </span>
            <span>
              <strong>Looking for a specific plot?</strong>
              <small>Find any plot number on the live satellite map with the Plot Finder.</small>
            </span>
            <ArrowRightIcon className="icon" />
          </Link>
        </div>
      </section>

      <section className="section" id="maps">
        <div className="container">
          {categories.length > 0 && (
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
              <p>{isFiltered ? "Try another category or search." : "Meanwhile, explore plots on the live Plot Finder."}</p>
              <Link className="btn btn-primary" href={isFiltered ? "/society-maps" : "/maps"}>
                {isFiltered ? "Show all maps" : "Open Plot Finder"}
              </Link>
            </div>
          ) : (
            <>
              {isFiltered && (
                <p className="smaps-count">
                  {total.toLocaleString("en-PK")} map{total === 1 ? "" : "s"} found · <Link href="/society-maps">Clear filters</Link>
                </p>
              )}
              <div className="smap-grid">
                {maps.map((map) => (
                  <SocietyMapCard key={map.id} map={map} />
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
      </section>
    </div>
  );
}
