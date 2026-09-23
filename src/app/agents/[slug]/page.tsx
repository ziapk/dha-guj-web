import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BriefcaseIcon, HomeIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "@/components/icons";
import { agentSocials, getAgent, getAgents } from "@/lib/agents";
import { whatsappNumber } from "@/lib/property";
import { jsonLd, metaText, openGraph } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import { getSiteSettings, siteNameOf } from "@/lib/site-data";

export const revalidate = 300;

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

export async function generateMetadata({ params }: PageProps<"/agents/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const agent = await getAgent(slug);

  if (!agent) {
    return { title: "Agent not found", robots: { index: false } };
  }

  const title = `${agent.name}${agent.designation ? ` — ${agent.designation}` : ""}`;
  const description = metaText(agent.short_bio ?? agent.specialisation ?? `Contact ${agent.name} about property in DHA Gujranwala.`);
  const url = `/agents/${agent.slug}`;

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

export default async function AgentPage({ params }: PageProps<"/agents/[slug]">) {
  const { slug } = await params;
  const agent = await getAgent(slug);

  if (!agent) {
    notFound();
  }

  const settings = await getSiteSettings();
  const siteName = siteNameOf(settings);
  const phone = agent.phone ?? settings.contact.phone;
  const whatsapp = whatsappNumber(agent.whatsapp ?? settings.contact.whatsapp);
  const socials = agentSocials(agent);
  const url = `${siteUrl()}/agents/${agent.slug}`;

  const facts = [
    { label: "Designation", value: agent.designation },
    { label: "Experience", value: agent.experience_years ? `${agent.experience_years} years` : null },
    { label: "Specialisation", value: agent.specialisation },
    { label: "City", value: agent.city?.name },
    { label: "Languages", value: agent.languages },
    { label: "Live listings", value: agent.listings_count ?? null },
  ].filter((fact) => fact.value !== null && fact.value !== undefined && fact.value !== "");

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
    worksFor: agent.agency ? { "@type": "Organization", name: agent.agency.name, url: `${siteUrl()}/agencies/${agent.agency.slug}` } : { "@type": "Organization", name: siteName, url: siteUrl() },
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
    <div className="container page-section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />

      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/agents">Agents</Link>
        <span>/</span>
        <span aria-current="page">{agent.name}</span>
      </nav>

      <div className="detail-layout">
        <div>
          <div className="detail-title-row">
            <span className="agent-photo agent-photo-lg">
              {agent.photo_url ? (
                <Image src={agent.photo_url} alt={agent.name} fill sizes="160px" style={{ objectFit: "cover" }} />
              ) : (
                <span aria-hidden="true">{initials(agent.name)}</span>
              )}
            </span>
            <h1>{agent.name}</h1>
            {agent.designation && <p className="detail-location">{agent.designation}</p>}
            {agent.agency && (
              <p className="detail-location">
                <Link href={`/agencies/${agent.agency.slug}`}>{agent.agency.name}</Link>
              </p>
            )}
            {agent.short_bio && <p className="detail-description">{agent.short_bio}</p>}
          </div>

          {facts.length > 0 && (
            <section className="detail-section">
              <h2>Details</h2>
              <dl className="detail-list">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {agent.areas_of_expertise.length > 0 && (
            <section className="detail-section">
              <h2>Areas of expertise</h2>
              <ul className="chip-list">
                {agent.areas_of_expertise.map((area) => (
                  <li key={area} className="chip">
                    {area}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {agent.bio_html && (
            <section className="detail-section">
              <h2>About {agent.name}</h2>
              {/* bio_html is sanitised by the API before it is stored. */}
              <div className="prose" dangerouslySetInnerHTML={{ __html: agent.bio_html }} />
            </section>
          )}

          {socials.length > 0 && (
            <section className="detail-section">
              <h2>Find {agent.name} online</h2>
              <ul className="chip-list">
                {socials.map((social) => (
                  <li key={social.key}>
                    <a className="chip" href={social.url} target="_blank" rel="noopener noreferrer">
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="detail-sidebar">
          <div className="contact-card">
            <h2>Get in touch</h2>
            <ul className="contact-list">
              {phone && (
                <li>
                  <PhoneIcon className="icon" />
                  <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a>
                </li>
              )}
              {agent.email && (
                <li>
                  <MailIcon className="icon" />
                  <a href={`mailto:${agent.email}`}>{agent.email}</a>
                </li>
              )}
              {agent.city?.name && (
                <li>
                  <PinIcon className="icon" />
                  {agent.city.name}
                </li>
              )}
              {agent.experience_years && (
                <li>
                  <BriefcaseIcon className="icon" />
                  {agent.experience_years} years experience
                </li>
              )}
              <li>
                <HomeIcon className="icon" />
                {agent.listings_count ?? 0} live listings
              </li>
            </ul>

            <div className="btn-wrap">
              {phone && (
                <a className="btn btn-primary btn-block" href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                  <PhoneIcon className="icon" /> Call
                </a>
              )}
              {whatsapp && (
                <a
                  className="btn btn-whatsapp btn-block"
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`WhatsApp ${agent.name} (opens in a new tab)`}
                >
                  <WhatsAppIcon className="icon" /> WhatsApp
                </a>
              )}
            </div>
          </div>

          {(agent.listings_count ?? 0) > 0 && agent.agency && (
            <div className="aside-card">
              <h2>Listings</h2>
              <p>
                See every live listing from <Link href={`/agencies/${agent.agency.slug}`}>{agent.agency.name}</Link>.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
