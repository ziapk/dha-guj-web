import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AgencyLogo } from "@/components/agency-card";
import { DeveloperTypeBadge } from "@/components/developer-card";
import { ProjectCard } from "@/components/project-card";
import { DEVELOPER_TYPE_LABELS, developerHref, developerSocials, getDeveloper } from "@/lib/developers";
import { whatsappNumber } from "@/lib/property";
import { jsonLd, metaText, openGraph } from "@/lib/seo";
import { siteUrl } from "@/lib/site";

function pageOf(value: string | string[] | undefined): number {
  return Math.max(1, Number.parseInt(typeof value === "string" ? value : "", 10) || 1);
}

export async function generateMetadata({ params, searchParams }: PageProps<"/developers/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = pageOf((await searchParams).page);
  const result = await getDeveloper(slug, page);

  if (!result) {
    return { title: "Company not found" };
  }

  const developer = result.data;
  const kind = DEVELOPER_TYPE_LABELS[developer.company_type].toLowerCase();
  const place = developer.city ? ` in ${developer.city.name}` : "";
  const title = developer.meta_title ?? `${developer.name}: ${kind}${place}`;
  const description = metaText(
    developer.meta_description ?? developer.short_description ?? `${developer.name}, ${kind}${place}. See the company's background and every project it has live right now.`,
  );
  const url = developerHref(developer.slug);
  const image = developer.cover_url ?? developer.logo_url;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: await openGraph({ title, description, url, images: image ? [{ url: image, alt: developer.name }] : undefined }),
    twitter: { card: developer.cover_url ? "summary_large_image" : "summary", title, description },
    // Later project pages repeat the company profile.
    robots: page > 1 ? { index: false, follow: true } : undefined,
  };
}

export default async function DeveloperPage({ params, searchParams }: PageProps<"/developers/[slug]">) {
  const { slug } = await params;
  const page = pageOf((await searchParams).page);
  const result = await getDeveloper(slug, page);

  if (!result) {
    notFound();
  }

  const developer = result.data;
  const projects = result.projects;
  const total = developer.projects_count ?? projects.meta.total;
  const whatsapp = whatsappNumber(developer.whatsapp ?? developer.phone);
  const location = [developer.address, developer.city?.name].filter(Boolean).join(", ");
  const socials = developerSocials(developer);

  const facts = [
    { label: "Company type", value: DEVELOPER_TYPE_LABELS[developer.company_type] },
    { label: "Established", value: developer.established_year ? String(developer.established_year) : null },
    { label: "Registration no.", value: developer.registration_number },
    { label: "Head office", value: location || null },
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact.value));

  const pageUrl = `${siteUrl()}${developerHref(developer.slug)}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${pageUrl}#organization`,
    name: developer.name,
    url: pageUrl,
    logo: developer.logo_url ?? undefined,
    image: developer.cover_url ?? developer.logo_url ?? undefined,
    description: developer.short_description ?? undefined,
    telephone: developer.phone ?? undefined,
    email: developer.email ?? undefined,
    foundingDate: developer.established_year ? String(developer.established_year) : undefined,
    sameAs: [developer.website, ...socials.map((social) => social.url)].filter(Boolean),
    address: location ? { "@type": "PostalAddress", streetAddress: developer.address ?? undefined, addressLocality: developer.city?.name, addressCountry: "PK" } : undefined,
  };
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl()}/` },
      { "@type": "ListItem", position: 2, name: "Developers", item: `${siteUrl()}/developers` },
      { "@type": "ListItem", position: 3, name: developer.name, item: pageUrl },
    ],
  };

  function pageHref(target: number): string {
    return target > 1 ? `${developerHref(developer.slug)}?page=${target}` : developerHref(developer.slug);
  }

  return (
    <div className="container page-section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />

      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/developers">Developers</Link>
        <span>/</span>
        <span aria-current="page">{developer.name}</span>
      </nav>

      {developer.cover_url && (
        <div className="developer-cover">
          <Image src={developer.cover_url} alt="" fill priority sizes="(max-width: 1240px) 100vw, 1240px" style={{ objectFit: "cover" }} />
        </div>
      )}

      <section className="agency-hero">
        <AgencyLogo name={developer.name} logoUrl={developer.logo_url} size={96} />
        <div className="agency-hero-body">
          <h1>
            {developer.name}
            <DeveloperTypeBadge type={developer.company_type} />
          </h1>
          {developer.tagline && <p className="agency-hero-meta">{developer.tagline}</p>}
          <ul className="agency-stats">
            <li>
              <strong>{total.toLocaleString("en-PK")}</strong> live project{total === 1 ? "" : "s"}
            </li>
            {developer.established_year && (
              <li>
                <strong>{developer.established_year}</strong> established
              </li>
            )}
            {developer.city && (
              <li>
                <strong>{developer.city.name}</strong>
              </li>
            )}
          </ul>
        </div>
        <div className="agency-hero-actions">
          {developer.phone && (
            <a className="btn btn-primary" href={`tel:${developer.phone}`}>
              Call {developer.phone}
            </a>
          )}
          {whatsapp && (
            <a className="btn btn-outline" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          )}
          {developer.email && (
            <a className="btn btn-outline" href={`mailto:${developer.email}`}>
              Email
            </a>
          )}
          {developer.website && (
            <a className="btn btn-outline" href={developer.website} target="_blank" rel="noopener noreferrer nofollow">
              Website
            </a>
          )}
        </div>
      </section>

      {page === 1 && (
        <>
          {(developer.description || developer.short_description) && (
            <section className="detail-section">
              <h2>About {developer.name}</h2>
              {developer.description ? (
                // Sanitised by the API before it is stored.
                <div className="prose" dangerouslySetInnerHTML={{ __html: developer.description }} />
              ) : (
                <p className="detail-description">{developer.short_description}</p>
              )}
            </section>
          )}

          {developer.highlights.length > 0 && (
            <section className="detail-section">
              <h2>Highlights</h2>
              <ul className="developer-highlights">
                {developer.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </section>
          )}

          {(facts.length > 1 || socials.length > 0) && (
            <section className="detail-section">
              <h2>Company details</h2>
              <dl className="detail-list">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
              {socials.length > 0 && (
                <div className="btn-wrap">
                  {socials.map((social) => (
                    <a key={social.key} className="btn btn-outline" href={social.url} target="_blank" rel="noopener noreferrer nofollow">
                      {social.label}
                    </a>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

      <div className="section-head" style={{ marginTop: 40 }}>
        <div>
          <h2>Projects by {developer.name}</h2>
          <p>
            {total.toLocaleString("en-PK")} live project{total === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {projects.data.length === 0 ? (
        <div className="empty-results">
          <div style={{ fontSize: 44 }}>🏗️</div>
          <h2>No live projects right now</h2>
          <p>Check back soon, or contact the company directly.</p>
        </div>
      ) : (
        <>
          <div className="property-grid">
            {projects.data.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
          {projects.meta.last_page > 1 && (
            <nav className="simple-pagination" aria-label="Pagination">
              {page > 1 ? <Link href={pageHref(page - 1)}>← Previous</Link> : <span />}
              <span>
                Page {page} of {projects.meta.last_page}
              </span>
              {page < projects.meta.last_page ? <Link href={pageHref(page + 1)}>Next →</Link> : <span />}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
