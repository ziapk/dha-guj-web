import type { Metadata } from "next";
import Link from "next/link";
import { BannerSlot } from "@/components/banner-slot";
import { BellIcon, KeyIcon } from "@/components/icons";
import { PropertyCard } from "@/components/property-card";
import { QuickFilters } from "@/components/quick-filters";
import { RecentlyViewed } from "@/components/recently-viewed";
import { SaveSearchButton } from "@/components/save-search-button";
import { KeywordSearch, ResultsPagination, SortSelect } from "@/components/search-controls";
import { ValidationError, publicApi } from "@/lib/api";
import { pickFilters, searchHeading } from "@/lib/property";
import { openGraph, robots } from "@/lib/seo";
import { portalUrl } from "@/lib/site";
import type { City, Collection, Paginated, PropertyType, PublicProperty, Society } from "@/types/api";

/** Filters that make a useful landing page ("Plots for sale in Lahore"); any other filter is a variation of one of these. */
const LANDING_FILTERS = ["purpose", "category", "property_type_id", "city_id", "society_id", "page"] as const;

export async function generateMetadata({ searchParams }: PageProps<"/properties">): Promise<Metadata> {
  const filters = pickFilters(await searchParams);
  const [cities, propertyTypes] = await Promise.all([
    publicApi<Collection<City>>("cities", { revalidate: 3600 }).then((response) => response.data).catch(() => []),
    publicApi<Collection<PropertyType>>("property-types", { revalidate: 3600 }).then((response) => response.data).catch(() => []),
  ]);

  const heading = searchHeading(filters, cities, propertyTypes);
  const title = heading === "Properties" ? "Properties for sale and rent" : heading;
  const description = `Search ${title.charAt(0).toLowerCase()}${title.slice(1)} with filters for city, society, price, area and bedrooms. Contact owners and agencies directly.`;

  const canonicalQuery = new URLSearchParams();

  for (const key of LANDING_FILTERS) {
    if (filters[key] && !(key === "page" && filters[key] === "1")) {
      canonicalQuery.set(key, filters[key]);
    }
  }

  const canonical = canonicalQuery.toString() ? `/properties?${canonicalQuery.toString()}` : "/properties";
  // Keyword, price, area, sort and other refinements create near-duplicate pages; let crawlers follow them without indexing.
  const refined = Object.keys(filters).some((key) => !(LANDING_FILTERS as readonly string[]).includes(key));

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: await openGraph({ title, description, url: canonical }),
    robots: robots(refined ? { index: false, follow: true } : undefined),
  };
}

const PAGE_SIZE = 24;

export default async function PropertiesPage({ searchParams }: PageProps<"/properties">) {
  const filters = pickFilters(await searchParams);

  const [cities, societies, propertyTypes] = await Promise.all([
    publicApi<Collection<City>>("cities", { revalidate: 3600 }).then((response) => response.data),
    publicApi<Collection<Society>>("societies", { revalidate: 3600 }).then((response) => response.data),
    publicApi<Collection<PropertyType>>("property-types", { revalidate: 3600 }).then((response) => response.data),
  ]);

  let results: Paginated<PublicProperty> | null = null;

  try {
    results = await publicApi<Paginated<PublicProperty>>("properties", { query: { ...filters, per_page: PAGE_SIZE }, revalidate: 30 });
  } catch (error) {
    if (!(error instanceof ValidationError)) {
      throw error;
    }
  }

  const heading = searchHeading(filters, cities, propertyTypes);
  const typeLink = (type: PropertyType) => `/properties?${new URLSearchParams({ ...(filters.purpose ? { purpose: filters.purpose } : {}), property_type_id: String(type.id) }).toString()}`;

  return (
    <>
      <div className="search-bar-wrap">
        <div className="container search-bar">
          <KeywordSearch key={filters.q ?? ""} filters={filters} />
          <QuickFilters key={JSON.stringify(filters)} cities={cities} societies={societies} propertyTypes={propertyTypes} filters={filters} />
        </div>
      </div>

      <div className="container page-section">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>{heading}</span>
        </nav>

        <div className="search-header">
          <div>
            <h1>{heading}</h1>
            <p>
              {results
                ? `${results.meta.total.toLocaleString("en-PK")} propert${results.meta.total === 1 ? "y" : "ies"}`
                : "Some filters are not valid — try adjusting them."}
            </p>
          </div>
          <div className="search-bar-actions">
            <SaveSearchButton filters={filters} suggestedName={heading} />
            <SortSelect filters={filters} />
          </div>
        </div>

        <div className="results-layout">
          <section className="results-list" aria-label="Search results">
            <BannerSlot key={`top:${JSON.stringify(filters)}`} placement="search_top" />
            {results && results.data.length > 0 ? (
              <>
                {results.data.map((property, index) => (
                  <PropertyCard key={property.id} property={property} layout="list" priority={index < 2} />
                ))}
                {results.meta.last_page > 1 && (
                  <ResultsPagination filters={filters} current={results.meta.current_page} total={results.meta.total} pageSize={results.meta.per_page} />
                )}
              </>
            ) : (
              <div className="empty-results">
                <div style={{ fontSize: 44 }}>🔍</div>
                <h2>No properties match your search</h2>
                <p>Try removing a filter, widening the price range or choosing another city.</p>
                <Link className="btn btn-primary" href="/properties">
                  Clear filters
                </Link>
              </div>
            )}
          </section>

          <aside className="results-aside">
            <BannerSlot key={`side:${JSON.stringify(filters)}`} placement="search_sidebar" />
            <div className="aside-card tinted">
              <span className="aside-icon">
                <BellIcon />
              </span>
              <h3>Be first to new listings</h3>
              <p>Create an alert for this search and we will email you when matching properties are listed.</p>
              <SaveSearchButton filters={filters} suggestedName={heading} block />
            </div>

            {propertyTypes.length > 0 && (
              <div className="aside-card">
                <h3>Browse by type</h3>
                <ul className="aside-links">
                  {propertyTypes.slice(0, 10).map((type) => (
                    <li key={type.id}>
                      <Link href={typeLink(type)}>{type.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="aside-card">
              <span className="aside-icon">
                <KeyIcon />
              </span>
              <h3>Own a property?</h3>
              <p>List it and reach buyers and tenants searching right now.</p>
              <a className="btn btn-outline btn-block" href={portalUrl("/listings/new")}>
                Post a property
              </a>
            </div>
          </aside>
        </div>
      </div>

      <RecentlyViewed className="section section-tint" />
    </>
  );
}
