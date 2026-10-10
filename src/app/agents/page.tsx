import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AgentProfileCard } from "@/components/agent-profile-card";
import { SectionHeading } from "@/components/home/section-heading";
import { initials } from "@/components/home/agent-card";
import { BuildingIcon, SearchIcon, StarIcon, UserIcon, UsersIcon } from "@/components/icons";
import { Rail } from "@/components/rail";
import { getAgents } from "@/lib/agents";
import { sizedImage } from "@/lib/image";
import { PAGE_META } from "@/lib/page-meta";
import { openGraph, robots } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-data";

export const revalidate = 300;

const { title: TITLE, description: DESCRIPTION } = PAGE_META.agents;

function pick(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? (value[0] ?? "") : (value ?? "")).trim().slice(0, 100);
}

function pageNumber(value: string | string[] | undefined): number {
  const page = Number.parseInt(pick(value), 10);

  return Number.isInteger(page) && page > 1 ? page : 1;
}

export async function generateMetadata({ searchParams }: PageProps<"/agents">): Promise<Metadata> {
  const params = await searchParams;
  const page = pageNumber(params.page);
  const title = page > 1 ? `${TITLE} — page ${page}` : TITLE;
  // Search results are thin copies of the main list, so keep them out of the index.
  const filtered = Boolean(pick(params.name) || pick(params.agency));

  return {
    title: { absolute: title },
    description: DESCRIPTION,
    alternates: { canonical: page > 1 ? `/agents?page=${page}` : "/agents" },
    openGraph: await openGraph({ title, description: DESCRIPTION, url: "/agents" }),
    robots: robots(filtered ? { index: false, follow: true } : undefined),
  };
}

export default async function AgentsPage({ searchParams }: PageProps<"/agents">) {
  const params = await searchParams;
  const name = pick(params.name);
  const agency = pick(params.agency);
  const page = pageNumber(params.page);
  const filtered = Boolean(name || agency);

  // Superstars lead the first page only; later pages are just more of the full list.
  const [settings, superstars, agents] = await Promise.all([
    getSiteSettings(),
    page === 1 ? getAgents(1, 12, { name, agency, superstar: true }) : null,
    getAgents(page, 24, { name, agency }),
  ]);

  const lastPage = agents?.meta.last_page ?? 1;
  const total = agents?.meta.total ?? 0;
  const faces = (superstars?.data.length ? superstars.data : (agents?.data ?? [])).slice(0, 4);
  const contact = { fallbackPhone: settings.contact.phone, fallbackWhatsapp: settings.contact.whatsapp };

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

    return query.size ? `/agents?${query.toString()}#all-agents` : "/agents#all-agents";
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
                <input type="search" name="name" defaultValue={name} placeholder="Search agent name…" maxLength={100} />
              </span>
            </label>
            <label className="agents-search-field">
              <BuildingIcon className="icon" />
              <span>
                <small>Dealer Name</small>
                <input type="search" name="agency" defaultValue={agency} placeholder="Search agency name…" maxLength={100} />
              </span>
            </label>
            <button type="submit" className="btn btn-primary">
              <SearchIcon className="icon" /> Search Agents
            </button>
          </form>
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

            <Rail label="Superstar agents">
              {superstars.data.map((agent) => (
                <AgentProfileCard key={agent.id} agent={agent} {...contact} />
              ))}
            </Rail>
          </div>
        </section>
      )}

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

          {!agents || agents.data.length === 0 ? (
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
                {agents.data.map((agent) => (
                  <AgentProfileCard key={agent.id} agent={agent} {...contact} />
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
    </>
  );
}
