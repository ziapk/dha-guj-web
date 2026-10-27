import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { SectionIcon } from "@/components/section-icon";
import { ABOUT_SLUG, getAboutPage } from "@/lib/cms-sections";
import { sizedImage } from "@/lib/image";
import { cmsPageSchemas } from "@/lib/page-schema";
import { adminShareImage, notFoundMetadata, pageMetadata } from "@/lib/seo";
import { getSiteSettings, siteNameOf } from "@/lib/site-data";
import { brandRef, imageObject, sameAsLinks } from "@/lib/schema";

export const revalidate = 300;

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export async function generateMetadata(): Promise<Metadata> {
  const result = await getAboutPage();

  if (!result) {
    return notFoundMetadata("About us");
  }

  const { page, sections } = result;
  return pageMetadata({
    title: page.meta_title ?? page.title,
    description: page.meta_description ?? sections.hero.subtitle ?? page.title,
    path: `/${ABOUT_SLUG}`,
    images: [adminShareImage(page), sections.hero.image_url && { url: sections.hero.image_url }],
  });
}

export default async function AboutPage() {
  const result = await getAboutPage();

  if (!result) {
    notFound();
  }

  const { page, sections } = result;
  const settings = await getSiteSettings();
  const siteName = siteNameOf(settings);

  const structuredData = cmsPageSchemas(page, `/${ABOUT_SLUG}`, {
    type: "AboutPage",
    mainEntity: brandRef(),
    about: brandRef(),
    extra: {
      mentions: sections.leadership.map((person) => ({
        "@type": "Person",
        name: person.name,
        jobTitle: person.role ?? undefined,
        image: imageObject(person.photo_url, { caption: person.name }),
        sameAs: sameAsLinks([person.linkedin]),
        worksFor: brandRef(),
      })),
    },
  });

  return (
    <>
      <JsonLd data={structuredData} />

      <section className={`page-banner${sections.hero.image_url ? " has-image" : ""}`}>
        {sections.hero.image_url && <Image src={sizedImage(sections.hero.image_url, "medium")} alt="" fill priority sizes="100vw" style={{ objectFit: "cover" }} />}
        <div className="container page-banner-body">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span aria-current="page">{page.title}</span>
          </nav>
          <h1>{sections.hero.title ?? page.title}</h1>
          {sections.hero.subtitle && <p>{sections.hero.subtitle}</p>}
        </div>
      </section>

      <div className="container page-section">
        {sections.intro_html && (
          // Sanitised by the API before it is stored.
          <div className="prose" dangerouslySetInnerHTML={{ __html: sections.intro_html }} />
        )}

        {sections.stats.length > 0 && (
          <section className="fact-grid about-stats" aria-label="Key numbers">
            {sections.stats.map((stat) => (
              <div key={stat.label} className="fact">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </section>
        )}

        {sections.offers.length > 0 && (
          <section className="section-tight" aria-labelledby="what-we-offer">
            <div className="section-head">
              <h2 id="what-we-offer">What we offer</h2>
            </div>
            <div className="feature-grid">
              {sections.offers.map((offer) => (
                <article key={offer.title} className="feature-card">
                  <span className="feature-icon">
                    <SectionIcon name={offer.icon} />
                  </span>
                  <h3>{offer.title}</h3>
                  {offer.text && <p>{offer.text}</p>}
                </article>
              ))}
            </div>
          </section>
        )}

        {sections.why_us.length > 0 && (
          <section className="section-tight" aria-labelledby="why-choose-us">
            <div className="section-head">
              <h2 id="why-choose-us">Why choose us</h2>
            </div>
            <div className="feature-grid">
              {sections.why_us.map((reason) => (
                <article key={reason.title} className="feature-card">
                  <span className="feature-icon">
                    <SectionIcon name={reason.icon} />
                  </span>
                  <h3>{reason.title}</h3>
                  {reason.text && <p>{reason.text}</p>}
                </article>
              ))}
            </div>
          </section>
        )}

        {(sections.vision.text || sections.mission.text || sections.mission.points.length > 0) && (
          <section className="vision-mission" aria-label="Vision and mission">
            {sections.vision.text && (
              <div className="aside-card tinted">
                <h2>{sections.vision.heading ?? "Our vision"}</h2>
                <p>{sections.vision.text}</p>
              </div>
            )}
            {(sections.mission.text || sections.mission.points.length > 0) && (
              <div className="aside-card">
                <h2>{sections.mission.heading ?? "Our mission"}</h2>
                {sections.mission.text && <p>{sections.mission.text}</p>}
                {sections.mission.points.length > 0 && (
                  <ul className="amenity-list">
                    {sections.mission.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        )}

        {sections.leadership.length > 0 && (
          <section className="section-tight" aria-labelledby="leadership">
            <div className="section-head">
              <h2 id="leadership">Leadership</h2>
            </div>
            <div className="leader-grid">
              {sections.leadership.map((person) => (
                <article key={person.name} className="leader-card">
                  <span className="agent-photo">
                    {person.photo_url ? (
                      <Image src={sizedImage(person.photo_url, "thumbnail")} alt={person.name} fill sizes="140px" style={{ objectFit: "cover" }} />
                    ) : (
                      <span aria-hidden="true">{initials(person.name)}</span>
                    )}
                  </span>
                  <h3>{person.name}</h3>
                  {person.role && <p className="leader-role">{person.role}</p>}
                  {person.bio && <p className="leader-bio">{person.bio}</p>}
                  {person.linkedin && (
                    <a className="chip" href={person.linkedin} target="_blank" rel="noopener noreferrer">
                      LinkedIn
                    </a>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {(sections.cta.heading || sections.cta.button_label) && (
          <section className="sell-banner" aria-label="Get in touch">
            <div className="sell-banner-body">
              <h2>{sections.cta.heading ?? `Talk to ${siteName}`}</h2>
              {sections.cta.text && <p>{sections.cta.text}</p>}
            </div>
            <div className="sell-banner-actions">
              <Link className="btn btn-primary" href={sections.cta.button_url ?? "/contact"}>
                {sections.cta.button_label ?? "Contact us"}
              </Link>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
