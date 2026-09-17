import type { Metadata } from "next";
import Link from "next/link";
import { BuildingIcon } from "@/components/icons";
import { ProjectCard } from "@/components/project-card";
import { SearchSuggest } from "@/components/search-suggest";
import { publicApi } from "@/lib/api";
import { CONSTRUCTION_STATUS_LABELS } from "@/lib/labels";
import { CONSTRUCTION_STATUSES } from "@/lib/project";
import { openGraph } from "@/lib/seo";
import { portalUrl } from "@/lib/site";
import type { City, Collection, Paginated, PublicProject, Society } from "@/types/api";

const TITLE = "New projects by developers";
const DESCRIPTION = "Browse new housing projects from developers: unit types, prices, payment plans and brochures. Contact the developer directly.";
const FILTER_KEYS = ["search", "city_id", "society_id", "construction_status", "page"] as const;
const PAGE_SIZE = 12;

type Filters = Partial<Record<(typeof FILTER_KEYS)[number], string>>;

function pickFilters(params: Record<string, string | string[] | undefined>): Filters {
  const filters: Filters = {};

  for (const key of FILTER_KEYS) {
    const value = params[key];

    if (typeof value !== "string") {
      continue;
    }

    const trimmed = value.trim();
    const valid =
      key === "search"
        ? trimmed !== "" && trimmed.length <= 100
        : key === "construction_status"
          ? (CONSTRUCTION_STATUSES as readonly string[]).includes(trimmed)
          : /^\d{1,9}$/.test(trimmed) && Number(trimmed) > 0;

    if (valid) {
      filters[key] = trimmed;
    }
  }

  return filters;
}

export async function generateMetadata({ searchParams }: PageProps<"/projects">): Promise<Metadata> {
  const filters = pickFilters(await searchParams);
  // Filtered and later pages are thin variations of the main list.
  const filtered = Object.keys(filters).length > 0;

  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: "/projects" },
    openGraph: await openGraph({ title: TITLE, description: DESCRIPTION, url: "/projects" }),
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  const filters = pickFilters(await searchParams);
  const page = Math.max(1, Number(filters.page ?? 1));

  const [cities, societies, projects] = await Promise.all([
    publicApi<Collection<City>>("cities", { revalidate: 3600 }).then((response) => response.data).catch(() => []),
    publicApi<Collection<Society>>("societies", { revalidate: 3600 }).then((response) => response.data).catch(() => []),
    publicApi<Paginated<PublicProject>>("projects", { query: { ...filters, page, per_page: PAGE_SIZE }, revalidate: 60 }).catch(() => null),
  ]);

  const societiesByCity = cities
    .map((city) => ({ city, societies: societies.filter((society) => society.city_id === city.id && (!filters.city_id || String(city.id) === filters.city_id)) }))
    .filter((group) => group.societies.length > 0);

  const hasFilters = Boolean(filters.search || filters.city_id || filters.society_id || filters.construction_status);
  const total = projects?.meta.total ?? 0;
  const lastPage = projects?.meta.last_page ?? 1;

  function pageHref(target: number): string {
    const query = new URLSearchParams();

    for (const key of ["search", "city_id", "society_id", "construction_status"] as const) {
      if (filters[key]) {
        query.set(key, filters[key] as string);
      }
    }

    if (target > 1) {
      query.set("page", String(target));
    }

    return query.toString() ? `/projects?${query.toString()}` : "/projects";
  }

  return (
    <div className="container page-section">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span aria-current="page">New projects</span>
      </nav>

      <div className="search-header">
        <div>
          <h1>New projects</h1>
          <p>Housing projects from developers, with unit types, prices and payment plans in one place.</p>
        </div>
      </div>

      <form className="agency-search wanted-filters" action="/projects" role="search" aria-label="Filter projects">
        <SearchSuggest key={filters.search ?? ""} name="search" defaultValue={filters.search ?? ""} placeholder="Project or developer name" aria-label="Project or developer name" maxLength={100} groups={["projects"]} />
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
        <select name="construction_status" defaultValue={filters.construction_status ?? ""} aria-label="Construction status">
          <option value="">Any construction status</option>
          {CONSTRUCTION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {CONSTRUCTION_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary">
          Filter
        </button>
      </form>

      {!projects ? (
        <div className="empty-results">
          <div style={{ fontSize: 44 }}>🏗️</div>
          <h2>Projects are unavailable right now</h2>
          <p>Please try again in a few minutes.</p>
        </div>
      ) : projects.data.length === 0 ? (
        <div className="empty-results">
          <div style={{ fontSize: 44 }}>🏗️</div>
          <h2>{hasFilters ? "No projects match these filters" : "No projects listed yet"}</h2>
          <p>{hasFilters ? "Try another name, city, society or construction status." : "New projects from developers will appear here as they go live."}</p>
          {hasFilters ? (
            <Link className="btn btn-primary" href="/projects">
              Clear filters
            </Link>
          ) : (
            <Link className="btn btn-primary" href="/properties">
              Browse properties
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="agency-count">
            {total.toLocaleString("en-PK")} project{total === 1 ? "" : "s"}
            {page > 1 ? ` · page ${page} of ${lastPage}` : ""}
          </p>
          <div className="property-grid">
            {projects.data.map((project, index) => (
              <ProjectCard key={project.id} project={project} priority={index < 3} />
            ))}
          </div>
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

      <section className="section section-tight" style={{ paddingBottom: 0 }}>
        <div className="sell-banner">
          <span className="sell-banner-icon">
            <BuildingIcon className="icon-lg" />
          </span>
          <div className="sell-banner-body">
            <h2>Are you a developer?</h2>
            <p>List your project with its unit types and payment plans, and get buyer inquiries straight to your Leads inbox.</p>
          </div>
          <div className="sell-banner-actions">
            <a className="btn btn-primary" href={portalUrl("/register")}>
              List your project
            </a>
            <Link className="btn btn-outline" href="/pricing">
              See plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
