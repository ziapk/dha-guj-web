import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import Image from "next/image";
import { AgencyLogo } from "@/components/agency-card";
import { AgencyAgentRow } from "@/components/agency/agency-agent-row";
import {
  BadgeIcon,
  BuildingIcon,
  BriefcaseIcon,
  ChartIcon,
  DocumentIcon,
  FacebookIcon,
  GlobeIcon,
  HandshakeIcon,
  InstagramIcon,
  LinkedInIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  ShieldCheckIcon,
  TikTokIcon,
  UsersIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from "@/components/icons";
import { ListingRowCard } from "@/components/listing-row-card";
import { NotFoundError, publicApi } from "@/lib/api";
import { sizedImage } from "@/lib/image";
import { whatsappNumber } from "@/lib/property";
import { jsonLd, metaText, openGraph } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import type { AgencyProfile, Paginated, PublicProperty, Resource } from "@/types/api";

const LISTINGS_SHOWN = 12;

const HIGHLIGHTS = [
  { icon: <HandshakeIcon />, label: "Trusted & Reliable Service" },
  { icon: <ChartIcon />, label: "Expert Market Guidance" },
  { icon: <UsersIcon />, label: "Client Focused Approach" },
  { icon: <BadgeIcon />, label: "Professional Team Support" },
];

const SOCIALS = [
  { key: "facebook", label: "Facebook", icon: <FacebookIcon /> },
  { key: "instagram", label: "Instagram", icon: <InstagramIcon /> },
  { key: "youtube", label: "YouTube", icon: <YouTubeIcon /> },
  { key: "tiktok", label: "TikTok", icon: <TikTokIcon /> },
  { key: "linkedin", label: "LinkedIn", icon: <LinkedInIcon /> },
] as const;

/** "Years of experience" from the year the agency started, e.g. 2017 → "8+ Years". */
function experience(establishedYear: number | null): string | null {
  if (!establishedYear) {
    return null;
  }

  const years = new Date().getFullYear() - establishedYear;

  return years < 1 ? "New in business" : `${years}+ Year${years === 1 ? "" : "s"}`;
}

const getAgency = cache(async (slug: string): Promise<AgencyProfile | null> => {
  try {
    const response = await publicApi<Resource<AgencyProfile>>(`agencies/${encodeURIComponent(slug)}`, { revalidate: 120 });

    return response.data;
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null;
    }

    throw error;
  }
});

export async function generateMetadata({ params }: PageProps<"/dealer/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const agency = await getAgency(slug);

  if (!agency) {
    return { title: "Dealer not found" };
  }

  const place = agency.city ? ` in ${agency.city.name}` : "";
  const description = metaText(agency.about ? `${agency.name}, real estate agency${place}. ${agency.about}` : `${agency.name}, real estate agency${place}. Meet the agents and browse every property they have for sale or rent.`);
  const url = `/dealer/${agency.slug}`;
  const title = `${agency.name}: real estate agency${place}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: await openGraph({ title, description, url, images: agency.logo_url ? [{ url: agency.logo_url, alt: `${agency.name} logo` }] : undefined }),
    twitter: { card: "summary", title, description },
  };
}

export default async function AgencyPage({ params, searchParams }: PageProps<"/dealer/[slug]">) {
  const { slug } = await params;
  const tab = (await searchParams).tab === "agents" ? "agents" : "properties";
  const agency = await getAgency(slug);

  if (!agency) {
    notFound();
  }

  const listings = await publicApi<Paginated<PublicProperty>>("properties", {
    query: { agency: agency.slug, sort: "newest", per_page: LISTINGS_SHOWN },
    revalidate: 60,
  }).catch(() => null);

  const agents = agency.agents ?? [];
  const whatsapp = whatsappNumber(agency.whatsapp ?? agency.phone);
  const location = [agency.address, agency.city?.name].filter(Boolean).join(", ");
  const total = listings?.meta.total ?? 0;
  const liveListings = agency.listings_count ?? total;
  const socials = SOCIALS.map((social) => ({ ...social, href: agency[social.key] })).filter((social) => social.href);
  const pageUrl = `/dealer/${agency.slug}`;

  const facts = [
    { icon: <PinIcon />, label: "Location", value: agency.city?.name ?? agency.address },
    { icon: <BuildingIcon />, label: "Dealer Type", value: agency.is_verified ? "Authorized Dealer" : "Property Dealer" },
    { icon: <BriefcaseIcon />, label: "Years of Experience", value: experience(agency.established_year) },
    { icon: <DocumentIcon />, label: "Total Listings", value: liveListings.toLocaleString("en-PK") },
    { icon: <ShieldCheckIcon />, label: "Service Areas", value: agency.service_areas ?? agency.city?.name ?? null },
  ].filter((fact) => fact.value);

  const agencyUrl = `${siteUrl()}/dealer/${agency.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": ["RealEstateAgent", "Organization"],
    "@id": `${agencyUrl}#agency`,
    name: agency.name,
    url: agencyUrl,
    logo: agency.logo_url ?? undefined,
    image: agency.cover_url ?? agency.logo_url ?? undefined,
    description: agency.about ?? undefined,
    telephone: agency.phone ?? undefined,
    email: agency.email ?? undefined,
    foundingDate: agency.established_year ? String(agency.established_year) : undefined,
    sameAs: [agency.website, ...socials.map((social) => social.href)].filter(Boolean),
    areaServed: agency.service_areas ?? (agency.city ? { "@type": "City", name: agency.city.name } : undefined),
    address: location ? { "@type": "PostalAddress", streetAddress: agency.address ?? undefined, addressLocality: agency.city?.name, addressCountry: "PK" } : undefined,
    employee: agents.length > 0 ? agents.map((agent) => ({ "@type": "Person", name: agent.name, jobTitle: agent.designation ?? undefined })) : undefined,
  };

  return (
    <div className="agency-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />

      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/dealers">Dealers</Link>
          <span>/</span>
          <span>{agency.name}</span>
        </nav>
      </div>

      <div className="container agency-profile">
        <section className={`agency-banner${agency.cover_url ? " has-cover" : ""}`}>
          {agency.cover_url && (
            <div className="agency-banner-cover">
              <Image src={sizedImage(agency.cover_url, "medium")} alt="" fill priority sizes="(max-width: 900px) 100vw, 1200px" style={{ objectFit: "cover" }} />
            </div>
          )}
          <div className="agency-banner-content">
            <div className="agency-banner-logo">
              <AgencyLogo name={agency.name} logoUrl={agency.logo_url} size={132} />
            </div>
            <div className="agency-banner-body">
              {agency.is_verified && (
                <span className="agency-banner-badge">
                  <ShieldCheckIcon /> Authorized Dealer
                </span>
              )}
              <h1>{agency.name}</h1>
              <p className="agency-banner-kicker">Real Estate Agency</p>
              {agency.about && <p className="agency-banner-about">{agency.about}</p>}
              <div className="agency-banner-actions">
                {agency.phone && (
                  <a className="btn btn-primary" href={`tel:${agency.phone.replace(/[^\d+]/g, "")}`} aria-label={`Call ${agency.name}`}>
                    <PhoneIcon /> Contact Us
                  </a>
                )}
                {whatsapp && (
                  <a className="btn btn-whatsapp" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${agency.name} (opens in a new tab)`}>
                    <WhatsAppIcon /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {facts.length > 0 && (
          <ul className="agency-facts">
            {facts.map((fact) => (
              <li key={fact.label}>
                <span className="agency-facts-icon">{fact.icon}</span>
                <div>
                  <small>{fact.label}</small>
                  <strong>{fact.value}</strong>
                </div>
              </li>
            ))}
          </ul>
        )}

        <section className="agency-intro">
          <div className="agency-intro-about">
            <h2>About {agency.name}</h2>
            <p>{agency.about ?? `${agency.name} is a real estate agency${agency.city ? ` in ${agency.city.name}` : ""}. Browse their live listings or get in touch with their agents.`}</p>
            <ul className="agency-highlights">
              {HIGHLIGHTS.map((highlight) => (
                <li key={highlight.label}>
                  {highlight.icon}
                  <span>{highlight.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <aside className="agency-contact">
            <h2>Contact Information</h2>
            <ul>
              {agency.phone && (
                <li>
                  <PhoneIcon /> <a href={`tel:${agency.phone.replace(/[^\d+]/g, "")}`}>{agency.phone}</a>
                </li>
              )}
              {agency.email && (
                <li>
                  <MailIcon /> <a href={`mailto:${agency.email}`}>{agency.email}</a>
                </li>
              )}
              {agency.website && (
                <li>
                  <GlobeIcon />{" "}
                  <a href={agency.website} target="_blank" rel="noopener noreferrer nofollow">
                    {agency.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                  </a>
                </li>
              )}
              {location && (
                <li>
                  <PinIcon /> <span>{location}</span>
                </li>
              )}
            </ul>
            {socials.length > 0 && (
              <div className="agency-socials">
                {socials.map((social) => (
                  <a key={social.key} href={social.href ?? undefined} className={`social-${social.key}`} target="_blank" rel="noopener noreferrer nofollow" aria-label={`${agency.name} on ${social.label}`}>
                    {social.icon}
                  </a>
                ))}
              </div>
            )}
          </aside>
        </section>

        <nav className="agency-tabs" aria-label="Agency sections">
          <Link href={pageUrl} scroll={false} aria-current={tab === "properties" ? "page" : undefined}>
            Properties <span>{total.toLocaleString("en-PK")}</span>
          </Link>
          <Link href={`${pageUrl}?tab=agents`} scroll={false} aria-current={tab === "agents" ? "page" : undefined}>
            Agents <span>{agents.length}</span>
          </Link>
        </nav>

        {tab === "properties" ? (
          !listings || listings.data.length === 0 ? (
            <div className="empty-results">
              <div style={{ fontSize: 44 }}>🏠</div>
              <h2>No live listings right now</h2>
              <p>Check back soon, or contact the dealer directly.</p>
            </div>
          ) : (
            <>
              <div className="agency-list">
                {listings.data.map((property) => (
                  <ListingRowCard key={property.id} property={property} owner={agency} />
                ))}
              </div>
              {total > LISTINGS_SHOWN && (
                <div className="listing-row-more">
                  <Link className="btn btn-outline" href={`/properties?agency=${encodeURIComponent(agency.slug)}&sort=newest`}>
                    View all {total.toLocaleString("en-PK")} properties
                  </Link>
                </div>
              )}
            </>
          )
        ) : agents.length === 0 ? (
          <div className="empty-results">
            <div style={{ fontSize: 44 }}>👤</div>
            <h2>No agents listed yet</h2>
            <p>Contact the dealer directly for help with buying, selling or renting.</p>
          </div>
        ) : (
          <div className="agency-list">
            {agents.map((agent) => (
              <AgencyAgentRow key={agent.id} agent={agent} agency={agency} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
