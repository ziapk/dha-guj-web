import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon, BuildingIcon, CalendarIcon, CameraIcon, ExpandIcon, HomeIcon, LayersIcon, PinIcon, StarIcon, UsersIcon } from "@/components/icons";
import { LISTING_STATUS, ProjectListingCard, projectCoverOf, projectLogoOf, projectSizesOf, projectSummaryOf, projectTypeOf } from "@/components/project-listing-card";
import { SearchSuggest } from "@/components/search-suggest";
import { publicApi } from "@/lib/api";
import { CONSTRUCTION_STATUS_LABELS } from "@/lib/labels";
import { CONSTRUCTION_STATUSES, projectHref, projectLocationOf, projectPhotosOf } from "@/lib/project";
import { openGraph, robots } from "@/lib/seo";
import { portalUrl } from "@/lib/site";
import type { DeveloperDirectory } from "@/lib/developers";
import type { City, Collection, Paginated, PublicProject, Sector, Society } from "@/types/api";

const TITLE = "New projects by developers";
const DESCRIPTION = "Browse new housing projects from developers: unit types, prices, payment plans and brochures. Contact the developer directly.";
const FILTER_KEYS = ["search", "city_id", "society_id", "construction_status", "page"] as const;
const PAGE_SIZE = 12;

function HeroStat({ icon, tone, value, label }: { icon: ReactNode; tone: string; value: number; label: string }) {
  return (
    <li>
      <span className={`pl-stat-icon pl-tone-${tone}`}>{icon}</span>
      <span>
        <strong>{value.toLocaleString("en-PK")}+</strong>
        <small>{label}</small>
      </span>
    </li>
  );
}

/** "Rachana <span>Villas</span>": the last word of a name in the accent colour, as in the design. */
function AccentName({ name }: { name: string }) {
  const at = name.trim().lastIndexOf(" ");

  return at > 0 ? (
    <>
      {name.slice(0, at)} <span>{name.slice(at + 1)}</span>
    </>
  ) : (
    <span>{name}</span>
  );
}

function FeaturedProject({ project }: { project: PublicProject }) {
  const href = projectHref(project.slug);
  const cover = projectCoverOf(project, "medium");
  const logo = projectLogoOf(project);
  const location = project.location || projectLocationOf(project);
  const type = projectTypeOf(project);
  const summary = projectSummaryOf(project);
  const sizes = projectSizesOf(project, " • ");
  const unitCount = project.units?.length ?? 0;
  const photoCount = projectPhotosOf(project).length;
  const facts = [
    { label: "Project Type", value: type, icon: <HomeIcon /> },
    { label: "Unit Types", value: unitCount > 0 ? String(unitCount) : null, icon: <LayersIcon /> },
    { label: "Unit Sizes", value: sizes, icon: <ExpandIcon /> },
    { label: "Status", value: LISTING_STATUS[project.construction_status]?.label ?? null, icon: <CalendarIcon /> },
  ].filter((fact) => fact.value);

  return (
    <section className="pl-featured container" aria-labelledby="pl-featured-title">
      <div className="pl-head">
        <span className="pl-eyebrow">Featured Project</span>
        <h2 id="pl-featured-title">
          <AccentName name={project.name} />
        </h2>
      </div>
      <div className="pl-featured-grid">
        <Link href={href} className="pl-featured-photo" tabIndex={-1} aria-hidden="true">
          {cover ? <Image src={cover} alt="" fill priority sizes="(max-width: 900px) 100vw, 760px" style={{ objectFit: "cover" }} /> : <BuildingIcon className="placeholder-icon" />}
          <span className="pl-featured-chips">
            <span className="pl-chip-featured">
              <StarIcon /> Featured
            </span>
            <span className="pl-chip-light">{LISTING_STATUS[project.construction_status]?.label}</span>
          </span>
          {location && (
            <span className="pl-featured-location">
              <span className="pl-pin">
                <PinIcon />
              </span>
              {location}
            </span>
          )}
          {photoCount > 1 && (
            <span className="pl-featured-count">
              <CameraIcon /> 1 / {photoCount}
            </span>
          )}
        </Link>
        <div className="pl-featured-info">
          <div className="pl-featured-kicker">
            {logo && <Image src={logo} alt="" width={36} height={36} className="pl-featured-logo" />}
            {type && <span className="pl-type">{type}</span>}
          </div>
          <h3>
            <Link href={href}>
              <AccentName name={project.name} />
            </Link>
          </h3>
          {location && (
            <p className="pl-featured-address">
              <PinIcon /> {location}
            </p>
          )}
          {summary && <p className="pl-featured-text">{summary}</p>}
          {facts.length > 0 && (
            <dl className="pl-facts">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <span className="pl-fact-icon">{fact.icon}</span>
                  <span>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </span>
                </div>
              ))}
            </dl>
          )}
          <Link href={href} className="btn btn-primary pl-featured-btn">
            View Project Details <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </section>
  );
}

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
    robots: robots(filtered ? { index: false, follow: true } : undefined),
  };
}

export default async function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  const filters = pickFilters(await searchParams);
  const page = Math.max(1, Number(filters.page ?? 1));
  const hasFilters = Boolean(filters.search || filters.city_id || filters.society_id || filters.construction_status);
  // The featured spotlight and the headline numbers only belong on the plain first page.
  const plain = !hasFilters && page === 1;

  const [cities, societies, projects, allProjects, developers, sectors] = await Promise.all([
    publicApi<Collection<City>>("cities", { revalidate: 3600 }).then((response) => response.data).catch(() => []),
    publicApi<Collection<Society>>("societies", { revalidate: 3600 }).then((response) => response.data).catch(() => []),
    publicApi<Paginated<PublicProject>>("projects", { query: { ...filters, page, per_page: PAGE_SIZE }, revalidate: 60 }).catch(() => null),
    // The unfiltered total for the hero; the plain first page already has it.
    hasFilters ? publicApi<Paginated<PublicProject>>("projects", { query: { per_page: 1 }, revalidate: 300 }).catch(() => null) : Promise.resolve(null),
    publicApi<DeveloperDirectory>("developers", { query: { per_page: 1 }, revalidate: 600 }).catch(() => null),
    publicApi<Collection<Sector>>("sectors", { revalidate: 3600 }).then((response) => response.data).catch(() => []),
  ]);

  const societiesByCity = cities
    .map((city) => ({ city, societies: societies.filter((society) => society.city_id === city.id && (!filters.city_id || String(city.id) === filters.city_id)) }))
    .filter((group) => group.societies.length > 0);

  const total = projects?.meta.total ?? 0;
  const lastPage = projects?.meta.last_page ?? 1;
  const projectTotal = (hasFilters ? allProjects?.meta.total : projects?.meta.total) ?? 0;
  const developerTotal = developers?.summary?.developers ?? developers?.meta.total ?? 0;
  // The API lists featured projects first, so a featured one is always on the plain first page.
  const featured = plain ? (projects?.data.find((project) => project.is_featured) ?? null) : null;

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

    return query.toString() ? `/projects?${query.toString()}#all-projects` : "/projects#all-projects";
  }

  return (
    <div className="pl-page">
      <section className="pl-hero">
        <div className="pl-hero-image" aria-hidden="true" />
        <div className="container pl-hero-inner">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span aria-current="page">Projects</span>
          </nav>
          <span className="pl-eyebrow pl-eyebrow-light">DHA Gujranwala Projects</span>
          <h1>
            Discover the Best Projects in <span>DHA Gujranwala</span>
          </h1>
          <p>Explore verified residential, commercial and investment projects with pricing, payment plans, locations and project details.</p>
          <ul className="pl-hero-stats">
            {projectTotal > 0 && <HeroStat icon={<BuildingIcon />} tone="blue" value={projectTotal} label="Total Projects" />}
            {developerTotal > 0 && <HeroStat icon={<UsersIcon />} tone="green" value={developerTotal} label="Developers" />}
            {sectors.length > 0 && <HeroStat icon={<PinIcon />} tone="amber" value={sectors.length} label="Areas" />}
          </ul>
        </div>
      </section>

      {featured && <FeaturedProject project={featured} />}

      <section className="container pl-list" id="all-projects">
        <div className="pl-list-panel">
          <div className="pl-head">
            <span className="pl-eyebrow">Our Projects</span>
            <h2>
              Explore <span>Investment Opportunities</span>
            </h2>
            <p>Find the right project for your next property investment.</p>
          </div>

          <form className="agency-search wanted-filters pl-filters" action="/projects#all-projects" role="search" aria-label="Filter projects">
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
                <Link className="btn btn-primary" href="/properties-for-sale">
                  Browse properties
                </Link>
              )}
            </div>
          ) : (
            <>
              {(hasFilters || page > 1) && (
                <p className="agency-count">
                  {total.toLocaleString("en-PK")} project{total === 1 ? "" : "s"}
                  {page > 1 ? ` · page ${page} of ${lastPage}` : ""}
                </p>
              )}
              <div className="pl-grid">
                {projects.data.map((project, index) => (
                  <ProjectListingCard key={project.id} project={project} priority={!featured && index < 2} />
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
        </div>
      </section>

      <section className="container section section-tight">
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
