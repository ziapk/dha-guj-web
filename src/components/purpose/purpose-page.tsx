import type { Metadata } from "next";
import Link from "next/link";
import { BannerSlot } from "@/components/banner-slot";
import { heroStyle } from "@/components/home/hero";
import { FeaturedDealerCard } from "@/components/purpose/featured-dealer-card";
import { PurposeResults } from "@/components/purpose/purpose-results";
import { PurposeSearchBar } from "@/components/purpose/purpose-search-bar";
import { SaveSearchButton } from "@/components/save-search-button";
import { SortSelect } from "@/components/search-controls";
import { ValidationError, publicApi } from "@/lib/api";
import { searchHeading } from "@/lib/property";
import { PURPOSE_PAGES, PURPOSE_PAGE_SIZE, purposeFilters, purposeHref, sectorOptions } from "@/lib/purpose-search";
import { openGraph, robots } from "@/lib/seo";
import type { AgencyProfile, Block, Collection, HomeData, Paginated, PropertyPurpose, PropertyType, PublicProperty, Resource, Sector } from "@/types/api";

type SearchParams = Record<string, string | string[] | undefined>;

const PLACE = "DHA Gujranwala";

/** Filters that make a landing page worth indexing ("Houses for rent"); anything else is a refinement of one. */
const LANDING_FILTERS = ["category", "property_type_id", "sector", "page"];

async function propertyTypesList(): Promise<PropertyType[]> {
  return publicApi<Collection<PropertyType>>("property-types", { revalidate: 3600 })
    .then((response) => response.data)
    .catch(() => []);
}

export async function purposeMetadata(purpose: PropertyPurpose, searchParams: Promise<SearchParams>): Promise<Metadata> {
  const page = PURPOSE_PAGES[purpose];
  const filters = purposeFilters(await searchParams);
  const heading = searchHeading({ ...filters, purpose }, [], await propertyTypesList());
  const title = `${heading}${filters.sector ? ` in ${filters.sector}` : ""} in ${PLACE}`;
  const description = `Browse verified property ${page.phrase} in ${PLACE}: houses, plots and commercial units with photos, prices and direct Call and WhatsApp contact.`;
  const canonical = purposeHref(page.path, Object.fromEntries(Object.entries(filters).filter(([key]) => LANDING_FILTERS.includes(key))));
  const refined = Object.keys(filters).some((key) => !LANDING_FILTERS.includes(key));

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: await openGraph({ title, description, url: canonical }),
    robots: robots(refined ? { index: false, follow: true } : undefined),
  };
}

/** Verified agencies with the most live listings first; the top one is the sidebar spotlight. */
async function spotlightAgency(): Promise<AgencyProfile | null> {
  const agencies = await publicApi<Paginated<AgencyProfile>>("agencies", { query: { per_page: 12 }, revalidate: 300 })
    .then((response) => response.data)
    .catch(() => [] as AgencyProfile[]);

  return [...agencies].sort((a, b) => Number(b.is_verified) - Number(a.is_verified) || (b.listings_count ?? 0) - (a.listings_count ?? 0))[0] ?? null;
}

/**
 * The Buy (/buy) and Rent (/rent) pages: same hero, filters, listing cards and sidebar; only the purpose differs,
 * and it comes from the route, never from the URL, so /rent can only ever show rentals.
 */
export async function PurposeListingPage({ purpose, searchParams }: { purpose: PropertyPurpose; searchParams: Promise<SearchParams> }) {
  const page = PURPOSE_PAGES[purpose];
  const filters = purposeFilters(await searchParams);

  const [propertyTypes, sectors, blocks, home, agency] = await Promise.all([
    propertyTypesList(),
    publicApi<Collection<Sector>>("sectors", { revalidate: 3600 }).then((response) => response.data).catch(() => []),
    publicApi<Collection<Block>>("blocks", { revalidate: 3600 }).then((response) => response.data).catch(() => []),
    publicApi<Resource<HomeData>>("home", { revalidate: 300 }).then((response) => response.data).catch(() => null),
    spotlightAgency(),
  ]);

  let results: Paginated<PublicProperty> | null = null;

  try {
    results = await publicApi<Paginated<PublicProperty>>("properties", { query: { ...filters, purpose, per_page: PURPOSE_PAGE_SIZE }, revalidate: 30 });
  } catch (error) {
    if (!(error instanceof ValidationError)) {
      throw error;
    }
  }

  const heading = searchHeading({ ...filters, purpose }, [], propertyTypes);
  const heroImage = typeof home?.sections?.hero_image_url === "string" ? home.sections.hero_image_url : null;
  const total = results?.meta.total ?? 0;
  const searchKey = JSON.stringify(filters);
  const saveFilters = { ...filters, purpose };

  return (
    <>
      <section className="purpose-hero">
        <div className="purpose-hero-image" style={heroStyle(heroImage)} aria-hidden="true" />
        <div className="container purpose-hero-inner">
          <h1>
            {filters.category === "commercial" ? `${page.label} Commercial Property in` : page.title} <span>{PLACE}</span>
          </h1>
          <PurposeSearchBar key={searchKey} page={page} filters={filters} propertyTypes={propertyTypes} sectors={sectorOptions(sectors, blocks)} />
        </div>
      </section>

      <div className="container purpose-section">
        <div className="purpose-head">
          <div>
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <span>{page.label}</span>
            </nav>
            <h2>{heading}</h2>
            <p>
              {results
                ? `${total.toLocaleString("en-PK")} propert${total === 1 ? "y" : "ies"} ${page.phrase} in ${PLACE}`
                : "Some filters are not valid — try adjusting them."}
            </p>
          </div>
          <div className="search-bar-actions">
            <SaveSearchButton filters={saveFilters} suggestedName={heading} />
            <SortSelect filters={filters} basePath={page.path} />
          </div>
        </div>

        <div className="results-layout purpose-layout">
          <section className="results-list" aria-label={`Properties ${page.phrase}`}>
            <BannerSlot key={`top:${purpose}:${searchKey}`} placement="search_top" />
            {results && results.data.length > 0 ? (
              <PurposeResults key={`${purpose}:${searchKey}`} initial={results} path={page.path} filters={filters} />
            ) : (
              <div className="empty-results">
                <div style={{ fontSize: 44 }}>🔍</div>
                <h2>No properties {page.phrase} match your search</h2>
                <p>Try removing a filter, choosing another sector or widening the price range.</p>
                <Link className="btn btn-primary" href={page.path}>
                  Clear filters
                </Link>
              </div>
            )}
          </section>

          <aside className="results-aside purpose-aside">
            {agency && <FeaturedDealerCard agency={agency} />}
            <BannerSlot key={`side:${purpose}:${searchKey}`} placement="search_sidebar" />
          </aside>
        </div>
      </div>
    </>
  );
}
