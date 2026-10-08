import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AgencyLogo } from "@/components/agency-card";
import { WorkGallery } from "@/components/developer/work-gallery";
import {
  ArrowRightIcon,
  BadgeIcon,
  BriefcaseIcon,
  BuildingIcon,
  CalendarIcon,
  ChartIcon,
  ChevronDownIcon,
  ClockIcon,
  CrownIcon,
  DocumentIcon,
  GlobeIcon,
  HashIcon,
  LayersIcon,
  LinkedInIcon,
  FacebookIcon,
  MailIcon,
  MapIcon,
  PhoneIcon,
  PinIcon,
  QuoteIcon,
  ShieldCheckIcon,
  ShieldIcon,
  StarIcon,
  UsersIcon,
  WhatsAppIcon,
} from "@/components/icons";
import { ProjectCard } from "@/components/project-card";
import { Rail } from "@/components/rail";
import { SectionIcon } from "@/components/section-icon";
import { SocialIcon } from "@/components/social-icon";
import { DEVELOPER_TYPE_LABELS, developerHref, developerSocials, getDeveloper, sectionHeading, yearsInBusiness } from "@/lib/developers";
import { whatsappNumber } from "@/lib/property";
import { jsonLd, metaText, openGraph } from "@/lib/seo";
import { getSiteSettings, siteNameOf } from "@/lib/site-data";
import { siteUrl } from "@/lib/site";
import type { DeveloperLeader, DeveloperStat, DeveloperTeamMember, PublicDeveloper } from "@/types/api";

function pageOf(value: string | string[] | undefined): number {
  return Math.max(1, Number.parseInt(typeof value === "string" ? value : "", 10) || 1);
}

/** Labels and icons for the experience & statistics block, in display order. */
const STAT_LABELS: { key: DeveloperStat; label: string; icon: (props: { className?: string }) => ReactNode }[] = [
  { key: "years_experience", label: "Years of experience", icon: CalendarIcon },
  { key: "total_projects", label: "Total projects", icon: BuildingIcon },
  { key: "completed_projects", label: "Completed projects", icon: ShieldCheckIcon },
  { key: "ongoing_projects", label: "Ongoing projects", icon: ChartIcon },
  { key: "upcoming_projects", label: "Upcoming projects", icon: LayersIcon },
  { key: "cities_covered", label: "Cities covered", icon: PinIcon },
  { key: "total_units", label: "Total units developed", icon: UsersIcon },
];

/** Icons for the trust strip under the header; highlights are free text, so they take turns. */
const HIGHLIGHT_ICONS = [ShieldCheckIcon, StarIcon, UsersIcon, LayersIcon, BuildingIcon, BadgeIcon];

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

function SectionHead({ eyebrow, title, accent, text, center = false }: { eyebrow?: string; title: string; accent?: string; text?: string; center?: boolean }) {
  return (
    <div className={`dv-head${center ? " dv-head-center" : ""}`}>
      {eyebrow && <span className="dv-eyebrow">{eyebrow}</span>}
      <h2>
        {title}
        {accent && (
          <>
            {" "}
            <span>{accent}</span>
          </>
        )}
      </h2>
      {text && <p>{text}</p>}
    </div>
  );
}

function Stat({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <li className="dv-stat">
      <span className="dv-stat-icon">{icon}</span>
      <span>
        <strong>{value}</strong>
        <small>{label}</small>
      </span>
    </li>
  );
}

function MemberLinks({ member }: { member: DeveloperTeamMember }) {
  if (!member.linkedin && !member.facebook && !member.email) {
    return null;
  }

  return (
    <span className="dv-member-links">
      {member.linkedin && (
        <a href={member.linkedin} target="_blank" rel="noopener noreferrer nofollow" aria-label={`${member.name} on LinkedIn`}>
          <LinkedInIcon className="icon" />
        </a>
      )}
      {member.facebook && (
        <a href={member.facebook} target="_blank" rel="noopener noreferrer nofollow" aria-label={`${member.name} on Facebook`}>
          <FacebookIcon className="icon" />
        </a>
      )}
      {member.email && (
        <a href={`mailto:${member.email}`} aria-label={`Email ${member.name}`}>
          <MailIcon className="icon" />
        </a>
      )}
    </span>
  );
}

function MemberPhoto({ member, sizes }: { member: DeveloperTeamMember | DeveloperLeader; sizes: string }) {
  return (
    <div className="dv-member-photo">
      {member.photo_url ? (
        <Image src={member.photo_url} alt={member.name} fill sizes={sizes} style={{ objectFit: "cover", objectPosition: "top" }} />
      ) : (
        <span className="dv-member-initials" aria-hidden="true">
          {member.name
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("")}
        </span>
      )}
    </div>
  );
}

/** Registration facts in the order of the "Registered & verified" grid, skipping empty ones. */
function registrationOf(developer: PublicDeveloper): { icon: ReactNode; label: string; value: string; note: string }[] {
  const facts: { icon: ReactNode; label: string; value: string | null; note: string }[] = [
    { icon: <BuildingIcon className="icon" />, label: "Legal company name", value: developer.legal_name, note: "Legal entity" },
    { icon: <BuildingIcon className="icon" />, label: "Registered company name", value: developer.registered_name, note: "As registered with SECP" },
    { icon: <DocumentIcon className="icon" />, label: "SECP registration", value: developer.registration_number, note: "Securities and Exchange Commission of Pakistan" },
    { icon: <BriefcaseIcon className="icon" />, label: "Business type", value: developer.business_type, note: "Legal structure" },
    { icon: <HashIcon className="icon" />, label: "NTN", value: developer.ntn_number, note: "National Tax Number" },
    { icon: <HashIcon className="icon" />, label: "STRN", value: developer.strn_number, note: "Sales Tax Registration Number" },
    { icon: <ShieldIcon className="icon" />, label: "Licence number", value: developer.license_number, note: "Real estate licence" },
    { icon: <BadgeIcon className="icon" />, label: "Licence issuing authority", value: developer.license_authority, note: "Issued by" },
    { icon: <CalendarIcon className="icon" />, label: "Year established", value: developer.established_year ? String(developer.established_year) : null, note: "Founded" },
  ];

  return facts.filter((fact): fact is (typeof facts)[number] & { value: string } => Boolean(fact.value));
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
  const siteName = siteNameOf(await getSiteSettings());
  const figures = developer.stats;
  const total = figures?.total_projects ?? developer.projects_count ?? projects.meta.total;
  const years = figures ? figures.years_experience : yearsInBusiness(developer);
  const whatsapp = whatsappNumber(developer.whatsapp ?? developer.phone);
  const location = [developer.address, developer.city?.name].filter(Boolean).join(", ");
  const socials = developerSocials(developer);
  const kind = DEVELOPER_TYPE_LABELS[developer.company_type];
  const cityName = developer.city?.name;

  const sections = developer.sections ?? {};
  const team = developer.team ?? [];
  const leaders = developer.leadership ?? [];
  const gallery = developer.gallery ?? [];
  const faqs = developer.faqs ?? [];
  const coreValues = developer.core_values ?? [];
  const expertise = developer.expertise ?? [];
  const overviewImage = sections.overview?.image_url ?? gallery[0]?.url ?? developer.cover_url;
  const overviewButton = {
    label: sections.overview?.button_label?.trim() || "View Our Projects",
    href: sections.overview?.button_url?.trim() || (total > 0 ? "#projects" : null),
  };
  const registration = registrationOf(developer);
  const story = (
    [
      { key: "history", eyebrow: "Our story", title: "Company History", text: developer.history, icon: <ClockIcon className="icon" /> },
      { key: "mission", eyebrow: "Our purpose", title: "Our Mission", text: developer.mission, icon: <ChartIcon className="icon" /> },
      { key: "vision", eyebrow: "Looking ahead", title: "Our Vision", text: developer.vision, icon: <GlobeIcon className="icon" /> },
    ] as const
  )
    .filter((card) => Boolean(card.text))
    .map((card) => {
      const typed = sections[card.key];

      return {
        ...card,
        text: card.text as string,
        eyebrow: typed?.label?.trim() || card.eyebrow,
        title: typed?.heading?.trim() || card.title,
        image: typed?.image_url ?? null,
        icon: typed?.icon ? <SectionIcon name={typed.icon} className="icon" /> : card.icon,
      };
    });
  const isVerified = developer.verification_status ? developer.verification_status === "verified" : developer.is_verified;
  const head = (section: Parameters<typeof sectionHeading>[1], fallback: Parameters<typeof sectionHeading>[2]) => sectionHeading(developer, section, fallback);

  const pageUrl = `${siteUrl()}${developerHref(developer.slug)}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${pageUrl}#organization`,
    name: developer.name,
    legalName: developer.legal_name ?? undefined,
    url: pageUrl,
    logo: developer.logo_url ?? undefined,
    image: developer.cover_url ?? developer.logo_url ?? undefined,
    description: developer.short_description ?? undefined,
    telephone: developer.phone ?? undefined,
    email: developer.email ?? undefined,
    taxID: developer.ntn_number ?? undefined,
    foundingDate: developer.established_year ? String(developer.established_year) : undefined,
    sameAs: [developer.website, ...socials.map((social) => social.url)].filter(Boolean),
    address: location ? { "@type": "PostalAddress", streetAddress: developer.address ?? undefined, addressLocality: developer.city?.name, addressCountry: "PK" } : undefined,
    employee:
      leaders.length + team.length > 0 ? [...leaders, ...team].map((member) => ({ "@type": "Person", name: member.name, jobTitle: member.designation ?? undefined })) : undefined,
  };
  const faqData =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
        }
      : null;
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

  // Every figure that has a value; the total always shows so the hero never looks empty.
  const allStats = STAT_LABELS.map(({ key, label, icon: Icon }) => {
    const value = key === "total_projects" ? total : key === "years_experience" ? years : (figures?.[key] ?? (key === "completed_projects" ? developer.completed_projects_count : key === "ongoing_projects" ? developer.ongoing_projects_count : null));

    return value || key === "total_projects"
      ? { key, icon: <Icon className="icon" />, value: `${(value ?? 0).toLocaleString("en-PK")}${key === "years_experience" ? "+" : ""}`, label }
      : null;
  }).filter((stat) => stat !== null);
  // The overview repeats the four headline figures, as in the spec's "Company Overview" block.
  const stats = allStats.filter((stat) => ["years_experience", "total_projects", "completed_projects", "ongoing_projects"].includes(stat.key));

  return (
    <div className="container page-section dv-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />
      {page === 1 && faqData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqData) }} />}

      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/developers">Developers</Link>
        <span>/</span>
        <span aria-current="page">{developer.name}</span>
      </nav>

      {/* Header */}
      <section className={`dv-hero${developer.cover_url ? " dv-hero-cover" : ""}`}>
        {developer.cover_url && (
          <div className="dv-hero-image" aria-hidden="true">
            <Image src={developer.cover_url} alt="" fill priority sizes="(max-width: 900px) 100vw, 60vw" style={{ objectFit: "cover" }} />
          </div>
        )}
        <div className="dv-hero-body">
          <div className="dv-hero-logo">
            <AgencyLogo name={developer.name} logoUrl={developer.logo_url} size={150} />
          </div>
          <div className="dv-hero-text">
            <h1>{developer.name}</h1>
            <div className="dv-badges">
              {isVerified && (
                <span className="dv-badge dv-badge-verified">
                  <ShieldCheckIcon className="icon" /> Verified {kind}
                </span>
              )}
              {developer.is_featured && (
                <span className="dv-badge dv-badge-featured">
                  <CrownIcon className="icon" /> Featured
                </span>
              )}
            </div>
            {developer.tagline && <p className="dv-tagline">{developer.tagline}</p>}
            <div className="dv-hero-meta">
              <span className="dv-chip">{kind}</span>
              {(cityName || developer.address) && (
                <span>
                  <PinIcon className="icon" /> {cityName ?? developer.address}
                </span>
              )}
            </div>
            <ul className="dv-hero-stats">
              {stats.slice(0, 3).map(({ key, ...stat }) => (
                <Stat key={key} {...stat} />
              ))}
            </ul>
            <div className="dv-actions">
              {developer.phone && (
                <a className="btn btn-primary" href={`tel:${developer.phone}`}>
                  <PhoneIcon className="icon" /> Call Now
                </a>
              )}
              {whatsapp && (
                <a className="btn btn-whatsapp" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="icon" /> WhatsApp
                </a>
              )}
              {developer.website && (
                <a className="btn btn-outline" href={developer.website} target="_blank" rel="noopener noreferrer nofollow">
                  <GlobeIcon className="icon" /> Visit Website
                </a>
              )}
            </div>
          </div>
        </div>
        {developer.highlights.length > 0 && (
          <ul className="dv-trust">
            {developer.highlights.slice(0, 6).map((highlight, index) => {
              const Icon = HIGHLIGHT_ICONS[index % HIGHLIGHT_ICONS.length];

              return (
                <li key={highlight}>
                  <Icon className="icon" />
                  <span>{highlight}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {page === 1 && (
        <>
          {/* Company overview */}
          {(developer.description || developer.short_description) && (
            <section className={`dv-section dv-overview${overviewImage ? "" : " dv-overview-solo"}`}>
              <div>
                <SectionHead {...head("overview", { eyebrow: "About company", title: "Company Overview" })} />
                {developer.description ? (
                  // Sanitised by the API before it is stored.
                  <div className="prose" dangerouslySetInnerHTML={{ __html: developer.description }} />
                ) : (
                  <p className="dv-text">{developer.short_description}</p>
                )}
                {stats.length > 0 && (
                  <ul className="dv-overview-stats">
                    {stats.map(({ key, ...stat }) => (
                      <Stat key={key} {...stat} />
                    ))}
                  </ul>
                )}
                {overviewButton.href && (
                  <a className="btn btn-primary" href={overviewButton.href} {...(overviewButton.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    {overviewButton.label} <ArrowRightIcon className="icon" />
                  </a>
                )}
              </div>
              {overviewImage && (
                <div className="dv-overview-image">
                  <Image src={overviewImage} alt={`${developer.name} project`} fill sizes="(max-width: 900px) 100vw, 45vw" style={{ objectFit: "cover" }} />
                  {isVerified && (
                    <span className="dv-float-badge">
                      <ShieldCheckIcon className="icon" />
                      <span>
                        <strong>Trusted {kind.toLowerCase()}</strong>
                        {cityName && <small>in {cityName}</small>}
                      </span>
                    </span>
                  )}
                </div>
              )}
            </section>
          )}

          {/* History / mission / vision */}
          {story.length > 0 && (
            <section className="dv-section dv-story">
              {story.map((card, index) => (
                <article key={card.key} className={`dv-card dv-story-card${card.image ? " dv-story-card-image" : ""}`}>
                  {card.image ? (
                    <div className="dv-story-image">
                      <Image src={card.image} alt="" fill sizes="(max-width: 900px) 100vw, 33vw" style={{ objectFit: "cover" }} />
                    </div>
                  ) : (
                    <>
                      <span className="dv-story-number" aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="dv-icon-chip">{card.icon}</span>
                    </>
                  )}
                  <span className="dv-eyebrow dv-story-eyebrow">{card.eyebrow}</span>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                </article>
              ))}
            </section>
          )}

          {/* Values, expertise, experience */}
          {(coreValues.length > 0 || expertise.length > 0) && (
            <section className="dv-section dv-pillars">
              {coreValues.length > 0 && (
                <div className="dv-card">
                  <SectionHead
                    {...head("values", { eyebrow: "Our principles", title: "Core Values", text: "The values that guide everything we do and the long-term relationships we build." })}
                  />
                  <ul className="dv-values">
                    {coreValues.map((value) => (
                      <li key={value.title}>
                        <span className="dv-icon-chip dv-icon-chip-sm">
                          <SectionIcon name={value.icon} className="icon" />
                        </span>
                        <span>
                          <strong>{value.title}</strong>
                          {value.text && <small>{value.text}</small>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {expertise.length > 0 && (
                <div className="dv-card">
                  <SectionHead {...head("expertise", { eyebrow: "What we do", title: "Areas of Expertise" })} />
                  <ul className="dv-expertise">
                    {expertise.map((item) => (
                      <li key={item.title}>
                        <span className="dv-icon-chip dv-icon-chip-sm">
                          <SectionIcon name={item.icon} className="icon" />
                        </span>
                        <strong>{item.title}</strong>
                        {item.text && <small>{item.text}</small>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Experience & statistics */}
          {allStats.length > 1 && (
            <section className="dv-section dv-stats-section">
              <div className="dv-experience-intro">
                <SectionHead {...head("stats", { eyebrow: "Our experience", title: "Experience &", accent: "Statistics" })} />
                {years ? (
                  <p className="dv-text">
                    {developer.established_year ? `Since ${developer.established_year}, ` : ""}
                    {developer.name} has been delivering {kind.toLowerCase()} work{cityName ? ` in ${cityName}` : ""}.
                  </p>
                ) : null}
              </div>
              <ul className="dv-stats-grid">
                {allStats.map(({ key, ...stat }) => (
                  <Stat key={key} {...stat} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {/* Projects */}
      <section className="dv-section dv-projects" id="projects">
        <SectionHead
          {...head("projects", {
            eyebrow: "Our projects",
            title: "Projects /",
            accent: "Portfolio",
            text: `${projects.meta.total.toLocaleString("en-PK")} live project${projects.meta.total === 1 ? "" : "s"} by ${developer.name}.`,
          })}
          center
        />
        {projects.data.length === 0 ? (
          <div className="empty-results">
            <div style={{ fontSize: 44 }}>🏗️</div>
            <h2>No live projects right now</h2>
            <p>Check back soon, or contact the company directly.</p>
          </div>
        ) : (
          <>
            <Rail label={`Projects by ${developer.name}`}>
              {projects.data.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </Rail>
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
      </section>

      {page === 1 && (
        <>
          {/* Gallery */}
          {gallery.length > 0 && (
            <section className="dv-section">
              <SectionHead
                {...head("gallery", { title: "Our Work", accent: "Gallery", text: "Construction progress, completed homes, architectural details and development work." })}
                center
              />
              <WorkGallery photos={gallery} name={developer.name} />
            </section>
          )}

          {/* Leadership */}
          {leaders.length > 0 && (
            <section className="dv-section">
              <SectionHead
                {...head("leadership", {
                  title: "Team /",
                  accent: "Leadership",
                  text: "The people behind our success, committed to quality construction and real estate solutions.",
                })}
              />
              <div className="dv-leaders">
                {leaders.map((leader) => (
                  <article key={`${leader.name}-${leader.designation ?? ""}`} className="dv-leader">
                    <div className="dv-leader-photo">
                      <MemberPhoto member={leader} sizes="(max-width: 900px) 100vw, 420px" />
                      {leader.designation && (
                        <span className="dv-leader-tag">
                          <CrownIcon className="icon" /> {leader.designation}
                        </span>
                      )}
                    </div>
                    <div className="dv-leader-body">
                      <h3>{leader.name}</h3>
                      {leader.designation && <p className="dv-member-role">{leader.designation}</p>}
                      {leader.bio && <p className="dv-text dv-pre">{leader.bio}</p>}
                      {(leader.experience || leader.specialization) && (
                        <ul className="dv-leader-facts">
                          {leader.experience && (
                            <li>
                              <CalendarIcon className="icon" />
                              <span>
                                <strong>{leader.experience}</strong>
                                <small>Experience</small>
                              </span>
                            </li>
                          )}
                          {leader.specialization && (
                            <li>
                              <BriefcaseIcon className="icon" />
                              <span>
                                <strong>{leader.specialization}</strong>
                                <small>Specialization</small>
                              </span>
                            </li>
                          )}
                        </ul>
                      )}
                      {leader.quote && (
                        <blockquote className="dv-quote">
                          <QuoteIcon className="icon" />
                          <p>{leader.quote}</p>
                          {leader.signature_url ? (
                            // eslint-disable-next-line @next/next/no-img-element -- a small transparent signature image of unknown size
                            <img className="dv-signature" src={leader.signature_url} alt={`${leader.name}'s signature`} loading="lazy" />
                          ) : (
                            <cite>{leader.name}</cite>
                          )}
                        </blockquote>
                      )}
                      {!leader.quote && leader.signature_url && (
                        // eslint-disable-next-line @next/next/no-img-element -- a small transparent signature image of unknown size
                        <img className="dv-signature" src={leader.signature_url} alt={`${leader.name}'s signature`} loading="lazy" />
                      )}
                      <MemberLinks member={leader} />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Team */}
          {team.length > 0 && (
            <section className="dv-section">
              <SectionHead {...head("team", { title: "Our", accent: "Team" })} />
              <ul className="dv-team">
                {team.map((member) => (
                  <li key={`${member.name}-${member.designation ?? ""}`} className="dv-member">
                    <MemberPhoto member={member} sizes="(max-width: 640px) 40vw, 180px" />
                    <div className="dv-member-body">
                      {member.designation && <span className="dv-member-tag">{member.designation}</span>}
                      <h3>{member.name}</h3>
                      {member.bio && <p>{member.bio}</p>}
                      {member.specialization && (
                        <p className="dv-member-spec">
                          <BriefcaseIcon className="icon" /> {member.specialization}
                        </p>
                      )}
                      <div className="dv-member-foot">
                        {member.experience && (
                          <span className="dv-member-exp">
                            <CalendarIcon className="icon" /> {member.experience}
                          </span>
                        )}
                        <MemberLinks member={member} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Registration */}
          {registration.length > 0 && (
            <section className="dv-section dv-registration">
              <div className="dv-registration-head">
                <SectionHead {...head("registration", { eyebrow: "Company registration & verification", title: "Registered & Verified", accent: kind })} />
                {isVerified && (
                  <span className="dv-verified-box">
                    {developer.verification_badge_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- an admin-uploaded seal of unknown size
                      <img className="dv-verified-seal" src={developer.verification_badge_url} alt="Verification badge" loading="lazy" />
                    ) : (
                      <ShieldCheckIcon className="icon" />
                    )}
                    <span>
                      <strong>Verified company</strong>
                      <small>Documents checked by {siteName}</small>
                    </span>
                  </span>
                )}
              </div>
              <ul className="dv-reg-grid">
                {registration.map((fact) => (
                  <li key={fact.label}>
                    <span className="dv-icon-chip dv-icon-chip-sm">{fact.icon}</span>
                    <span>
                      <small>{fact.label}</small>
                      <strong>{fact.value}</strong>
                      <em>{fact.note}</em>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Contact */}
          {(developer.phone || developer.email || location || whatsapp || socials.length > 0) && (
            <section className="dv-section dv-contact" id="contact">
              <SectionHead
                {...head("contact", { eyebrow: "Contact us", title: "Get in", accent: "Touch", text: `Visit our office, call, WhatsApp or email ${developer.name} about any project.` })}
              />
              <ul className="dv-contact-list">
                {developer.email && (
                  <li>
                    <span className="dv-icon-chip dv-icon-chip-sm">
                      <MailIcon className="icon" />
                    </span>
                    <span>
                      <small>Email</small>
                      <a href={`mailto:${developer.email}`}>{developer.email}</a>
                    </span>
                  </li>
                )}
                {developer.phone && (
                  <li>
                    <span className="dv-icon-chip dv-icon-chip-sm">
                      <PhoneIcon className="icon" />
                    </span>
                    <span>
                      <small>Phone</small>
                      <a href={`tel:${developer.phone}`}>{developer.phone}</a>
                    </span>
                  </li>
                )}
                {location && (
                  <li>
                    <span className="dv-icon-chip dv-icon-chip-sm">
                      <PinIcon className="icon" />
                    </span>
                    <span>
                      <small>Office address</small>
                      <span>{location}</span>
                      {developer.google_maps_url && (
                        <a className="dv-map-link" href={developer.google_maps_url} target="_blank" rel="noopener noreferrer nofollow">
                          <MapIcon className="icon" /> View on Google Maps
                        </a>
                      )}
                    </span>
                  </li>
                )}
                {developer.business_hours && (
                  <li>
                    <span className="dv-icon-chip dv-icon-chip-sm">
                      <ClockIcon className="icon" />
                    </span>
                    <span>
                      <small>Business hours</small>
                      <span>{developer.business_hours}</span>
                    </span>
                  </li>
                )}
              </ul>
              <div className="dv-contact-actions">
                {developer.phone && (
                  <a className="dv-contact-btn dv-contact-call" href={`tel:${developer.phone}`}>
                    <PhoneIcon className="icon" />
                    <span>
                      <strong>Call Now</strong>
                      <small>{developer.phone}</small>
                    </span>
                    <ArrowRightIcon className="icon" />
                  </a>
                )}
                {whatsapp && (
                  <a className="dv-contact-btn dv-contact-whatsapp" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon className="icon" />
                    <span>
                      <strong>WhatsApp</strong>
                      <small>Chat with us on WhatsApp</small>
                    </span>
                    <ArrowRightIcon className="icon" />
                  </a>
                )}
                {developer.email && (
                  <a className="dv-contact-btn" href={`mailto:${developer.email}?subject=${encodeURIComponent(`Inquiry from ${siteName}`)}`}>
                    <MailIcon className="icon" />
                    <span>
                      <strong>Send Inquiry</strong>
                      <small>Get in touch with our team</small>
                    </span>
                    <ArrowRightIcon className="icon" />
                  </a>
                )}
              </div>
              {socials.length > 0 && (
                <div className="dv-follow">
                  <div>
                    <span className="dv-eyebrow">{sections.social?.label?.trim() || "Follow us"}</span>
                    <h3>{sections.social?.heading?.trim() || "Connect With Us"}</h3>
                    <p>{sections.social?.description?.trim() || "Stay updated with the latest projects and company news."}</p>
                  </div>
                  <ul>
                    {socials.map((social) => (
                      <li key={social.key}>
                        <a className={`dv-social dv-social-${social.key}`} href={social.url} target="_blank" rel="noopener noreferrer nofollow">
                          <SocialIcon network={social.key} />
                          <span>{social.label}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* FAQs */}
          {faqs.length > 0 && (
            <section className="dv-section">
              <SectionHead {...head("faqs", { eyebrow: "FAQs", title: "Frequently Asked", accent: "Questions" })} center />
              <div className="pj-faqs" id="dv-faqs">
                {faqs.map((faq, index) => (
                  <details key={faq.question} name="dv-faq" open={index === 0}>
                    <summary>
                      <span className="pj-faq-num">{String(index + 1).padStart(2, "0")}</span>
                      <strong>{faq.question}</strong>
                      <ChevronDownIcon />
                    </summary>
                    {/* Sanitised by the API before it is stored. */}
                    <div className="pj-faq-answer prose pj-html" dangerouslySetInnerHTML={{ __html: faq.answer }} />
                  </details>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
