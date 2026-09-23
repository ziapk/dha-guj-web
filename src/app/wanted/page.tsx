import type { Metadata } from "next";
import Link from "next/link";
import { KeyIcon, MegaphoneIcon } from "@/components/icons";
import { WantedCard } from "@/components/wanted-card";
import { publicApi } from "@/lib/api";
import { openGraph, robots } from "@/lib/seo";
import { PORTAL_WANTED_PATH, portalUrl } from "@/lib/site";
import type { City, Collection, Paginated, PropertyType, Society, WantedPost } from "@/types/api";

const TITLE = "Buyer requirements: property wanted";
const DESCRIPTION = "Buyers and tenants looking for homes, plots and commercial property. Owners and agencies can find a match and get in touch.";
const FILTER_KEYS = ["purpose", "city_id", "society_id", "property_type_id", "page"] as const;

type Filters = Partial<Record<(typeof FILTER_KEYS)[number], string>>;

function pickFilters(params: Record<string, string | string[] | undefined>): Filters {
  const filters: Filters = {};

  for (const key of FILTER_KEYS) {
    const value = params[key];

    if (typeof value !== "string") {
      continue;
    }

    const trimmed = value.trim();
    const valid = key === "purpose" ? trimmed === "sale" || trimmed === "rent" : /^\d{1,9}$/.test(trimmed) && Number(trimmed) > 0;

    if (valid) {
      filters[key] = trimmed;
    }
  }

  return filters;
}

export async function generateMetadata({ searchParams }: PageProps<"/wanted">): Promise<Metadata> {
  const filters = pickFilters(await searchParams);
  // Filtered and later pages are thin variations of the main list.
  const filtered = Object.keys(filters).length > 0;

  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: "/wanted" },
    openGraph: await openGraph({ title: TITLE, description: DESCRIPTION, url: "/wanted" }),
    robots: robots(filtered ? { index: false, follow: true } : undefined),
  };
}

export default async function WantedPage({ searchParams }: PageProps<"/wanted">) {
  const filters = pickFilters(await searchParams);
  const page = Math.max(1, Number(filters.page ?? 1));

  const [cities, societies, propertyTypes, posts] = await Promise.all([
    publicApi<Collection<City>>("cities", { revalidate: 3600 }).then((response) => response.data).catch(() => []),
    publicApi<Collection<Society>>("societies", { revalidate: 3600 }).then((response) => response.data).catch(() => []),
    publicApi<Collection<PropertyType>>("property-types", { revalidate: 3600 }).then((response) => response.data).catch(() => []),
    publicApi<Paginated<WantedPost>>("wanted-posts", { query: { ...filters, page }, revalidate: 60 }).catch(() => null),
  ]);

  const societiesByCity = cities
    .map((city) => ({ city, societies: societies.filter((society) => society.city_id === city.id && (!filters.city_id || String(city.id) === filters.city_id)) }))
    .filter((group) => group.societies.length > 0);

  const hasFilters = Boolean(filters.purpose || filters.city_id || filters.society_id || filters.property_type_id);
  const total = posts?.meta.total ?? 0;
  const lastPage = posts?.meta.last_page ?? 1;

  function pageHref(target: number): string {
    const query = new URLSearchParams();

    for (const key of ["purpose", "city_id", "society_id", "property_type_id"] as const) {
      if (filters[key]) {
        query.set(key, filters[key] as string);
      }
    }

    if (target > 1) {
      query.set("page", String(target));
    }

    return query.toString() ? `/wanted?${query.toString()}` : "/wanted";
  }

  return (
    <div className="container page-section">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span aria-current="page">Buyer requirements</span>
      </nav>

      <div className="search-header">
        <div>
          <h1>Buyer requirements</h1>
          <p>People looking for property right now. Have a match? Unlock their contact details in Property Admin.</p>
        </div>
        <Link className="btn btn-primary" href="/account/requirements/new">
          Post your requirement
        </Link>
      </div>

      <form className="agency-search wanted-filters" action="/wanted" role="search" aria-label="Filter buyer requirements">
        <select name="purpose" defaultValue={filters.purpose ?? ""} aria-label="Buy or rent">
          <option value="">Buy or rent</option>
          <option value="sale">Buyers</option>
          <option value="rent">Tenants</option>
        </select>
        <select name="city_id" defaultValue={filters.city_id ?? ""} aria-label="City">
          <option value="">All cities</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
        <select name="society_id" defaultValue={filters.society_id ?? ""} aria-label="Society">
          <option value="">All societies</option>
          {societiesByCity.map((group) => (
            <optgroup key={group.city.id} label={group.city.name}>
              {group.societies.map((society) => (
                <option key={society.id} value={society.id}>
                  {society.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <select name="property_type_id" defaultValue={filters.property_type_id ?? ""} aria-label="Property type">
          <option value="">All property types</option>
          {propertyTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary">
          Filter
        </button>
      </form>

      <div className="results-layout">
        <section className="results-list" aria-label="Buyer requirements">
          {!posts ? (
            <div className="empty-results">
              <div style={{ fontSize: 44 }}>📋</div>
              <h2>Buyer requirements are unavailable right now</h2>
              <p>Please try again in a few minutes.</p>
            </div>
          ) : posts.data.length === 0 ? (
            <div className="empty-results">
              <div style={{ fontSize: 44 }}>📋</div>
              <h2>{hasFilters ? "No requirements match these filters" : "No open requirements yet"}</h2>
              <p>{hasFilters ? "Try another city, society or property type." : "Looking for a property? Be the first to post what you need."}</p>
              {hasFilters ? (
                <Link className="btn btn-primary" href="/wanted">
                  Clear filters
                </Link>
              ) : (
                <Link className="btn btn-primary" href="/account/requirements/new">
                  Post your requirement
                </Link>
              )}
            </div>
          ) : (
            <>
              <p className="agency-count">
                {total.toLocaleString("en-PK")} open requirement{total === 1 ? "" : "s"}
                {page > 1 ? ` · page ${page} of ${lastPage}` : ""}
              </p>
              {posts.data.map((post) => (
                <WantedCard key={post.id} post={post} />
              ))}
              {lastPage > 1 && (
                <nav className="simple-pagination" aria-label="Pagination">
                  {page > 1 ? <Link href={pageHref(page - 1)}>← Previous</Link> : <span />}
                  <span>
                    Page {page} of {lastPage}
                  </span>
                  {page < lastPage ? <Link href={pageHref(page + 1)}>Next →</Link> : <span />}
                </nav>
              )}
            </>
          )}
        </section>

        <aside className="results-aside">
          <div className="aside-card tinted">
            <span className="aside-icon">
              <KeyIcon />
            </span>
            <h3>Have a matching property?</h3>
            <p>Contact details stay private here. Unlock a buyer&apos;s name, phone and email in Property Admin and call them directly.</p>
            <a className="btn btn-primary btn-block btn-wrap" href={portalUrl(PORTAL_WANTED_PATH)}>
              Unlock contact details in Property Admin
            </a>
          </div>
          <div className="aside-card">
            <span className="aside-icon">
              <MegaphoneIcon />
            </span>
            <h3>Looking for a property?</h3>
            <p>Tell owners and agencies what you need. Your requirement stays up for 30 days and your contact details are only shared with sellers who unlock them.</p>
            <Link className="btn btn-outline btn-block" href="/account/requirements/new">
              Post your requirement
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
