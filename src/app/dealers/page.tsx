import type { Metadata } from "next";
import Link from "next/link";
import { AgencyDirectoryCard } from "@/components/agency-directory-card";
import { heroStyle } from "@/components/home/hero";
import { CrownIcon, BuildingIcon, HandshakeIcon, HomeIcon, SearchIcon, UsersIcon } from "@/components/icons";
import { Rail } from "@/components/rail";
import { SearchSuggest } from "@/components/search-suggest";
import { publicApi } from "@/lib/api";
import { PAGE_META } from "@/lib/page-meta";
import { openGraph, robots } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-data";
import type { AgencyDirectoryStats, AgencyProfile, City, Collection, Paginated } from "@/types/api";

const { title: TITLE, description: DESCRIPTION } = PAGE_META.dealers;
const PER_PAGE = 12;
// "Load more" re-renders every page up to the requested one, so keep that bounded.
const MAX_PAGE = 20;

export async function generateMetadata({ searchParams }: PageProps<"/dealers">): Promise<Metadata> {
  const params = await searchParams;
  // Filtered and "load more" pages are copies of the main list, so keep them out of the index.
  const filtered = Object.keys(params).some((key) => ["q", "city_id", "page"].includes(key));

  return {
    title: { absolute: TITLE },
    description: DESCRIPTION,
    alternates: { canonical: "/dealers" },
    openGraph: await openGraph({ title: TITLE, description: DESCRIPTION, url: "/dealers" }),
    robots: robots(filtered ? { index: false, follow: true } : undefined),
  };
}

function pick(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.trim().slice(0, 100) : "";
}

type AgencyPage = Paginated<AgencyProfile> & { meta: { stats?: AgencyDirectoryStats } };

function fetchAgencies(query: Record<string, string | number | undefined>): Promise<AgencyPage | null> {
  return publicApi<AgencyPage>("agencies", { query: { per_page: PER_PAGE, ...query }, revalidate: 120 }).catch(() => null);
}

export default async function AgenciesPage({ searchParams }: PageProps<"/dealers">) {
  const params = await searchParams;
  const q = pick(params.q);
  const cityId = pick(params.city_id);
  const page = Math.min(MAX_PAGE, Math.max(1, Number.parseInt(pick(params.page), 10) || 1));
  const filtered = Boolean(q || cityId);

  // Page 1 also carries the hero totals; the rest are fetched together so "load more" keeps earlier cards on screen.
  const [settings, cities, titanium, ...pages] = await Promise.all([
    getSiteSettings(),
    publicApi<Collection<City>>("cities", { revalidate: 3600 })
      .then((response) => response.data)
      .catch(() => [] as City[]),
    filtered ? null : fetchAgencies({ titanium: 1, per_page: 16 }),
    ...Array.from({ length: page }, (_, index) => fetchAgencies({ q, city_id: cityId, page: index + 1, stats: index === 0 ? 1 : undefined })),
  ]);

  const first = pages[0];
  const agencies = pages.flatMap((result) => result?.data ?? []);
  const total = first?.meta.total ?? 0;
  const lastPage = first?.meta.last_page ?? 1;
  const stats = first?.meta.stats;
  const fallbackWhatsapp = settings.contact.whatsapp ?? settings.contact.phone;

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

    return query.size ? `/dealers?${query.toString()}` : "/dealers";
  }

  const heroStats = stats
    ? [
        { icon: <UsersIcon className="icon" />, value: stats.agencies, label: "Total Dealers", tone: "blue" },
        { icon: <HomeIcon className="icon" />, value: stats.listings, label: "Listed Properties by Dealers", tone: "green" },
        { icon: <HandshakeIcon className="icon" />, value: stats.sold, label: "Sold Properties by Dealers", tone: "amber" },
      ]
    : [];

  return (
    <>
      <section className="dealers-hero">
        <div className="dealers-hero-image" style={heroStyle(null)} aria-hidden="true" />
        <div className="container dealers-hero-body">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">›</span>
            <span aria-current="page">Dealers</span>
          </nav>
          <span className="dealers-hero-rule" aria-hidden="true" />
          <h1>
            Find Authorized <span>DHA Gujranwala</span> Property Dealers
          </h1>
          <p>
            Buy, sell and invest with confidence through our network of registered and authorized DHA Gujranwala dealers. We connect you with verified real
            estate professionals who give transparent guidance on plots, files, houses and commercial properties.
          </p>

          {heroStats.length > 0 && (
            <ul className="dealers-hero-stats">
              {heroStats.map((stat) => (
                <li key={stat.label}>
                  <span className={`dealers-stat-icon is-${stat.tone}`}>{stat.icon}</span>
                  <div>
                    <strong>{stat.value.toLocaleString("en-PK")}+</strong>
                    <small>{stat.label}</small>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <form className="dealers-search" action="/dealers" role="search">
            <SearchSuggest key={q} name="q" defaultValue={q} placeholder="Search by dealer name" aria-label="Dealer name" maxLength={100} groups={["agencies"]} />
            <select name="city_id" defaultValue={cityId} aria-label="City">
              <option value="">All cities</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-primary">
              <SearchIcon className="icon" /> Search
            </button>
          </form>
        </div>
      </section>

      {titanium && titanium.data.length > 0 && (
        <section className="section titanium-section" aria-labelledby="titanium-heading">
          <div className="container">
            <div className="titanium-head">
              <p className="titanium-crown" aria-hidden="true">
                <span />
                <CrownIcon className="icon" />
                <span />
              </p>
              <h2 id="titanium-heading">
                <span>Titanium</span> Dealers
              </h2>
              <p>Our top verified property dealers in DHA Gujranwala with proven experience and trusted services.</p>
            </div>

            <Rail label="Titanium dealers">
              {titanium.data.map((agency) => (
                <AgencyDirectoryCard key={agency.id} agency={agency} fallbackWhatsapp={fallbackWhatsapp} />
              ))}
            </Rail>
          </div>
        </section>
      )}

      <section className="section" id="all-agencies">
        <div className="container">
          <div className="home-head">
            <div className="home-head-text">
              <p className="home-eyebrow">
                <BuildingIcon className="icon" /> {filtered ? "Search results" : "More dealers"}
              </p>
              <h2>
                {filtered ? (
                  <>
                    {total.toLocaleString("en-PK")} <span>agenc{total === 1 ? "y" : "ies"} found</span>
                  </>
                ) : (
                  <>
                    Explore <span>{titanium?.data.length ? "More Dealers" : "All Dealers"}</span>
                  </>
                )}
              </h2>
              <p className="home-head-sub">
                {filtered
                  ? [q && `Name “${q}”`, cityId && cities.find((city) => String(city.id) === cityId)?.name].filter(Boolean).join(" · ")
                  : "Browse our trusted network of property dealers in DHA Gujranwala."}
              </p>
            </div>
            {filtered && (
              <div className="home-head-action">
                <Link className="btn btn-outline" href="/dealers">
                  Clear search
                </Link>
              </div>
            )}
          </div>

          {agencies.length === 0 ? (
            <div className="empty-results">
              <div style={{ fontSize: 44 }} aria-hidden="true">
                🏢
              </div>
              <h2>{filtered ? "No dealers match your search" : "No dealers to show yet"}</h2>
              <p>{filtered ? "Try another name or city." : "Dealers will appear here as they join."}</p>
              {filtered && (
                <Link className="btn btn-primary" href="/dealers">
                  Show all dealers
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="dealer-grid">
                {agencies.map((agency) => (
                  <AgencyDirectoryCard key={agency.id} agency={agency} fallbackWhatsapp={fallbackWhatsapp} />
                ))}
              </div>

              {page < lastPage && page < MAX_PAGE && (
                <div className="dealers-more">
                  <Link className="btn btn-primary dealers-more-btn" href={pageHref(page + 1)} scroll={false}>
                    Load More Dealers
                  </Link>
                  <small>
                    Showing {agencies.length.toLocaleString("en-PK")} of {total.toLocaleString("en-PK")}
                  </small>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
