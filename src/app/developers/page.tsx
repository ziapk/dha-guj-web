import type { Metadata } from "next";
import Link from "next/link";
import { DeveloperCard } from "@/components/developer-card";
import { publicApi } from "@/lib/api";
import { DEVELOPER_TYPE_LABELS, DEVELOPER_TYPES } from "@/lib/developers";
import { openGraph, robots } from "@/lib/seo";
import type { DeveloperType, Paginated, PublicDeveloper } from "@/types/api";

const TITLE = "Developers & construction companies";
const DESCRIPTION = "Browse property developers and construction companies, see their track record and every project they have live right now.";

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

  const developers = await publicApi<Paginated<PublicDeveloper>>("developers", {
    query: { search: q, company_type: type, page },
    revalidate: 120,
  }).catch(() => null);

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
    <div className="container page-section">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span aria-current="page">Developers</span>
      </nav>

      <div className="page-hero" style={{ paddingBlock: "32px 24px" }}>
        <h1>Developers & construction companies</h1>
        <p>The companies building new homes and commercial projects — their background, contact details and every project they have live.</p>
      </div>

      <form className="agency-search" action="/developers" role="search">
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
          <p className="agency-count">
            {total.toLocaleString("en-PK")} compan{total === 1 ? "y" : "ies"}
          </p>
          <div className="agency-grid">
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
    </div>
  );
}
