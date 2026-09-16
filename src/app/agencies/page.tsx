import type { Metadata } from "next";
import Link from "next/link";
import { AgencyCard } from "@/components/agency-card";
import { publicApi } from "@/lib/api";
import { openGraph } from "@/lib/seo";
import type { AgencyProfile, City, Collection, Paginated } from "@/types/api";

const TITLE = "Real estate agencies";
const DESCRIPTION = "Find real estate agencies, meet their agents and browse every property they have for sale or rent.";

export async function generateMetadata({ searchParams }: PageProps<"/agencies">): Promise<Metadata> {
  const params = await searchParams;
  // Filtered and later result pages are thin copies of the main list, so keep them out of the index.
  const filtered = Object.keys(params).some((key) => ["q", "city_id", "page"].includes(key));

  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: "/agencies" },
    openGraph: await openGraph({ title: TITLE, description: DESCRIPTION, url: "/agencies" }),
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

function pick(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export default async function AgenciesPage({ searchParams }: PageProps<"/agencies">) {
  const params = await searchParams;
  const q = pick(params.q);
  const cityId = pick(params.city_id);
  const page = Math.max(1, Number.parseInt(pick(params.page), 10) || 1);

  const [cities, agencies] = await Promise.all([
    publicApi<Collection<City>>("cities", { revalidate: 3600 })
      .then((response) => response.data)
      .catch(() => []),
    publicApi<Paginated<AgencyProfile>>("agencies", { query: { q, city_id: cityId, page }, revalidate: 120 }).catch(() => null),
  ]);

  function pageHref(target: number): string {
    const query = new URLSearchParams();

    if (q) {
      query.set("q", q);
    }

    if (cityId) {
      query.set("city_id", cityId);
    }

    if (target > 1) {
      query.set("page", String(target));
    }

    return query.toString() ? `/agencies?${query.toString()}` : "/agencies";
  }

  const total = agencies?.meta.total ?? 0;
  const lastPage = agencies?.meta.last_page ?? 1;

  return (
    <div className="container page-section">
      <div className="page-hero" style={{ paddingBlock: "32px 24px" }}>
        <h1>Real estate agencies</h1>
        <p>Meet the agencies behind the listings, see their agents and every property they have live right now.</p>
      </div>

      <form className="agency-search" action="/agencies" role="search">
        <input type="search" name="q" defaultValue={q} placeholder="Search by agency name" aria-label="Agency name" maxLength={100} />
        <select name="city_id" defaultValue={cityId} aria-label="City">
          <option value="">All cities</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </form>

      {!agencies || agencies.data.length === 0 ? (
        <div className="empty-results">
          <div style={{ fontSize: 44 }}>🏢</div>
          <h2>No agencies found</h2>
          <p>{q || cityId ? "Try another name or city." : "Agencies will appear here as they join."}</p>
          {(q || cityId) && (
            <Link className="btn btn-primary" href="/agencies">
              Show all agencies
            </Link>
          )}
        </div>
      ) : (
        <>
          <p className="agency-count">
            {total.toLocaleString("en-PK")} agenc{total === 1 ? "y" : "ies"}
          </p>
          <div className="agency-grid">
            {agencies.data.map((agency) => (
              <AgencyCard key={agency.id} agency={agency} />
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
