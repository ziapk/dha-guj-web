import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AgencyLogo } from "@/components/agency-card";
import { BannerSlot } from "@/components/banner-slot";
import { ArrowRightIcon, BriefcaseIcon, HandshakeIcon, HomeIcon, KeyIcon, MailIcon, PhoneIcon, PinIcon, ShieldCheckIcon, WhatsAppIcon } from "@/components/icons";
import { ListingRowCard, type ListingOwner } from "@/components/listing-row-card";
import { agentSocials, getAgent, getAgents } from "@/lib/agents";
import { publicApi } from "@/lib/api";
import { sizedImage } from "@/lib/image";
import { whatsappNumber } from "@/lib/property";
import { jsonLd, metaText, openGraph } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import type { Paginated, PublicProperty } from "@/types/api";
import { getSiteSettings, siteNameOf } from "@/lib/site-data";

export const revalidate = 300;

const LISTINGS_SHOWN = 12;

/** Pre-render the first page of agents; anyone approved later renders on first visit. */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const agents = await getAgents(1, 48);

  return (agents?.data ?? []).map((agent) => ({ slug: agent.slug }));
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export async function generateMetadata({ params }: PageProps<"/agent/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const agent = await getAgent(slug);

  if (!agent) {
    return { title: "Agent not found", robots: { index: false } };
  }

  const title = `${agent.name}${agent.designation ? ` — ${agent.designation}` : ""}`;
  const description = metaText(agent.short_bio ?? agent.specialisation ?? `Contact ${agent.name} about property in DHA Gujranwala.`);
  const url = `/agent/${agent.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: await openGraph({
      title,
      description,
      url,
      type: "profile",
      images: agent.photo_url ? [{ url: agent.photo_url }] : undefined,
    }),
    twitter: { card: agent.photo_url ? "summary" : "summary", title, description },
  };
}

export default async function AgentPage({ params }: PageProps<"/agent/[slug]">) {
  const { slug } = await params;
  const agent = await getAgent(slug);

  if (!agent) {
    notFound();
  }

  const [settings, listings] = await Promise.all([
    getSiteSettings(),
    publicApi<Paginated<PublicProperty>>("properties", { query: { agent: agent.slug, sort: "newest", per_page: LISTINGS_SHOWN }, revalidate: 60 }).catch(() => null),
  ]);
  const siteName = siteNameOf(settings);
  const phone = agent.phone ?? settings.contact.phone;
  const whatsapp = whatsappNumber(agent.whatsapp ?? agent.phone ?? settings.contact.whatsapp);
  const socials = agentSocials(agent);
  const url = `${siteUrl()}/agent/${agent.slug}`;
  const total = listings?.meta.total ?? 0;
  const place = agent.city?.name ?? null;
  const cover = agent.agency?.cover_url ?? null;

  // Listings without their own contact fall back to the agent's agency, or the site itself.
  const owner: ListingOwner = {
    name: agent.agency?.name ?? siteName,
    logo_url: agent.agency?.logo_url ?? null,
    phone,
    whatsapp: agent.whatsapp ?? agent.phone ?? settings.contact.whatsapp,
    is_verified: true,
  };

  const stats = [
    { icon: <HomeIcon />, value: agent.for_sale_count ?? 0, label: "Properties for Sale" },
    { icon: <KeyIcon />, value: agent.for_rent_count ?? 0, label: "Properties for Rent" },
    { icon: <HandshakeIcon />, value: agent.closed_deals_count ?? 0, label: "Closed Deals" },
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: agent.name,
    url,
    image: agent.photo_url ?? undefined,
    jobTitle: agent.designation ?? undefined,
    description: agent.short_bio ?? undefined,
    telephone: phone ?? undefined,
    email: agent.email ?? undefined,
    knowsLanguage: agent.languages ?? undefined,
    areaServed: agent.areas_of_expertise.length > 0 ? agent.areas_of_expertise : undefined,
    worksFor: agent.agency ? { "@type": "Organization", name: agent.agency.name, url: `${siteUrl()}/dealer/${agent.agency.slug}` } : { "@type": "Organization", name: siteName, url: siteUrl() },
    sameAs: socials.map((social) => social.url),
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl() },
      { "@type": "ListItem", position: 2, name: "Agents", item: `${siteUrl()}/agents` },
      { "@type": "ListItem", position: 3, name: agent.name, item: url },
    ],
  };

  return (
    <div className="agent-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />

      <section className={`agent-hero${cover ? " has-cover" : ""}`}>
        {cover && <Image src={sizedImage(cover, "medium")} alt="" fill priority sizes="100vw" className="agent-hero-cover" />}
        <div className="container agent-hero-inner">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/agents">Agents</Link>
            <span>/</span>
            <span aria-current="page">{agent.name}</span>
          </nav>

          <div className="agent-hero-row">
            <div className="agent-hero-photo">
              {agent.photo_url ? (
                <Image src={sizedImage(agent.photo_url, "thumbnail")} alt={agent.name} fill priority sizes="180px" style={{ objectFit: "cover" }} />
              ) : (
                <span aria-hidden="true">{initials(agent.name)}</span>
              )}
              <i className="agent-hero-online" aria-hidden="true" />
            </div>

            <div className="agent-hero-body">
              <span className="agent-hero-badge">
                <ShieldCheckIcon /> Verified Agent
              </span>
              <h1>{agent.name}</h1>
              <p className="agent-hero-kicker">
                {agent.designation ?? "Real Estate Agent"}
                {place && <span>{place}</span>}
              </p>
              {(place || agent.experience_years) && (
                <ul className="agent-hero-meta">
                  {place && (
                    <li>
                      <PinIcon /> {place}
                    </li>
                  )}
                  {agent.experience_years ? (
                    <li>
                      <BriefcaseIcon /> {agent.experience_years}+ Years Experience
                    </li>
                  ) : null}
                </ul>
              )}
            </div>

            <div className="agent-hero-actions">
              {whatsapp && (
                <a className="btn btn-whatsapp" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${agent.name} (opens in a new tab)`}>
                  <WhatsAppIcon /> WhatsApp
                </a>
              )}
              {phone && (
                <a className="btn btn-primary" href={`tel:${phone.replace(/[^\d+]/g, "")}`} aria-label={`Call ${agent.name}`}>
                  <PhoneIcon /> {phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <ul className="agent-stat-bar">
          {stats.map((stat) => (
            <li key={stat.label}>
              <span className="agent-stat-icon">{stat.icon}</span>
              <div>
                <strong>{stat.value.toLocaleString("en-PK")}</strong>
                <small>{stat.label}</small>
              </div>
            </li>
          ))}
        </ul>

        <div className="agent-intro">
          <section className="agent-panel">
            <h2>About {agent.name}</h2>
            {agent.bio_html ? (
              // bio_html is sanitised by the API before it is stored.
              <div className="prose" dangerouslySetInnerHTML={{ __html: agent.bio_html }} />
            ) : (
              <p>{agent.short_bio ?? `${agent.name} is a real estate agent${place ? ` in ${place}` : ""}. Get in touch about buying, selling or renting property.`}</p>
            )}
            {(agent.specialisation || agent.languages) && (
              <dl className="agent-panel-facts">
                {agent.specialisation && (
                  <div>
                    <dt>Specialisation</dt>
                    <dd>{agent.specialisation}</dd>
                  </div>
                )}
                {agent.languages && (
                  <div>
                    <dt>Languages</dt>
                    <dd>{agent.languages}</dd>
                  </div>
                )}
              </dl>
            )}
            {agent.areas_of_expertise.length > 0 && (
              <ul className="chip-list">
                {agent.areas_of_expertise.map((area) => (
                  <li key={area} className="chip">
                    {area}
                  </li>
                ))}
              </ul>
            )}
            {socials.length > 0 && (
              <ul className="agent-panel-socials">
                {socials.map((social) => (
                  <li key={social.key}>
                    <a href={social.url} target="_blank" rel="noopener noreferrer">
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside className="agent-panel">
            {agent.agency ? (
              <>
                <h2>Dealer</h2>
                <div className="agent-agency">
                  <AgencyLogo name={agent.agency.name} logoUrl={agent.agency.logo_url ?? null} size={84} />
                  <div>
                    <strong>{agent.agency.name}</strong>
                    <span>Property Dealer</span>
                    <Link href={`/dealer/${agent.agency.slug}`} className="agent-agency-link">
                      View Dealer Profile <ArrowRightIcon />
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2>Contact</h2>
                <ul className="agent-contact-list">
                  {phone && (
                    <li>
                      <PhoneIcon /> <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a>
                    </li>
                  )}
                  {agent.email && (
                    <li>
                      <MailIcon /> <a href={`mailto:${agent.email}`}>{agent.email}</a>
                    </li>
                  )}
                  {place && (
                    <li>
                      <PinIcon /> {place}
                    </li>
                  )}
                </ul>
              </>
            )}
          </aside>
        </div>

        <div className="agent-listings">
          <div>
            <h2 className="agent-listings-title">
              Listings by {agent.name} <span>{total.toLocaleString("en-PK")}</span>
            </h2>
            {!listings || listings.data.length === 0 ? (
              <div className="empty-results">
                <div style={{ fontSize: 44 }}>🏠</div>
                <h2>No live listings right now</h2>
                <p>Contact {agent.name} directly about what you are looking for.</p>
              </div>
            ) : (
              <>
                <div className="listing-row-list">
                  {listings.data.map((property) => (
                    <ListingRowCard key={property.id} property={property} owner={owner} />
                  ))}
                </div>
                {total > LISTINGS_SHOWN && (
                  <div className="listing-row-more">
                    <Link className="btn btn-outline" href={`/properties?agent=${encodeURIComponent(agent.slug)}&sort=newest`}>
                      View all {total.toLocaleString("en-PK")} properties
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="agent-listings-aside">
            <BannerSlot key={agent.slug} placement="listing_sidebar" limit={2} />
          </div>
        </div>
      </div>
    </div>
  );
}
