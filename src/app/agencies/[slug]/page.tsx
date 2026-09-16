import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { AgencyLogo, VerifiedBadge } from "@/components/agency-card";
import { PropertyCard } from "@/components/property-card";
import { NotFoundError, publicApi } from "@/lib/api";
import { whatsappNumber } from "@/lib/property";
import { jsonLd, metaText, openGraph } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import type { AgencyProfile, Paginated, PublicProperty, Resource } from "@/types/api";

const LISTINGS_SHOWN = 12;

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

export async function generateMetadata({ params }: PageProps<"/agencies/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const agency = await getAgency(slug);

  if (!agency) {
    return { title: "Agency not found" };
  }

  const place = agency.city ? ` in ${agency.city.name}` : "";
  const description = metaText(agency.about ? `${agency.name}, real estate agency${place}. ${agency.about}` : `${agency.name}, real estate agency${place}. Meet the agents and browse every property they have for sale or rent.`);
  const url = `/agencies/${agency.slug}`;
  const title = `${agency.name}: real estate agency${place}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: await openGraph({ title, description, url, images: agency.logo_url ? [{ url: agency.logo_url, alt: `${agency.name} logo` }] : undefined }),
    twitter: { card: "summary", title, description },
  };
}

export default async function AgencyPage({ params }: PageProps<"/agencies/[slug]">) {
  const { slug } = await params;
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

  const agencyUrl = `${siteUrl()}/agencies/${agency.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": ["RealEstateAgent", "Organization"],
    "@id": `${agencyUrl}#agency`,
    name: agency.name,
    url: agencyUrl,
    logo: agency.logo_url ?? undefined,
    image: agency.logo_url ?? undefined,
    description: agency.about ?? undefined,
    telephone: agency.phone ?? undefined,
    email: agency.email ?? undefined,
    sameAs: agency.website ? [agency.website] : undefined,
    areaServed: agency.city ? { "@type": "City", name: agency.city.name } : undefined,
    address: location ? { "@type": "PostalAddress", streetAddress: agency.address ?? undefined, addressLocality: agency.city?.name, addressCountry: "PK" } : undefined,
    employee: agents.length > 0 ? agents.map((agent) => ({ "@type": "Person", name: agent.name })) : undefined,
  };

  return (
    <div className="container page-section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />

      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/agencies">Agencies</Link>
        <span>/</span>
        <span>{agency.name}</span>
      </nav>

      <section className="agency-hero">
        <AgencyLogo name={agency.name} logoUrl={agency.logo_url} size={96} />
        <div className="agency-hero-body">
          <h1>
            {agency.name}
            {agency.is_verified && <VerifiedBadge />}
          </h1>
          {location && <p className="agency-hero-meta">{location}</p>}
          <ul className="agency-stats">
            <li>
              <strong>{(agency.listings_count ?? total).toLocaleString("en-PK")}</strong> live listings
            </li>
            <li>
              <strong>{agents.length}</strong> agent{agents.length === 1 ? "" : "s"}
            </li>
          </ul>
        </div>
        <div className="agency-hero-actions">
          {agency.phone && (
            <a className="btn btn-primary" href={`tel:${agency.phone}`}>
              Call {agency.phone}
            </a>
          )}
          {whatsapp && (
            <a className="btn btn-outline" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          )}
          {agency.email && (
            <a className="btn btn-outline" href={`mailto:${agency.email}`}>
              Email
            </a>
          )}
          {agency.website && (
            <a className="btn btn-outline" href={agency.website} target="_blank" rel="noopener noreferrer nofollow">
              Website
            </a>
          )}
        </div>
      </section>

      {agency.about && (
        <section className="detail-section">
          <h2>About {agency.name}</h2>
          <p className="detail-description">{agency.about}</p>
        </section>
      )}

      {agents.length > 0 && (
        <section className="detail-section">
          <h2>Agents</h2>
          <ul className="agent-list">
            {agents.map((agent) => (
              <li key={agent.id}>
                <span className="agent-avatar" aria-hidden="true">
                  {agent.name.slice(0, 1).toUpperCase()}
                </span>
                {agent.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="section-head" style={{ marginTop: 40 }}>
        <div>
          <h2>Live listings</h2>
          <p>
            {total.toLocaleString("en-PK")} propert{total === 1 ? "y" : "ies"} from {agency.name} and its agents
          </p>
        </div>
        {total > LISTINGS_SHOWN && <Link href={`/properties?agency=${encodeURIComponent(agency.slug ?? "")}&sort=newest`}>View all →</Link>}
      </div>

      {!listings || listings.data.length === 0 ? (
        <div className="empty-results">
          <div style={{ fontSize: 44 }}>🏠</div>
          <h2>No live listings right now</h2>
          <p>Check back soon, or contact the agency directly.</p>
        </div>
      ) : (
        <div className="property-grid">
          {listings.data.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
