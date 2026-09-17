import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { BuildingIcon, CalendarIcon, HomeIcon, PinIcon } from "@/components/icons";
import { InquiryForm } from "@/components/inquiry-form";
import { ProjectContactCard } from "@/components/project-contact-card";
import { PropertyGallery } from "@/components/property-gallery";
import { ViewTracker } from "@/components/view-tracker";
import { NotFoundError, publicApi } from "@/lib/api";
import { CONSTRUCTION_STATUS_LABELS, formatPrice } from "@/lib/labels";
import { completionOf, projectHref, projectLocationOf, projectMediaOf, projectPhotosOf, projectPriceOf, unitPriceOf, unitSummaryOf } from "@/lib/project";
import { mediumUrl } from "@/lib/property";
import { jsonLd, metaText, openGraph } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import type { PublicProject, Resource } from "@/types/api";

const getProject = cache(async (slug: string): Promise<PublicProject | null> => {
  try {
    const response = await publicApi<Resource<PublicProject>>(`projects/${encodeURIComponent(slug)}`, { revalidate: 60 });

    return response.data;
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null;
    }

    throw error;
  }
});

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    return { title: "Project not found" };
  }

  const cover = projectPhotosOf(project)[0];
  const location = projectLocationOf(project);
  const price = projectPriceOf(project);
  const title = `${project.name} by ${project.developer_name}`;
  const description = metaText(`${CONSTRUCTION_STATUS_LABELS[project.construction_status]} project${location ? ` in ${location}` : ""}${price ? ` · ${price}` : ""}. ${project.description}`);
  const url = projectHref(project.slug);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: await openGraph({
      title,
      description,
      url,
      images: cover ? [{ url: mediumUrl(cover), alt: project.name }] : undefined,
    }),
    twitter: { card: cover ? "summary_large_image" : "summary", title, description, images: cover ? [mediumUrl(cover)] : undefined },
  };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    notFound();
  }

  const photos = projectPhotosOf(project);
  const videos = projectMediaOf(project, "video");
  const brochures = projectMediaOf(project, "brochure");
  const units = project.units ?? [];
  const price = projectPriceOf(project);
  const location = projectLocationOf(project);
  const completion = completionOf(project.completion_date);

  const projectUrl = `${siteUrl()}${projectHref(project.slug)}`;
  // A project sells several unit types, so it is a Product with an AggregateOffer over their prices.
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: project.name,
    description: project.description,
    url: projectUrl,
    image: photos.map((photo) => mediumUrl(photo)),
    brand: { "@type": "Organization", name: project.developer_name },
    category: "Real estate project",
    ...(project.price_from !== null
      ? {
          offers: {
            "@type": "AggregateOffer",
            url: projectUrl,
            priceCurrency: "PKR",
            lowPrice: project.price_from,
            highPrice: project.price_to ?? project.price_from,
            offerCount: units.length,
            availability: project.construction_status === "ready" ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
            seller: { "@type": "Organization", name: project.developer_name },
          },
        }
      : {}),
  };

  return (
    <div className="container page-section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <ViewTracker slug={project.slug} subject="project" />

      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/projects">New projects</Link>
        {project.city && (
          <>
            <span>/</span>
            <Link href={`/projects?city_id=${project.city.id}`}>{project.city.name}</Link>
          </>
        )}
      </nav>

      <PropertyGallery photos={photos} title={project.name} />

      <div className="detail-layout">
        <div>
          <div className="detail-title-row">
            <div className="detail-badges">
              <span className={`badge project-status project-status-${project.construction_status}`}>{CONSTRUCTION_STATUS_LABELS[project.construction_status]}</span>
              {completion && project.construction_status !== "ready" && <span className="tag">Completion {completion}</span>}
            </div>
            <div className="detail-price">{price ?? <small>Price on request</small>}</div>
            <h1>{project.name}</h1>
            <p className="detail-location">
              <BuildingIcon /> By {project.developer_name}
            </p>
            {location && (
              <p className="detail-location">
                <PinIcon /> {location}
              </p>
            )}
            <ul className="detail-highlights">
              <li>
                <HomeIcon /> {units.length} unit type{units.length === 1 ? "" : "s"}
              </li>
              {completion && (
                <li>
                  <CalendarIcon /> {project.construction_status === "ready" ? "Completed" : "Completion"} {completion}
                </li>
              )}
            </ul>
          </div>

          {units.length > 0 && (
            <section className="detail-section">
              <h2>Unit types & payment plans</h2>
              <div className="unit-list">
                {units.map((unit) => {
                  const summary = unitSummaryOf(unit);
                  const hasPlan = Boolean(unit.down_payment || unit.monthly_installment || unit.installments_count);

                  return (
                    <article key={unit.id} className="unit-card">
                      <div className="unit-card-head">
                        <div>
                          <h3>{unit.name}</h3>
                          {summary && <p>{summary}</p>}
                        </div>
                        <strong className="unit-card-price">{unitPriceOf(unit) ?? "Price on request"}</strong>
                      </div>
                      {hasPlan && (
                        <div className="fact-grid unit-card-plan">
                          {unit.down_payment && (
                            <div className="fact">
                              <span>Down payment</span>
                              <strong>{formatPrice(unit.down_payment)}</strong>
                            </div>
                          )}
                          {unit.monthly_installment && (
                            <div className="fact">
                              <span>Monthly installment</span>
                              <strong>
                                {formatPrice(unit.monthly_installment)}
                                {unit.installments_count ? ` × ${unit.installments_count}` : ""}
                              </strong>
                            </div>
                          )}
                          {!unit.monthly_installment && Boolean(unit.installments_count) && (
                            <div className="fact">
                              <span>Installments</span>
                              <strong>{unit.installments_count}</strong>
                            </div>
                          )}
                        </div>
                      )}
                      {unit.payment_plan && <p className="unit-card-note">{unit.payment_plan}</p>}
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          <section className="detail-section">
            <h2>About this project</h2>
            <p className="detail-description">{project.description}</p>
          </section>

          {(project.amenities ?? []).length > 0 && (
            <section className="detail-section">
              <h2>Amenities</h2>
              <ul className="amenity-list">
                {project.amenities?.map((amenity) => (
                  <li key={amenity.id}>{amenity.name}</li>
                ))}
              </ul>
            </section>
          )}

          {videos.length > 0 && (
            <section className="detail-section">
              <h2>Videos</h2>
              {videos.map((video, index) => (
                <p key={video.id} style={{ margin: "0 0 8px" }}>
                  <a href={video.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
                    ▶ Watch video{videos.length > 1 ? ` ${index + 1}` : ""}
                  </a>
                </p>
              ))}
            </section>
          )}

          {brochures.length > 0 && (
            <section className="detail-section">
              <h2>Brochures</h2>
              <div className="brochure-list">
                {brochures.map((brochure, index) => (
                  <a key={brochure.id} className="btn btn-outline" href={brochure.url} target="_blank" rel="noopener noreferrer" download>
                    <span aria-hidden="true">⬇</span>
                    <span>{brochure.original_name ?? `Brochure${brochures.length > 1 ? ` ${index + 1}` : ""}`}</span>
                  </a>
                ))}
              </div>
            </section>
          )}

          <section className="detail-section">
            <h2>Location</h2>
            <p style={{ margin: 0 }}>{[project.address, project.phase, project.society?.name, project.city?.name].filter(Boolean).join(", ")}</p>
          </section>
        </div>

        <aside className="detail-sidebar">
          <ProjectContactCard project={project} />
          <div className="contact-card">
            <InquiryForm slug={project.slug} title={project.name} subject="project" />
          </div>
          <div className="fact" style={{ textAlign: "center" }}>
            <span>Project ID</span>
            <strong>#{project.id}</strong>
          </div>
        </aside>
      </div>
    </div>
  );
}
