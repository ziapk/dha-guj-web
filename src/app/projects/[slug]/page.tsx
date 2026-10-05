import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache, type CSSProperties, type ReactNode } from "react";
import { AgencyLogo } from "@/components/agency-card";
import { AmenityIcon, hasAmenityIcon } from "@/components/amenity-icon";
import { AmenityGlyph } from "@/components/amenity-icons";
import { BannerSlot } from "@/components/banner-slot";
import {
  AreaIcon,
  ArrowRightIcon,
  BathIcon,
  BedIcon,
  BuildingIcon,
  CalendarIcon,
  CameraIcon,
  ChartIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  DocumentIcon,
  DownloadIcon,
  HandshakeIcon,
  HomeIcon,
  LayersIcon,
  PinIcon,
  ShieldCheckIcon,
  TagIcon,
} from "@/components/icons";
import { InquiryForm } from "@/components/inquiry-form";
import { JsonLd } from "@/components/json-ld";
import { ProjectCard } from "@/components/project-card";
import { ProjectContactCard } from "@/components/project-contact-card";
import { Expandable } from "@/components/property-detail/expandable";
import { MasterPlanViewer } from "@/components/project-detail/master-plan-viewer";
import { PropertyGallery } from "@/components/property-gallery";
import { Rail } from "@/components/rail";
import { ViewTracker } from "@/components/view-tracker";
import { NotFoundError, publicApi } from "@/lib/api";
import { developerHref } from "@/lib/developers";
import { CONSTRUCTION_STATUS_LABELS, formatArea, formatCompactPrice, formatDate, formatPrice } from "@/lib/labels";
import {
  UNIT_AVAILABILITY_LABELS,
  completionOf,
  nearbyDistanceOf,
  nearbyIconOf,
  projectAddressOf,
  projectFaqsOf,
  projectHref,
  projectLocationOf,
  projectMediaOf,
  projectPhotosOf,
  projectSingleMediaOf,
  projectTimelineOf,
} from "@/lib/project";
import { coverOf, locationOf, mediumUrl, propertyHref, thumbnailUrl } from "@/lib/property";
import { metaText, openGraph } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import type { AgencyProfile, Paginated, ProjectFeatureGroup, ProjectPaymentPlan, PublicProject, PublicProperty, Resource } from "@/types/api";

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
  { key: "booking_amount", label: "Booking" },
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
  const from = project.price_from ? formatCompactPrice(project.price_from) : null;
  const description = metaText(
    project.meta_description ?? `${project.name} by ${project.developer_name}${from ? ` — from ${from}` : ""}. ${project.short_description ?? project.description}`,
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

/** "— KEY HIGHLIGHTS —" over a title whose last words are in the accent colour. */
function SectionHead({ eyebrow, title, accent, sub, align = "center", id }: { eyebrow?: string; title: string; accent: string; sub?: string; align?: "center" | "start"; id?: string }) {
  return (
    <div className={`pj-head pj-head-${align}`}>
      {eyebrow && <span className="pj-eyebrow">{eyebrow}</span>}
      <h2 id={id}>
        {title} <span>{accent}</span>
      </h2>
      {sub && <p>{sub}</p>}
    </div>
  );
}

/** "Rs 2.5 Crore" → a small currency label and the bold amount, as in the header price blocks. */
function PriceBlock({ label, value, accent }: { label: string; value: number | null; accent?: boolean }) {
  if (!value) {
    return null;
  }

  const [currency, ...words] = formatCompactPrice(value).split(" ");

  return (
    <div className={`pj-price${accent ? " is-accent" : ""}`}>
      <span>{label}</span>
      <strong>
        <small>{currency === "Rs" ? "PKR" : currency}</small> {words.join(" ")}
      </strong>
    </div>
  );
}

/** A download card used by payment plans, floor plans and brochures. */
function DocCard({ title, kind, image, href, cta, children }: { title: string; kind: string; image: string | null; href: string | null; cta?: string; children?: ReactNode }) {
  const isPdf = href?.toLowerCase().split("?")[0].endsWith(".pdf") ?? false;

  return (
    <article className="pj-doc">
      <a className={`pj-doc-media${image ? "" : " is-empty"}`} href={href ?? image ?? undefined} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true">
        {image ? (
          <Image src={image} alt="" fill sizes="(max-width: 560px) 82vw, 240px" style={{ objectFit: "cover", objectPosition: "top" }} />
        ) : (
          (children ?? (
            <span className="pj-doc-placeholder">
              <DocumentIcon />
              <b>{title}</b>
            </span>
          ))
        )}
      </a>
      <div className="pj-doc-foot">
        <div>
          <strong>{title}</strong>
          <small>{kind}</small>
        </div>
        {isPdf && <span className="pj-pdf">PDF</span>}
        {href && !cta && (
          <a className="pj-doc-download" href={href} target="_blank" rel="noopener noreferrer" aria-label={`Download ${title}`}>
            <DownloadIcon />
          </a>
        )}
      </div>
      {href && cta && (
        <a className="pj-doc-cta" href={href} target="_blank" rel="noopener noreferrer">
          <DownloadIcon /> {cta}
        </a>
      )}
    </article>
  );
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
  const planImages = projectMediaOf(project, "payment_plan");
  const masterPlan = projectSingleMediaOf(project, "master_plan");
  const locationMap = projectSingleMediaOf(project, "location_map");
  const logo = projectSingleMediaOf(project, "logo");
  const units = project.units ?? [];
  const paymentPlans = project.payment_plans ?? [];
  const floorPlans = project.floor_plans ?? [];
  const nearby = project.nearby_places ?? [];
  const amenities = project.amenities ?? [];
  const featureGroups = FEATURE_GROUPS.filter((group) => (project.features?.[group.key] ?? []).length > 0);
  const address = projectAddressOf(project);
  const location = projectLocationOf(project);
  const timeline = projectTimelineOf(project);
  const faqs = projectFaqsOf(project);
  const coverThumb = photos[0] ? thumbnailUrl(photos[0]) : null;

  const [similar, spotlight, agency] = await Promise.all([
    publicApi<Paginated<PublicProject>>("projects", { query: { city_id: project.city_id, per_page: 9 }, revalidate: 300 })
      .then((response) => response.data.filter((other) => other.id !== project.id).slice(0, 8))
      .catch(() => [] as PublicProject[]),
    publicApi<Paginated<PublicProperty>>("properties", { query: { featured: 1, per_page: 1 }, revalidate: 300 })
      .then((response) => response.data[0] ?? null)
      .catch(() => null),
    // A Titanium agency when there is one, otherwise the first listed agency.
    publicApi<Paginated<AgencyProfile>>("agencies", { query: { titanium: 1, per_page: 1 }, revalidate: 300 })
      .then((response) => response.data[0] ?? publicApi<Paginated<AgencyProfile>>("agencies", { query: { per_page: 1 }, revalidate: 300 }).then((all) => all.data[0] ?? null))
      .catch(() => null),
  ]);
  const spotlightCover = spotlight ? coverOf(spotlight) : null;

  /** Distinct unit sizes, e.g. "5 Marla · 6 Marla · 10 Marla"; falls back to the headline size range. */
  const unitSizes = [...new Set(units.filter((unit) => unit.area_size && unit.area_unit).map((unit) => formatArea(unit.area_size!, unit.area_unit!)))];
  const sizeText =
    unitSizes.length > 0
      ? unitSizes.slice(0, 3).join(" · ") + (unitSizes.length > 3 ? " …" : "")
      : project.min_unit_size && project.unit_size_unit
        ? `${formatArea(project.min_unit_size, project.unit_size_unit)}${project.max_unit_size ? ` – ${formatArea(project.max_unit_size, project.unit_size_unit)}` : ""}`
        : null;

  /** Table columns no unit fills in are dropped, so the table stays readable. */
  const unitColumns = {
    max: units.some((unit) => unit.price_to),
    beds: units.some((unit) => unit.bedrooms !== null),
    baths: units.some((unit) => unit.bathrooms !== null),
    availability: units.some((unit) => unit.availability),
  };

  const stats = [
    { label: "Project Type", value: project.project_type ?? project.category, icon: <BuildingIcon />, tone: "blue" },
    { label: "Unit Types", value: units.length > 0 ? String(units.length) : null, icon: <LayersIcon />, tone: "orange" },
    { label: "Unit Sizes", value: sizeText, icon: <HomeIcon />, tone: "green" },
    project.possession_date
      ? { label: "Possession", value: formatDate(project.possession_date), icon: <CalendarIcon />, tone: "purple" }
      : { label: project.construction_status === "ready" ? "Status" : "Completion", value: project.construction_status === "ready" ? "Ready" : completionOf(project.completion_date), icon: <CalendarIcon />, tone: "purple" },
  ].filter((stat) => stat.value);

  const facts = [
    { label: "Status", value: CONSTRUCTION_STATUS_LABELS[project.construction_status] },
    { label: "Category", value: project.category },
    { label: "Total land area", value: project.total_land_area },
    { label: "Project size", value: project.project_size },
    { label: "Buildings", value: project.buildings_count },
    { label: "Towers", value: project.towers_count },
    { label: "Floors", value: project.floors_count },
    { label: "Total units", value: project.units_total },
    { label: "Launched", value: project.launch_date ? formatDate(project.launch_date) : null },
    { label: "Approval no.", value: project.approval_number },
  ].filter((fact) => fact.value !== null && fact.value !== undefined && fact.value !== "");

  const developerFacts = [
    { label: "Sponsors", value: project.sponsors },
    { label: "Management", value: project.management_company },
    { label: "Architect", value: project.architect },
    { label: "Consultant", value: project.consultant },
    { label: "Construction", value: project.construction_company },
  ].filter((fact) => fact.value);

  const showProgress = timeline.percent !== null || construction.length > 0 || project.launch_date || project.completion_date;

  const projectUrl = `${siteUrl()}${projectHref(project.slug)}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: project.name,
    description: project.short_description ?? project.description,
    url: projectUrl,
    image: photos.map((photo) => mediumUrl(photo)),
    brand: {
      "@type": "Organization",
      name: project.developer_name,
      url: project.developer ? `${siteUrl()}${developerHref(project.developer.slug)}` : (project.developer_website ?? undefined),
    },
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
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
  };

  return (
    <div className="container page-section pj-page">
      <JsonLd data={faqs.length > 0 ? [structuredData, breadcrumbs, faqData] : [structuredData, breadcrumbs]} />
      <ViewTracker slug={project.slug} subject="project" />

      <div className="pj-top">
        <nav className="breadcrumbs pd-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <ChevronRightIcon />
          <Link href="/projects">Projects</Link>
          <ChevronRightIcon />
          <span aria-current="page">{project.name}</span>
        </nav>

        <header className="pj-header">
          <div className="pj-logo">
            {logo ? (
              <Image src={logo.medium_url ?? logo.url} alt={`${project.name} logo`} fill sizes="150px" style={{ objectFit: "contain" }} />
            ) : (
              <AgencyLogo name={project.developer?.name ?? project.name} logoUrl={project.developer?.logo_url ?? null} size={64} />
            )}
          </div>
          <div className="pj-title">
            <h1>
              {project.name}
              <span className="pj-verified" title="Reviewed by our team before it went live">
                <ShieldCheckIcon /> Verified
              </span>
            </h1>
            {location && (
              <p>
                <PinIcon /> {location}
              </p>
            )}
            <p className="pj-by">
              <BuildingIcon /> By {project.developer ? <Link href={developerHref(project.developer.slug)}>{project.developer_name}</Link> : project.developer_name}
              <span className={`pj-status is-${project.construction_status}`}>{CONSTRUCTION_STATUS_LABELS[project.construction_status]}</span>
              {project.is_featured && <span className="badge badge-featured">Featured</span>}
            </p>
          </div>
          {(project.price_from || project.price_to) && (
            <div className="pj-prices">
              <PriceBlock label="Starting From" value={project.price_from} accent />
              {project.price_to && project.price_to !== project.price_from && <PriceBlock label="Maximum Price" value={project.price_to} />}
            </div>
          )}
        </header>
      </div>

      <PropertyGallery photos={photos} title={project.name} layout="stack" />

      <div className="detail-layout pd-layout pj-layout">
        <div className="pj-main">
          {stats.length > 0 && (
            <ul className="pj-stats">
              {stats.map((stat) => (
                <li key={stat.label} className={`pj-tone-${stat.tone}`}>
                  <span className="pj-stat-icon">{stat.icon}</span>
                  <span className="pj-stat-label">{stat.label}</span>
                  <strong>{stat.value}</strong>
                </li>
              ))}
            </ul>
          )}

          <section className="pj-section pj-overview">
            <h2 className="pj-plain-title">Overview</h2>
            {project.short_description && <p className="pj-lead">{project.short_description}</p>}
            <h3 className="pj-sub-title">
              {project.name}
              {location ? ` – ${location}` : ""}
            </h3>
            <Expandable collapsedHeight={230}>
              <p className="pj-text">{project.description}</p>
              {facts.length > 0 && (
                <dl className="pj-facts">
                  {facts.map((fact) => (
                    <div key={fact.label}>
                      <dt>{fact.label}</dt>
                      <dd>{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </Expandable>
          </section>

          {units.length > 0 && (
            <section className="pj-section pj-card" aria-labelledby="pj-units">
              <SectionHead id="pj-units" title="Available" accent="Units" sub="Explore the available units with sizes, prices and key details." align="start" />
              <div className="pj-table-wrap">
                <table className="pj-units">
                  <thead>
                    <tr>
                      <th>
                        <HomeIcon /> Unit type
                      </th>
                      <th>
                        <AreaIcon /> Size
                      </th>
                      <th>
                        <TagIcon /> Starting price
                      </th>
                      {unitColumns.max && (
                        <th>
                          <TagIcon /> Maximum price
                        </th>
                      )}
                      {unitColumns.beds && (
                        <th>
                          <BedIcon /> Beds
                        </th>
                      )}
                      {unitColumns.baths && (
                        <th>
                          <BathIcon /> Baths
                        </th>
                      )}
                      {unitColumns.availability && (
                        <th>
                          <ShieldCheckIcon /> Availability
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {units.map((unit) => {
                      const image = unit.floor_plan_url ?? coverThumb;

                      return (
                        <tr key={unit.id}>
                          <td>
                            <div className="pj-unit-name">
                              <span className="pj-unit-thumb">{image ? <Image src={image} alt="" fill sizes="64px" style={{ objectFit: "cover" }} /> : <HomeIcon />}</span>
                              <span>
                                <strong>{unit.name}</strong>
                                {unit.property_type?.name && <small>{unit.property_type.name}</small>}
                              </span>
                            </div>
                          </td>
                          <td>
                            {unit.area_size && unit.area_unit ? (
                              <>
                                <strong>{formatArea(unit.area_size, unit.area_unit)}</strong>
                                {unit.price_per_sq_ft && <small>{formatPrice(unit.price_per_sq_ft)} / sq. ft.</small>}
                              </>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="pj-unit-price is-accent">
                            <strong>{formatCompactPrice(unit.price_from).replace(/^Rs/, "PKR")}</strong>
                            <small>(Starting from)</small>
                          </td>
                          {unitColumns.max && (
                            <td className="pj-unit-price">
                              {unit.price_to ? (
                                <>
                                  <strong>{formatCompactPrice(unit.price_to).replace(/^Rs/, "PKR")}</strong>
                                  <small>(Maximum price)</small>
                                </>
                              ) : (
                                "—"
                              )}
                            </td>
                          )}
                          {unitColumns.beds && (
                            <td>
                              <strong>{unit.bedrooms ?? "—"}</strong>
                              {unit.bedrooms !== null && <small>Beds</small>}
                            </td>
                          )}
                          {unitColumns.baths && (
                            <td>
                              <strong>{unit.bathrooms ?? "—"}</strong>
                              {unit.bathrooms !== null && <small>Baths</small>}
                            </td>
                          )}
                          {unitColumns.availability && (
                            <td>
                              {unit.availability ? (
                                <span className={`pj-availability is-${unit.availability}`}>{UNIT_AVAILABILITY_LABELS[unit.availability] ?? unit.availability}</span>
                              ) : (
                                "—"
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {units.some((unit) => unit.monthly_installment || unit.down_payment) && (
                <ul className="pj-unit-plans">
                  {units
                    .filter((unit) => unit.monthly_installment || unit.down_payment)
                    .map((unit) => (
                      <li key={unit.id}>
                        <strong>{unit.name}:</strong>{" "}
                        {[
                          unit.down_payment ? `${formatCompactPrice(unit.down_payment)} down payment` : null,
                          unit.monthly_installment ? `${formatCompactPrice(unit.monthly_installment)} monthly${unit.installments_count ? ` × ${unit.installments_count}` : ""}` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </li>
                    ))}
                </ul>
              )}
              {project.price_disclaimer && <p className="pj-note">{project.price_disclaimer}</p>}
            </section>
          )}

          {nearby.length > 0 && (
            <section className="pj-section" aria-labelledby="pj-nearby">
              <SectionHead id="pj-nearby" eyebrow="Nearby Facilities" title="Nearby" accent="Facilities" />
              <ul className="pj-nearby">
                {nearby.map((place) => {
                  const body = (
                    <>
                      <span className="pj-nearby-icon">
                        <AmenityGlyph name={nearbyIconOf(place.name)} />
                      </span>
                      <span>
                        <strong>{place.name}</strong>
                        {nearbyDistanceOf(place) && <small>{nearbyDistanceOf(place)}</small>}
                      </span>
                    </>
                  );

                  return (
                    <li key={place.id} title={place.description ?? undefined}>
                      {place.maps_url ? (
                        <a href={place.maps_url} target="_blank" rel="noopener noreferrer">
                          {body}
                        </a>
                      ) : (
                        <div>{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {(amenities.length > 0 || featureGroups.length > 0) && (
            <section className="pj-section pj-band" aria-labelledby="pj-features">
              <SectionHead
                id="pj-features"
                eyebrow="Key Highlights"
                title="Project"
                accent="Features"
                sub="A well-planned community with the facilities you need for a comfortable and secure lifestyle."
              />
              {amenities.length > 0 && (
                <ul className="pj-features">
                  {amenities.map((amenity) => (
                    <li key={amenity.id}>
                      <span className="pj-feature-icon">{hasAmenityIcon(amenity) ? <AmenityIcon amenity={amenity} /> : <AmenityGlyph name="check" className="amenity-icon" />}</span>
                      <strong>{amenity.name}</strong>
                    </li>
                  ))}
                </ul>
              )}
              {featureGroups.length > 0 && (
                <div className="pj-feature-groups">
                  {featureGroups.map((group) => (
                    <div key={group.key}>
                      <h3>{group.label}</h3>
                      <ul>
                        {(project.features?.[group.key] ?? []).map((feature) => (
                          <li key={feature}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {masterPlan && (
            <section className="pj-section pj-band pj-band-sky" aria-labelledby="pj-master-plan">
              <SectionHead id="pj-master-plan" eyebrow="Master Plan" title="Master" accent="Plan" sub="Zoom in to explore sectors, roads, parks and commercial zones." />
              <MasterPlanViewer src={masterPlan.medium_url ?? masterPlan.url} fullUrl={masterPlan.url} alt={`${project.name} master plan`} />
            </section>
          )}

          {(paymentPlans.length > 0 || planImages.length > 0) && (
            <section className="pj-section pj-band" aria-labelledby="pj-payment-plans">
              <SectionHead id="pj-payment-plans" eyebrow="Payment Plans" title="Payment" accent="Plans" sub="View or download the official payment plans for this project." />
              <Rail label="Payment plans">
                {paymentPlans.map((plan) => {
                  const rows = PLAN_ROWS.map((row) => ({ label: row.label, value: plan[row.key] as string | null })).filter((row) => row.value !== null);

                  return (
                    <DocCard key={plan.id} title={plan.name} kind={plan.unit_type ?? "Payment Plan"} image={plan.image_url} href={plan.pdf_url ?? plan.image_url}>
                      {rows.length > 0 ? (
                        <dl className="pj-plan-rows">
                          {rows.map((row) => (
                            <div key={row.label}>
                              <dt>{row.label}</dt>
                              <dd>{formatCompactPrice(row.value)}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : undefined}
                    </DocCard>
                  );
                })}
                {planImages.map((media, index) => (
                  <DocCard key={media.id} title={media.original_name?.replace(/\.[a-z0-9]+$/i, "") ?? `Payment plan ${index + 1}`} kind="Payment Plan" image={media.thumbnail_url ?? media.medium_url ?? media.url} href={media.url} />
                ))}
              </Rail>
              {paymentPlans.some((plan) => plan.notes) && (
                <ul className="pj-unit-plans">
                  {paymentPlans
                    .filter((plan) => plan.notes)
                    .map((plan) => (
                      <li key={plan.id}>
                        <strong>{plan.name}:</strong> {plan.notes}
                      </li>
                    ))}
                </ul>
              )}
            </section>
          )}

          {floorPlans.length > 0 && (
            <section className="pj-section" aria-labelledby="pj-floor-plans">
              <SectionHead id="pj-floor-plans" eyebrow="Floor Plans" title="Floor" accent="Plans" sub="Layouts for each unit type." align="start" />
              <Rail label="Floor plans">
                {floorPlans.map((plan) => (
                  <DocCard
                    key={plan.id}
                    title={plan.name}
                    kind={[
                      plan.unit_type,
                      plan.level ? `Floor ${plan.level}` : null,
                      plan.area_size && plan.area_unit ? formatArea(plan.area_size, plan.area_unit) : null,
                      plan.bedrooms !== null ? `${plan.bedrooms} beds` : null,
                      plan.bathrooms !== null ? `${plan.bathrooms} baths` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Floor Plan"}
                    image={plan.image_url}
                    href={plan.pdf_url ?? plan.image_url}
                  />
                ))}
              </Rail>
            </section>
          )}

          {brochures.length > 0 && (
            <section className="pj-section pj-band" aria-labelledby="pj-brochures">
              <SectionHead id="pj-brochures" eyebrow="Brochure" title="Project" accent="Brochure" sub="Download the official brochures to explore project details, payment plans, amenities and more." align="start" />
              <Rail label="Brochures">
                {brochures.map((brochure, index) => (
                  <DocCard
                    key={brochure.id}
                    title={brochure.original_name?.replace(/\.pdf$/i, "") ?? `Brochure ${index + 1}`}
                    kind={project.name}
                    image={brochure.thumbnail_url}
                    href={brochure.url}
                    cta="Download Brochure"
                  />
                ))}
              </Rail>
            </section>
          )}

          {showProgress && (
            <section className="pj-section pj-band" aria-labelledby="pj-progress">
              <SectionHead id="pj-progress" eyebrow="Development Progress" title="Development" accent="Progress" sub="Track the timeline, milestones and latest construction updates for this project." />

              <div className="pj-progress-top">
                {timeline.percent !== null && (
                  <div className="pj-progress-ring-card">
                    <div className="pj-ring" style={{ "--pct": timeline.percent } as CSSProperties} role="img" aria-label={`${timeline.percent}% of the timeline`}>
                      <span>
                        <strong>{timeline.percent}%</strong>
                        <small>{project.construction_status === "ready" ? "Completed" : "Timeline"}</small>
                      </span>
                    </div>
                    <div>
                      <strong>Overall Progress</strong>
                      <p>
                        {project.construction_status === "ready"
                          ? "The project is complete and ready for possession."
                          : project.construction_status === "upcoming"
                            ? "The project has not started construction yet."
                            : "Estimated from the launch and expected completion dates."}
                      </p>
                    </div>
                  </div>
                )}
                {timeline.monthsElapsed !== null && (
                  <div className="pj-progress-stat pj-tone-blue">
                    <span className="pj-stat-icon">
                      <ClockIcon />
                    </span>
                    <strong>{timeline.monthsElapsed}</strong>
                    <span>Months Elapsed</span>
                    <small>Since launch</small>
                  </div>
                )}
                <div className="pj-progress-stat pj-tone-green">
                  <span className="pj-stat-icon">
                    <ChartIcon />
                  </span>
                  <strong>{timeline.milestones.filter((milestone) => milestone.done).length}</strong>
                  <span>Milestones</span>
                  <small>Reached</small>
                </div>
                {timeline.monthsToGo !== null && (
                  <div className="pj-progress-stat pj-tone-orange">
                    <span className="pj-stat-icon">
                      <CalendarIcon />
                    </span>
                    <strong>{timeline.monthsToGo}</strong>
                    <span>Months</span>
                    <small>Estimated to completion</small>
                  </div>
                )}
                {project.completion_date && (
                  <div className="pj-progress-stat pj-tone-purple">
                    <span className="pj-stat-icon">
                      <BuildingIcon />
                    </span>
                    <strong>{completionOf(project.completion_date)}</strong>
                    <span>{project.construction_status === "ready" ? "Completed" : "Expected Completion"}</span>
                  </div>
                )}
              </div>

              <div className="pj-panel">
                <div className="pj-panel-head">
                  <span className="pj-panel-icon">
                    <ChartIcon />
                  </span>
                  <div>
                    <strong>Project Milestones</strong>
                    <small>Key milestones and development phases of the project.</small>
                  </div>
                </div>
                <ol className="pj-milestones">
                  {timeline.milestones.map((milestone) => (
                    <li key={milestone.key} className={`${milestone.done ? "is-done" : ""}${timeline.currentKey === milestone.key ? " is-current" : ""}`}>
                      {timeline.currentKey === milestone.key && <span className="pj-current-tag">Current Stage</span>}
                      <span className="pj-dot" aria-hidden="true" />
                      <small>{milestone.date ? completionOf(milestone.date) : milestone.key === "construction" ? CONSTRUCTION_STATUS_LABELS[project.construction_status] : "Date TBA"}</small>
                      <strong>{milestone.label}</strong>
                      <span>{milestone.note}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {construction.length > 0 && (
                <div className="pj-panel">
                  <div className="pj-panel-head">
                    <span className="pj-panel-icon">
                      <CameraIcon />
                    </span>
                    <div>
                      <strong>Construction Updates</strong>
                      <small>Latest images from the site showing development progress.</small>
                    </div>
                  </div>
                  <Rail label="Construction updates">
                    {construction.map((photo, index) => (
                      <a key={photo.id} className="pj-update" href={photo.medium_url ?? photo.url} target="_blank" rel="noopener noreferrer">
                        <Image src={photo.thumbnail_url ?? photo.medium_url ?? photo.url} alt={`Construction update ${index + 1}`} fill sizes="(max-width: 560px) 82vw, 220px" style={{ objectFit: "cover" }} />
                        {photo.original_name && <span>{photo.original_name.replace(/\.[a-z0-9]+$/i, "")}</span>}
                      </a>
                    ))}
                  </Rail>
                </div>
              )}
            </section>
          )}

          {(videos.length > 0 || project.video_url || project.virtual_tour_url) && (
            <section className="pj-section">
              <h2 className="pj-plain-title">Video &amp; Virtual Tour</h2>
              <div className="btn-wrap">
                {project.video_url && (
                  <a className="btn btn-outline" href={project.video_url} target="_blank" rel="noopener noreferrer">
                    ▶ Watch the project video
                  </a>
                )}
                {project.virtual_tour_url && (
                  <a className="btn btn-outline" href={project.virtual_tour_url} target="_blank" rel="noopener noreferrer">
                    Take the virtual tour
                  </a>
                )}
                {videos.map((video, index) => (
                  <a key={video.id} className="btn btn-outline" href={video.url} target="_blank" rel="noopener noreferrer">
                    ▶ Video {index + 1}
                  </a>
                ))}
              </div>
            </section>
          )}

          <section className="pj-section pj-card" aria-labelledby="pj-location">
            <SectionHead id="pj-location" title="Project" accent="Location" align="start" />
            <div className={`pj-location${locationMap ? " has-map" : ""}`}>
              {locationMap && (
                <a className="pj-location-map" href={locationMap.url} target="_blank" rel="noopener noreferrer">
                  <Image src={locationMap.medium_url ?? locationMap.url} alt={`${project.name} location map`} fill sizes="(max-width: 700px) 100vw, 420px" style={{ objectFit: "cover" }} />
                </a>
              )}
              <div>
                <p className="pj-address">
                  <PinIcon /> {address}
                </p>
                {project.landmark && <p className="pj-text">Near {project.landmark}</p>}
                {project.location_description && <p className="pj-text">{project.location_description}</p>}
                {project.maps_url && (
                  <a className="btn btn-outline" href={project.maps_url} target="_blank" rel="noopener noreferrer">
                    Open in Google Maps
                  </a>
                )}
              </div>
            </div>
          </section>

          <section className="pj-section pj-card" aria-labelledby="pj-developer">
            <SectionHead id="pj-developer" title="About the" accent="Developer" align="start" />
            <div className="pj-developer">
              <AgencyLogo name={project.developer?.name ?? project.developer_name} logoUrl={project.developer?.logo_url ?? null} size={64} />
              <div>
                <strong>{project.developer_name}</strong>
                {project.developer ? (
                  <Link href={developerHref(project.developer.slug)}>
                    View company profile &amp; all projects <ArrowRightIcon />
                  </Link>
                ) : (
                  project.developer_website && (
                    <a href={project.developer_website} target="_blank" rel="noopener noreferrer">
                      Developer website <ArrowRightIcon />
                    </a>
                  )
                )}
              </div>
            </div>
            {project.developer_description && <p className="pj-text">{project.developer_description}</p>}
            {developerFacts.length > 0 && (
              <dl className="pj-facts">
                {developerFacts.map((fact) => (
                  <div key={fact.label}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          {faqs.length > 0 && (
            <section className="pj-section pj-band" aria-labelledby="pj-faqs">
              <SectionHead
                id="pj-faqs"
                eyebrow="FAQs"
                title="Frequently Asked"
                accent="Questions"
                sub="Answers to the most common questions about this project. If you need more information, feel free to contact the team."
              />
              <div className="pj-faqs">
                {faqs.map((faq, index) => (
                  <details key={faq.question} name="pj-faq" open={index === 0}>
                    <summary>
                      <span className="pj-faq-num">{String(index + 1).padStart(2, "0")}</span>
                      <strong>{faq.question}</strong>
                      <ChevronDownIcon />
                    </summary>
                    <p>{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="pj-sidebar" id="enquire">
          <ProjectContactCard project={project} />

          {spotlight && (
            <Link href={propertyHref(spotlight)} className="pd-spotlight">
              <div className="pd-spotlight-cover">
                {spotlightCover ? (
                  <Image src={thumbnailUrl(spotlightCover)} alt={spotlight.title} fill sizes="(max-width: 991px) 100vw, 360px" style={{ objectFit: "cover" }} />
                ) : (
                  <HomeIcon className="placeholder-icon" />
                )}
                <span className="badge badge-featured">Featured</span>
              </div>
              <div className="pd-spotlight-body">
                <strong>{spotlight.title}</strong>
                <span className="pd-spotlight-location">
                  <PinIcon /> {[spotlight.sector, locationOf(spotlight)].filter(Boolean).join(", ")}
                </span>
                <span className="pd-spotlight-foot">
                  <b>{formatCompactPrice(spotlight.price)}</b>
                  {spotlight.area_size && spotlight.area_unit && <small>{formatArea(spotlight.area_size, spotlight.area_unit)}</small>}
                </span>
              </div>
            </Link>
          )}

          {agency && (
            <div className="pj-agency">
              <Link href={`/agencies/${agency.slug}`} className="pj-agency-cover" tabIndex={-1} aria-hidden="true">
                {agency.cover_url ? (
                  <Image src={agency.cover_url} alt="" fill sizes="360px" style={{ objectFit: "cover" }} />
                ) : (
                  <AgencyLogo name={agency.name} logoUrl={agency.logo_url} size={72} />
                )}
                <span className="badge badge-featured">Featured</span>
              </Link>
              <div className="pj-agency-body">
                <strong>
                  <Link href={`/agencies/${agency.slug}`}>{agency.name}</Link>
                </strong>
                {agency.is_verified && (
                  <span className="pj-agency-meta">
                    <ShieldCheckIcon /> Verified Dealer
                  </span>
                )}
                <span className="pj-agency-meta">
                  <PinIcon /> {agency.city?.name ? `DHA ${agency.city.name}` : "DHA Gujranwala"}
                </span>
                <ul className="pj-agency-stats">
                  <li>
                    <HomeIcon />
                    <span>
                      <b>{(agency.listings_count ?? 0).toLocaleString("en-PK")}</b>
                      <small>Properties</small>
                    </span>
                  </li>
                  {agency.established_year && (
                    <li>
                      <CalendarIcon />
                      <span>
                        <b>{Math.max(1, new Date().getFullYear() - agency.established_year)}+</b>
                        <small>Years</small>
                      </span>
                    </li>
                  )}
                  <li>
                    <HandshakeIcon />
                    <span>
                      <b>{(agency.sold_count ?? 0).toLocaleString("en-PK")}</b>
                      <small>Sold</small>
                    </span>
                  </li>
                </ul>
                <Link href={`/agencies/${agency.slug}`} className="btn btn-primary pj-agency-btn">
                  View Dealer Profile <ArrowRightIcon />
                </Link>
              </div>
            </div>
          )}

          <BannerSlot key={project.id} placement="listing_sidebar" />

          <div className="pj-sticky">
            <div className="contact-card">
              <InquiryForm slug={project.slug} title={project.name} subject="project" />
            </div>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="section pd-related" aria-labelledby="similar-projects">
          <div className="section-head">
            <div>
              <h2 id="similar-projects">More Projects</h2>
              <p>Other projects in {project.city?.name ?? "this city"}</p>
            </div>
            <Link href="/projects" className="pd-view-all">
              View All <ArrowRightIcon />
            </Link>
          </div>
          <Rail label="More projects">
            {similar.map((other) => (
              <ProjectCard key={other.id} project={other} />
            ))}
          </Rail>
        </section>
      )}
    </div>
  );
}

