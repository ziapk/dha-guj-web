import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { BannerSlot } from "@/components/banner-slot";
import { BuildingIcon, CalendarIcon, HomeIcon, PinIcon } from "@/components/icons";
import { InquiryForm } from "@/components/inquiry-form";
import { ProjectCard } from "@/components/project-card";
import { ProjectContactCard } from "@/components/project-contact-card";
import { PropertyGallery } from "@/components/property-gallery";
import { ViewTracker } from "@/components/view-tracker";
import { AmenityGroups } from "@/components/amenity-groups";
import { NotFoundError, publicApi } from "@/lib/api";
import { CONSTRUCTION_STATUS_LABELS, formatArea, formatCompactPrice, formatDate, formatPrice } from "@/lib/labels";
import {
  UNIT_AVAILABILITY_LABELS,
  completionOf,
  nearbyDistanceOf,
  projectAddressOf,
  projectHref,
  projectLocationOf,
  projectMediaOf,
  projectPhotosOf,
  projectPriceOf,
  projectSingleMediaOf,
  unitPriceOf,
  unitRoomsOf,
  unitSummaryOf,
} from "@/lib/project";
import { mediumUrl } from "@/lib/property";
import { jsonLd, metaText, openGraph } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import type { Paginated, ProjectFeatureGroup, ProjectPaymentPlan, PublicProject, Resource } from "@/types/api";

export const revalidate = 300;

/** The grouped feature lists, in the order the page shows them. */
const FEATURE_GROUPS: { key: ProjectFeatureGroup; label: string }[] = [
  { key: "main", label: "Main features" },
  { key: "smart_home", label: "Smart home" },
  { key: "security", label: "Security" },
  { key: "sustainability", label: "Sustainability" },
  { key: "energy", label: "Energy" },
  { key: "construction", label: "Construction" },
  { key: "community", label: "Community" },
  { key: "business", label: "Business & communication" },
  { key: "other", label: "Other facilities" },
];

/** The money rows a payment plan can show, skipping anything the developer left empty. */
const PLAN_ROWS: { key: keyof ProjectPaymentPlan; label: string }[] = [
  { key: "total_price", label: "Total price" },
  { key: "booking_amount", label: "Booking amount" },
  { key: "down_payment", label: "Down payment" },
  { key: "monthly_installment", label: "Monthly" },
  { key: "quarterly_installment", label: "Quarterly" },
  { key: "half_yearly_installment", label: "Half-yearly" },
  { key: "possession_payment", label: "On possession" },
  { key: "development_charges", label: "Development charges" },
  { key: "other_charges", label: "Other charges" },
];

const getProject = cache(async (slug: string): Promise<PublicProject | null> => {
  try {
    const response = await publicApi<Resource<PublicProject>>(`projects/${encodeURIComponent(slug)}`, { revalidate: 300 });

    return response.data;
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null;
    }

    throw error;
  }
});

/** Pre-render the first page of live projects; anything published later renders on first visit. */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const projects = await publicApi<Paginated<PublicProject>>("projects", { query: { per_page: 48 }, revalidate: 300 })
    .then((response) => response.data)
    .catch(() => [] as PublicProject[]);

  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) {
    return { title: "Project not found" };
  }

  const cover = projectPhotosOf(project)[0];
  const title = project.meta_title ?? project.name;
  const price = projectPriceOf(project);
  const description = metaText(
    project.meta_description ??
      `${project.name} by ${project.developer_name}${price ? ` — ${price}` : ""}. ${project.short_description ?? project.description}`,
  );
  const url = projectHref(project.slug);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: await openGraph({ title, description, url, images: cover ? [{ url: mediumUrl(cover), alt: project.name }] : undefined }),
    twitter: { card: cover ? "summary_large_image" : "summary", title, description },
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
  const construction = projectMediaOf(project, "construction");
  const masterPlan = projectSingleMediaOf(project, "master_plan");
  const locationMap = projectSingleMediaOf(project, "location_map");
  const units = project.units ?? [];
  const paymentPlans = project.payment_plans ?? [];
  const floorPlans = project.floor_plans ?? [];
  const nearby = project.nearby_places ?? [];
  const amenities = project.amenities ?? [];
  const address = projectAddressOf(project);
  const price = projectPriceOf(project);

  const similar = await publicApi<Paginated<PublicProject>>("projects", {
    query: { city_id: project.city_id, per_page: 7 },
    revalidate: 300,
  })
    .then((response) => response.data.filter((other) => other.id !== project.id).slice(0, 3))
    .catch(() => [] as PublicProject[]);

  const facts = [
    { label: "Project type", value: project.project_type },
    { label: "Category", value: project.category },
    { label: "Status", value: CONSTRUCTION_STATUS_LABELS[project.construction_status] },
    { label: "Total land area", value: project.total_land_area },
    { label: "Project size", value: project.project_size },
    { label: "Buildings", value: project.buildings_count },
    { label: "Towers", value: project.towers_count },
    { label: "Floors", value: project.floors_count },
    { label: "Units", value: project.units_total },
    { label: "Launched", value: project.launch_date ? formatDate(project.launch_date) : null },
    { label: "Completion", value: completionOf(project.completion_date) },
    { label: "Possession", value: project.possession_date ? formatDate(project.possession_date) : null },
    { label: "Approval no.", value: project.approval_number },
  ].filter((fact) => fact.value !== null && fact.value !== undefined && fact.value !== "");

  const developerFacts = [
    { label: "Developer", value: project.developer_name },
    { label: "Sponsors", value: project.sponsors },
    { label: "Management", value: project.management_company },
    { label: "Architect", value: project.architect },
    { label: "Consultant", value: project.consultant },
    { label: "Construction", value: project.construction_company },
  ].filter((fact) => fact.value !== null && fact.value !== undefined && fact.value !== "");

  const sizeRange =
    project.min_unit_size && project.unit_size_unit
      ? `${formatArea(project.min_unit_size, project.unit_size_unit)}${project.max_unit_size ? ` – ${formatArea(project.max_unit_size, project.unit_size_unit)}` : ""}`
      : null;

  const projectUrl = `${siteUrl()}${projectHref(project.slug)}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: project.name,
    description: project.short_description ?? project.description,
    url: projectUrl,
    image: photos.map((photo) => mediumUrl(photo)),
    brand: { "@type": "Organization", name: project.developer_name, url: project.developer_website ?? undefined },
    ...(units.length > 0
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: project.currency ?? "PKR",
            lowPrice: project.price_from ?? undefined,
            highPrice: project.price_to ?? undefined,
            offerCount: units.length,
            availability: project.construction_status === "ready" ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
          },
        }
      : {}),
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl() },
      { "@type": "ListItem", position: 2, name: "Projects", item: `${siteUrl()}/projects` },
      { "@type": "ListItem", position: 3, name: project.name, item: projectUrl },
    ],
  };

  return (
    <div className="container page-section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />
      <ViewTracker slug={project.slug} subject="project" />

      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/projects">Projects</Link>
        <span>/</span>
        <span aria-current="page">{project.name}</span>
      </nav>

      <PropertyGallery photos={photos} title={project.name} />

      <div className="detail-layout">
        <div>
          <div className="detail-title-row">
            <div className="detail-badges">
              {project.is_featured && <span className="badge badge-featured">Featured</span>}
              <span className={`project-status project-status-${project.construction_status}`}>{CONSTRUCTION_STATUS_LABELS[project.construction_status]}</span>
              {project.project_type && <span className="badge badge-outline">{project.project_type}</span>}
            </div>
            {price && <div className="detail-price">{price}</div>}
            <h1>{project.name}</h1>
            <p className="detail-location">
              <BuildingIcon className="icon" /> By {project.developer_name}
            </p>
            <p className="detail-location">
              <PinIcon className="icon" /> {projectLocationOf(project)}
            </p>
            {project.short_description && <p className="detail-description">{project.short_description}</p>}

            <ul className="detail-highlights">
              {units.length > 0 && (
                <li>
                  <HomeIcon className="icon" /> {units.length} unit {units.length === 1 ? "type" : "types"}
                </li>
              )}
              {sizeRange && (
                <li>
                  <HomeIcon className="icon" /> {sizeRange}
                </li>
              )}
              {completionOf(project.completion_date) && (
                <li>
                  <CalendarIcon className="icon" /> Completion {completionOf(project.completion_date)}
                </li>
              )}
            </ul>
          </div>

          {facts.length > 0 && (
            <section className="detail-section">
              <h2>Project overview</h2>
              <dl className="detail-list">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
              {project.price_disclaimer && <p className="rate-table-note">{project.price_disclaimer}</p>}
            </section>
          )}

          {units.length > 0 && (
            <section className="detail-section">
              <h2>Unit types</h2>
              <div className="unit-list">
                {units.map((unit) => {
                  const rooms = unitRoomsOf(unit);

                  return (
                    <article key={unit.id} className="unit-card">
                      <div className="unit-card-head">
                        <div>
                          <h3>{unit.name}</h3>
                          <p>{unitSummaryOf(unit)}</p>
                        </div>
                        <div>
                          <span className="unit-card-price">{unitPriceOf(unit)}</span>
                          {unit.availability && <span className="tag">{UNIT_AVAILABILITY_LABELS[unit.availability] ?? unit.availability}</span>}
                        </div>
                      </div>

                      {rooms.length > 0 && (
                        <div className="fact-grid">
                          {rooms.map((room) => (
                            <div className="fact" key={room.label}>
                              <strong>{room.value}</strong>
                              <span>{room.label}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {(unit.down_payment || unit.monthly_installment || unit.price_per_sq_ft) && (
                        <div className="fact-grid unit-card-plan">
                          {unit.price_per_sq_ft && (
                            <div className="fact">
                              <strong>{formatPrice(unit.price_per_sq_ft)}</strong>
                              <span>Per sq. ft.</span>
                            </div>
                          )}
                          {unit.down_payment && (
                            <div className="fact">
                              <strong>{formatCompactPrice(unit.down_payment)}</strong>
                              <span>Down payment</span>
                            </div>
                          )}
                          {unit.monthly_installment && (
                            <div className="fact">
                              <strong>{formatCompactPrice(unit.monthly_installment)}</strong>
                              <span>Monthly{unit.installments_count ? ` × ${unit.installments_count}` : ""}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {unit.description && <p className="unit-card-note">{unit.description}</p>}
                      {unit.payment_plan && <p className="unit-card-note">{unit.payment_plan}</p>}

                      {unit.floor_plan_url && (
                        <a className="plan-thumb" href={unit.floor_plan_url} target="_blank" rel="noopener noreferrer">
                          <Image src={unit.floor_plan_url} alt={`${unit.name} floor plan`} fill sizes="320px" style={{ objectFit: "cover" }} />
                        </a>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {paymentPlans.length > 0 && (
            <section className="detail-section">
              <h2>Payment plans</h2>
              <div className="unit-list">
                {paymentPlans.map((plan) => {
                  const rows = PLAN_ROWS.map((row) => ({ label: row.label, value: plan[row.key] as string | null })).filter((row) => row.value !== null);

                  return (
                    <article key={plan.id} className="unit-card">
                      <div className="unit-card-head">
                        <div>
                          <h3>{plan.name}</h3>
                          {plan.unit_type && <p>{plan.unit_type}</p>}
                        </div>
                      </div>

                      {rows.length > 0 && (
                        <dl className="detail-list">
                          {rows.map((row) => (
                            <div key={row.label}>
                              <dt>{row.label}</dt>
                              <dd>{formatPrice(row.value)}</dd>
                            </div>
                          ))}
                        </dl>
                      )}

                      {plan.notes && <p className="unit-card-note">{plan.notes}</p>}

                      <div className="btn-wrap">
                        {plan.image_url && (
                          <a className="btn btn-outline" href={plan.image_url} target="_blank" rel="noopener noreferrer">
                            View plan image
                          </a>
                        )}
                        {plan.pdf_url && (
                          <a className="btn btn-outline" href={plan.pdf_url} target="_blank" rel="noopener noreferrer">
                            Download PDF
                          </a>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {floorPlans.length > 0 && (
            <section className="detail-section">
              <h2>Floor plans</h2>
              <div className="unit-list">
                {floorPlans.map((plan) => (
                  <article key={plan.id} className="unit-card">
                    <div className="unit-card-head">
                      <div>
                        <h3>{plan.name}</h3>
                        <p>
                          {[
                            plan.unit_type,
                            plan.level ? `Floor ${plan.level}` : null,
                            plan.area_size && plan.area_unit ? formatArea(plan.area_size, plan.area_unit) : null,
                            plan.bedrooms !== null ? `${plan.bedrooms} beds` : null,
                            plan.bathrooms !== null ? `${plan.bathrooms} baths` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                    </div>
                    {plan.description && <p className="unit-card-note">{plan.description}</p>}
                    {plan.image_url && (
                      <a className="plan-thumb" href={plan.image_url} target="_blank" rel="noopener noreferrer">
                        <Image src={plan.image_url} alt={`${plan.name} floor plan`} fill sizes="320px" style={{ objectFit: "cover" }} />
                      </a>
                    )}
                    {plan.pdf_url && (
                      <div className="btn-wrap">
                        <a className="btn btn-outline" href={plan.pdf_url} target="_blank" rel="noopener noreferrer">
                          Download PDF
                        </a>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="detail-section">
            <h2>About this project</h2>
            <p className="detail-description">{project.description}</p>
          </section>

          {developerFacts.length > 1 && (
            <section className="detail-section">
              <h2>Developer & team</h2>
              <dl className="detail-list">
                {developerFacts.map((fact) => (
                  <div key={fact.label}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
              {project.developer_description && <p className="detail-description">{project.developer_description}</p>}
              {project.developer_website && (
                <div className="btn-wrap">
                  <a className="btn btn-outline" href={project.developer_website} target="_blank" rel="noopener noreferrer">
                    Developer website
                  </a>
                </div>
              )}
            </section>
          )}

          {amenities.length > 0 && (
            <section className="detail-section">
              <h2>Amenities & facilities</h2>
              <AmenityGroups amenities={amenities} />
            </section>
          )}

          {FEATURE_GROUPS.some((group) => (project.features?.[group.key] ?? []).length > 0) && (
            <section className="detail-section">
              <h2>Features</h2>
              {FEATURE_GROUPS.filter((group) => (project.features?.[group.key] ?? []).length > 0).map((group) => (
                <div key={group.key} className="feature-group">
                  <h3>{group.label}</h3>
                  <ul className="amenity-list">
                    {(project.features?.[group.key] ?? []).map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}

          {nearby.length > 0 && (
            <section className="detail-section">
              <h2>What&rsquo;s nearby</h2>
              <ul className="nearby-list">
                {nearby.map((place) => (
                  <li key={place.id}>
                    <div>
                      <strong>
                        {place.maps_url ? (
                          <a href={place.maps_url} target="_blank" rel="noopener noreferrer">
                            {place.name}
                          </a>
                        ) : (
                          place.name
                        )}
                      </strong>
                      {place.description && <span>{place.description}</span>}
                    </div>
                    {nearbyDistanceOf(place) && <span className="nearby-distance">{nearbyDistanceOf(place)}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(masterPlan || locationMap) && (
            <section className="detail-section">
              <h2>Plans & maps</h2>
              <div className="media-grid">
                {masterPlan && (
                  <a className="plan-thumb wide" href={masterPlan.url} target="_blank" rel="noopener noreferrer">
                    <Image src={masterPlan.medium_url ?? masterPlan.url} alt="Master plan" fill sizes="(max-width: 700px) 100vw, 480px" style={{ objectFit: "cover" }} />
                    <span>Master plan</span>
                  </a>
                )}
                {locationMap && (
                  <a className="plan-thumb wide" href={locationMap.url} target="_blank" rel="noopener noreferrer">
                    <Image src={locationMap.medium_url ?? locationMap.url} alt="Location map" fill sizes="(max-width: 700px) 100vw, 480px" style={{ objectFit: "cover" }} />
                    <span>Location map</span>
                  </a>
                )}
              </div>
            </section>
          )}

          {construction.length > 0 && (
            <section className="detail-section">
              <h2>Construction progress</h2>
              <div className="media-grid">
                {construction.map((photo) => (
                  <a key={photo.id} className="plan-thumb wide" href={photo.url} target="_blank" rel="noopener noreferrer">
                    <Image src={photo.medium_url ?? photo.url} alt="Construction progress" fill sizes="(max-width: 700px) 100vw, 320px" style={{ objectFit: "cover" }} />
                  </a>
                ))}
              </div>
            </section>
          )}

          {(videos.length > 0 || project.video_url || project.virtual_tour_url) && (
            <section className="detail-section">
              <h2>Video & tour</h2>
              <div className="btn-wrap">
                {project.video_url && (
                  <a className="btn btn-outline" href={project.video_url} target="_blank" rel="noopener noreferrer">
                    Watch the project video
                  </a>
                )}
                {project.virtual_tour_url && (
                  <a className="btn btn-outline" href={project.virtual_tour_url} target="_blank" rel="noopener noreferrer">
                    Take the virtual tour
                  </a>
                )}
                {videos.map((video, index) => (
                  <a key={video.id} className="btn btn-outline" href={video.url} target="_blank" rel="noopener noreferrer">
                    Video {index + 1}
                  </a>
                ))}
              </div>
            </section>
          )}

          {brochures.length > 0 && (
            <section className="detail-section">
              <h2>Brochures</h2>
              <ul className="brochure-list">
                {brochures.map((brochure) => (
                  <li key={brochure.id}>
                    <a href={brochure.url} target="_blank" rel="noopener noreferrer">
                      {brochure.original_name ?? "Download brochure"}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="detail-section">
            <h2>Location</h2>
            <p style={{ margin: 0 }}>{address}</p>
            {project.landmark && <p className="detail-description">Near {project.landmark}</p>}
            {project.location_description && <p className="detail-description">{project.location_description}</p>}
            {project.maps_url && (
              <div className="btn-wrap">
                <a className="btn btn-outline" href={project.maps_url} target="_blank" rel="noopener noreferrer">
                  Open in Google Maps
                </a>
              </div>
            )}
          </section>
        </div>

        <aside className="detail-sidebar" id="enquire">
          <ProjectContactCard project={project} />
          <div className="contact-card">
            <InquiryForm slug={project.slug} title={project.name} subject="project" />
          </div>
          <BannerSlot placement="listing_sidebar" />
          <div className="fact" style={{ textAlign: "center" }}>
            <span>Project ID</span>
            <strong>#{project.id}</strong>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="section" style={{ paddingBottom: 0 }} aria-labelledby="similar-projects">
          <div className="section-head">
            <h2 id="similar-projects">More projects in {project.city?.name ?? "this city"}</h2>
            <Link className="pill-link" href="/projects">
              View all
            </Link>
          </div>
          <div className="property-grid">
            {similar.map((other) => (
              <ProjectCard key={other.id} project={other} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
