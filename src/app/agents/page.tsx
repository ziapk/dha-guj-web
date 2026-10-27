import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AgentProfileCard } from "@/components/agent-profile-card";
import { BannerSlot } from "@/components/banner-slot";
import { SectionHeading } from "@/components/home/section-heading";
import { initials } from "@/components/home/agent-card";
import { BuildingIcon, HomeIcon, ResetIcon, SearchIcon, ShieldCheckIcon, StarIcon, UserIcon, UsersIcon } from "@/components/icons";
import { Rail } from "@/components/rail";
import { getAgents } from "@/lib/agents";
import { publicApi } from "@/lib/api";
import { sizedImage } from "@/lib/image";
import { PAGE_META } from "@/lib/page-meta";
import { openGraph, queryRobots } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-data";
import type { Paginated } from "@/types/api";

export const revalidate = 300;

const { title: TITLE, description: DESCRIPTION } = PAGE_META.agents;
const PER_PAGE = 24;
// "Load more" re-renders every page up to the requested one, so keep that bounded.
const MAX_PAGE = 20;

function pick(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? (value[0] ?? "") : (value ?? "")).trim().slice(0, 100);
}

function pageNumber(value: string | string[] | undefined): number {
  const page = Number.parseInt(pick(value), 10);

  return Number.isInteger(page) && page > 1 ? Math.min(page, MAX_PAGE) : 1;
}

export async function generateMetadata({ searchParams }: PageProps<"/agents">): Promise<Metadata> {
  const params = await searchParams;

  return {
    title: { absolute: TITLE },
    description: DESCRIPTION,
    alternates: { canonical: "/agents" },
    openGraph: await openGraph({ title: TITLE, description: DESCRIPTION, url: "/agents" }),
    // Search results and "load more" pages are copies of the main list, so keep them out of the index.
    robots: queryRobots(params),
  };
}

/** Directory-wide totals for the stats strip: unfiltered agents, live listings and agencies. */
async function directoryCounts(): Promise<{ agents: number | null; properties: number | null; agencies: number | null }> {
  const total = (path: string) =>
    publicApi<Paginated<unknown>>(path, { query: { per_page: 1 }, revalidate: 3600 })
      .then((response) => response.meta.total)
      .catch(() => null);
  const [agents, properties, agencies] = await Promise.all([total("agents"), total("properties"), total("agencies")]);

  return { agents, properties, agencies };
}

export default async function AgentsPage({ searchParams }: PageProps<"/agents">) {
  const params = await searchParams;
  const name = pick(params.name);
  const agency = pick(params.agency);
  const page = pageNumber(params.page);
  const filtered = Boolean(name || agency);

  // Every page up to the requested one is fetched together, so "load more" keeps earlier cards on screen.
  const [settings, superstars, counts, ...pages] = await Promise.all([
    getSiteSettings(),
    getAgents(1, 12, { name, agency, superstar: true }),
    directoryCounts(),
    ...Array.from({ length: page }, (_, index) => getAgents(index + 1, PER_PAGE, { name, agency })),
  ]);

  const first = pages[0];
  const agents = pages.flatMap((result) => result?.data ?? []);
  const lastPage = first?.meta.last_page ?? 1;
  const total = first?.meta.total ?? 0;
  const faces = (superstars?.data.length ? superstars.data : agents).slice(0, 4);
  const contact = { fallbackPhone: settings.contact.phone, fallbackWhatsapp: settings.contact.whatsapp };

  /** The strip under the search box on phones; a count the API could not give is left out. */
  const highlights = [
    { icon: <UsersIcon className="icon" />, value: counts.agents, label: "Verified Agents" },
    { icon: <HomeIcon className="icon" />, value: counts.properties, label: "Properties" },
    { icon: <StarIcon className="icon" />, value: counts.agencies, label: "Agencies" },
  ].filter((item): item is { icon: React.JSX.Element; value: number; label: string } => typeof item.value === "number" && item.value > 0);

  function pageHref(target: number): string {
    const query = new URLSearchParams();

    if (name) {
      query.set("name", name);
    }

    if (agency) {
      query.set("agency", agency);
    }

    if (target > 1) {
      query.set("page", String(target));
    }

    return query.size ? `/agents?${query.toString()}` : "/agents";
  }

  return (
    <>
      <section className="agents-hero">
        <div className="container agents-hero-inner">
          <div className="agents-hero-text">
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span aria-hidden="true">›</span>
              <span aria-current="page">Agents</span>
            </nav>
            <p className="agents-hero-eyebrow">Trusted &amp; Verified Agents</p>
            <h1>
              Find Trusted Real Estate <span>Agents in DHA Gujranwala</span>
            </h1>
            <p>Connect with verified and experienced real estate agents in DHA Gujranwala. Find the right agent to buy, sell or rent property with confidence.</p>
          </div>

          {faces.length > 0 && (
            <div className="agents-hero-faces" aria-hidden="true">
              {faces.map((agent) => (
                <span key={agent.id} className="agents-hero-face">
                  {agent.photo_url ? <Image src={sizedImage(agent.photo_url, "thumbnail")} alt="" fill sizes="120px" style={{ objectFit: "cover" }} /> : initials(agent.name)}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="container">
          <form className="agents-search" action="/agents" role="search">
            <label className="agents-search-field">
              <UserIcon className="icon" />
              <span>
                <small>Agent Name</small>
                <input type="search" name="name" defaultValue={name} placeholder="Agent name…" maxLength={100} />
              </span>
            </label>
            <label className="agents-search-field">
              <BuildingIcon className="icon" />
              <span>
                <small>Dealer Name</small>
                <input type="search" name="agency" defaultValue={agency} placeholder="Agency name…" maxLength={100} />
              </span>
            </label>
            <button type="submit" className="btn btn-primary">
              <SearchIcon className="icon" /> Search Agents
            </button>
          </form>

          {highlights.length > 0 && (
            <ul className="agents-highlights">
              {highlights.map((item) => (
                <li key={item.label}>
                  {item.icon}
                  <span>
                    <strong>{item.value.toLocaleString("en-PK")}+</strong>
                    <small>{item.label}</small>
                  </span>
                </li>
              ))}
              <li>
                <ShieldCheckIcon className="icon" />
                <span>
                  <strong>100%</strong>
                  <small>Verified</small>
                </span>
              </li>
            </ul>
          )}
        </div>
      </section>

      {superstars && superstars.data.length > 0 && (
        <section className="section agents-superstars" aria-labelledby="superstars-heading">
          <div className="container">
            <div className="home-head">
              <div className="home-head-text">
                <p className="home-eyebrow superstar-eyebrow">
                  <StarIcon className="icon" /> Superstar agents
                </p>
                <h2 id="superstars-heading">
                  Meet Our <span>Superstar Agents</span>
                </h2>
                <p className="home-head-sub">Top performing and trusted agents helping you find the best properties in DHA Gujranwala.</p>
              </div>
            </div>

            <Rail label="Superstar agents" dots>
              {superstars.data.map((agent) => (
                <AgentProfileCard key={agent.id} agent={agent} {...contact} />
              ))}
            </Rail>
          </div>
        </section>
      )}

      <div className="container">
        <BannerSlot placement="agents_top" className="banner-page-top" />
      </div>

      <section className="section" id="all-agents">
        <div className="container">
          {filtered ? (
            <div className="home-head">
              <div className="home-head-text">
                <p className="home-eyebrow">
                  <UsersIcon className="icon" /> Search results
                </p>
                <h2>
                  {total.toLocaleString("en-PK")} <span>agent{total === 1 ? "" : "s"} found</span>
                </h2>
                <p className="home-head-sub">
                  {[name && `Name “${name}”`, agency && `Agency “${agency}”`].filter(Boolean).join(" · ")}
                </p>
              </div>
              <div className="home-head-action">
                <Link className="btn btn-outline" href="/agents">
                  Clear search
                </Link>
              </div>
            </div>
          ) : (
            <SectionHeading
              eyebrow="Our agents"
              title="Our"
              highlight="Professional Agents"
              subtitle="Explore our experienced real estate agents, committed to helping you find the right property in DHA Gujranwala."
            />
          )}

          {agents.length === 0 ? (
            <div className="empty-results">
              <div style={{ fontSize: 44 }} aria-hidden="true">
                🔍
              </div>
              <h2>{filtered ? "No agents match your search" : "No agents to show yet"}</h2>
              <p>{filtered ? "Try a shorter name, or search by dealer instead." : "Check back soon, or browse our dealers."}</p>
              <Link className="btn btn-primary" href={filtered ? "/agents" : "/dealers"}>
                {filtered ? "Show all agents" : "View dealers"}
              </Link>
            </div>
          ) : (
            <>
              <div className="agent-pro-grid">
                {agents.map((agent) => (
                  <AgentProfileCard key={agent.id} agent={agent} {...contact} />
                ))}
              </div>

              {page < lastPage && page < MAX_PAGE && (
                <div className="dealers-more agents-more">
                  <Link className="btn btn-primary dealers-more-btn" href={pageHref(page + 1)} scroll={false}>
                    <ResetIcon className="icon" /> Load More Agents
                  </Link>
                  <small>
                    Showing {agents.length.toLocaleString("en-PK")} of {total.toLocaleString("en-PK")}
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
