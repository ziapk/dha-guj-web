import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { DeveloperCard } from "@/components/developer-card";
import { FeaturedDevelopers } from "@/components/developer/featured-developers";
import { ArrowRightIcon, BuildingIcon, HandshakeIcon, LayersIcon, PinIcon } from "@/components/icons";
import { publicApi } from "@/lib/api";
import { DEVELOPER_TYPE_LABELS, DEVELOPER_TYPES, type DeveloperDirectory } from "@/lib/developers";
import { openGraph, robots } from "@/lib/seo";
import type { DeveloperType, Paginated, PublicDeveloper } from "@/types/api";

const TITLE = "Property developers & builders";
const DESCRIPTION = "Explore real estate developers and construction companies: verified builders, their projects and investment opportunities, all in one place.";

/** Most companies in the featured carousel. */
const FEATURED_LIMIT = 8;

function HeroStat({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <li>
      {icon}
      <span>
        <strong>{value}</strong>
        <small>{label}</small>
      </span>
    </li>
  );
}

function pick(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function pickType(value: string | string[] | undefined): DeveloperType | "" {
  const type = pick(value);

  return (DEVELOPER_TYPES as string[]).includes(type) ? (type as DeveloperType) : "";
}

export async function generateMetadata({ searchParams }: PageProps<"/developers">): Promise<Metadata> {
  const params = await searchParams;
  // Filtered and later result pages are thin copies of the main list, so keep them out of the index.
  const filtered = Object.keys(params).some((key) => ["q", "type", "page"].includes(key));

  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: "/developers" },
    openGraph: await openGraph({ title: TITLE, description: DESCRIPTION, url: "/developers" }),
    robots: robots(filtered ? { index: false, follow: true } : undefined),
  };
}

export default async function DevelopersPage({ searchParams }: PageProps<"/developers">) {
  const params = await searchParams;
  const q = pick(params.q).slice(0, 100);
  const type = pickType(params.type);
  const page = Math.max(1, Number.parseInt(pick(params.page), 10) || 1);

  const filtered = Boolean(q || type || page > 1);
  const [developers, featured] = await Promise.all([
    publicApi<DeveloperDirectory>("developers", { query: { search: q, company_type: type, page }, revalidate: 120 }).catch(() => null),
    // The carousel only belongs on the plain first page, not on a search result.
    filtered
      ? Promise.resolve(null)
      : publicApi<Paginated<PublicDeveloper>>("developers", { query: { featured: 1, per_page: FEATURED_LIMIT }, revalidate: 120 }).catch(() => null),
  ]);
  const summary = developers?.summary;
  const featuredList = featured?.data ?? [];
  const heroImage = featuredList.find((developer) => developer.card_image_url)?.card_image_url ?? developers?.data.find((developer) => developer.card_image_url)?.card_image_url;

  function pageHref(target: number): string {
    const query = new URLSearchParams();

    if (q) {
      query.set("q", q);
    }

    if (type) {
      query.set("type", type);
    }

    if (target > 1) {
      query.set("page", String(target));
    }

    return query.toString() ? `/developers?${query.toString()}` : "/developers";
  }

  const total = developers?.meta.total ?? 0;
  const lastPage = developers?.meta.last_page ?? 1;

  return (
    <div className="container page-section dl-page">
      <section className={`dl-hero${heroImage ? " dl-hero-image" : ""}`}>
        {heroImage && (
          <div className="dl-hero-photo" aria-hidden="true">
            <Image src={heroImage} alt="" fill priority sizes="(max-width: 900px) 100vw, 55vw" style={{ objectFit: "cover" }} />
          </div>
        )}
        <div className="dl-hero-text">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span aria-current="page">Developers</span>
          </nav>
          <h1>
            Property Developers &amp; Builders in <span>DHA Gujranwala</span>
          </h1>
          <p>
            Explore top real estate developers and construction companies in DHA Gujranwala. Find verified builders, their projects, and investment opportunities all in one
            place.
          </p>
          {summary && (
            <ul className="dl-hero-stats">
              <HeroStat icon={<BuildingIcon className="icon" />} value={`${summary.developers.toLocaleString("en-PK")}+`} label="Developers" />
              <HeroStat icon={<LayersIcon className="icon" />} value={`${summary.projects.toLocaleString("en-PK")}+`} label="Projects" />
              {summary.units > 0 && <HeroStat icon={<HandshakeIcon className="icon" />} value={`${summary.units.toLocaleString("en-PK")}+`} label="Units Delivered" />}
              <HeroStat icon={<PinIcon className="icon" />} value="DHA GRW" label="Prime Location" />
            </ul>
          )}
        </div>
      </section>

      {featuredList.length > 0 && (
        <section className="dl-featured-section">
          <div className="dl-head dl-head-center">
            <span className="dl-eyebrow">Featured Developers</span>
            <h2>
              Leading Developers in <span>DHA Gujranwala</span>
            </h2>
            <p>Explore top real estate developers and construction companies behind the most trusted residential, commercial and mixed-use projects in DHA Gujranwala.</p>
            <a href="#all-developers" className="btn btn-outline dl-view-all">
              View All Developers <ArrowRightIcon className="icon" />
            </a>
          </div>
          <div className="projects-panel">
            <FeaturedDevelopers developers={featuredList} />
          </div>
        </section>
      )}

      <section className="dl-section dl-list-section" id="all-developers">
        <div className="dl-list-head">
          <div className="dl-head">
            <span className="dl-eyebrow">Our Developers</span>
            <h2>
              Trusted Property Developers in <span>DHA Gujranwala</span>
            </h2>
            <p>Explore top real estate developers and construction companies in DHA Gujranwala. Find trusted builders, their projects, and investment opportunities.</p>
          </div>
          <form className="agency-search dl-search" action="/developers#all-developers" role="search">
            <input type="search" name="q" defaultValue={q} placeholder="Search by company name" aria-label="Company name" maxLength={100} />
            <select name="type" defaultValue={type} aria-label="Company type">
              <option value="">All companies</option>
              {DEVELOPER_TYPES.map((value) => (
                <option key={value} value={value}>
                  {DEVELOPER_TYPE_LABELS[value]}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>
        </div>

        {!developers || developers.data.length === 0 ? (
          <div className="empty-results">
            <div style={{ fontSize: 44 }}>🏗️</div>
            <h2>No companies found</h2>
            <p>{q || type ? "Try another name or company type." : "Developers and construction companies will appear here soon."}</p>
            {(q || type) && (
              <Link className="btn btn-primary" href="/developers">
                Show all companies
              </Link>
            )}
          </div>
        ) : (
          <>
            {(q || type) && (
              <p className="agency-count">
                {total.toLocaleString("en-PK")} compan{total === 1 ? "y" : "ies"}
              </p>
            )}
            <div className="dl-grid">
              {developers.data.map((developer) => (
                <DeveloperCard key={developer.id} developer={developer} />
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
      </section>
    </div>
  );
}
