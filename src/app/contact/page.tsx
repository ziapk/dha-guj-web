import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AgencyCard } from "@/components/agency-card";
import { ContactForm } from "@/components/contact-form";
import { SectionIcon } from "@/components/section-icon";
import { ContactList, SocialLinks } from "@/components/site-contact";
import { publicApi } from "@/lib/api";
import { CONTACT_SLUG, getContactPage } from "@/lib/cms-sections";
import { jsonLd, metaText, openGraph } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import { getSiteSettings, hasContactDetails, siteNameOf } from "@/lib/site-data";
import type { AgencyProfile, Paginated } from "@/types/api";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const result = await getContactPage();

  if (!result) {
    return { title: "Contact us", robots: { index: false } };
  }

  const { page, sections } = result;
  const title = page.meta_title ?? page.title;
  const description = metaText(page.meta_description ?? sections.hero.subtitle ?? page.title);
  const url = `/${CONTACT_SLUG}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: await openGraph({
      title,
      description,
      url,
      images: sections.hero.image_url ? [{ url: sections.hero.image_url }] : undefined,
    }),
    twitter: { card: sections.hero.image_url ? "summary_large_image" : "summary", title, description },
  };
}

export default async function ContactPage() {
  const result = await getContactPage();

  if (!result) {
    notFound();
  }

  const { page, sections } = result;
  const settings = await getSiteSettings();
  const siteName = siteNameOf(settings);
  const hasSocial = Object.values(settings.social).some(Boolean);

  // The dealers strip reuses the verified agencies already on the site.
  const dealers = sections.dealers.show
    ? await publicApi<Paginated<AgencyProfile>>("agencies", { query: { per_page: 8 }, revalidate: 300 })
        .then((response) => response.data)
        .catch(() => [] as AgencyProfile[])
    : [];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: page.meta_title ?? page.title,
    url: `${siteUrl()}/${CONTACT_SLUG}`,
    dateModified: page.updated_at ?? undefined,
    mainEntity: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl(),
      logo: settings.general.logo_url ?? undefined,
      telephone: settings.contact.phone ?? undefined,
      email: settings.contact.email ?? undefined,
      address: settings.contact.address ?? undefined,
      openingHours: sections.office_hours.map((row) => `${row.days} ${row.hours}`),
      sameAs: Object.values(settings.social).filter(Boolean),
    },
  };

  const faqSchema =
    sections.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: sections.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
          })),
        }
      : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }} />}

      <section className={`page-banner${sections.hero.image_url ? " has-image" : ""}`}>
        {sections.hero.image_url && <Image src={sections.hero.image_url} alt="" fill priority sizes="100vw" style={{ objectFit: "cover" }} />}
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

        {sections.cards.length > 0 && (
          <section className="feature-grid contact-cards" aria-label="How to reach us">
            {sections.cards.map((card) => {
              const body = (
                <>
                  <span className="feature-icon">
                    <SectionIcon name={card.icon} />
                  </span>
                  <h2>{card.title}</h2>
                  {card.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </>
              );

              return card.link_url ? (
                <a key={card.title} className="feature-card" href={card.link_url}>
                  {body}
                </a>
              ) : (
                <article key={card.title} className="feature-card">
                  {body}
                </article>
              );
            })}
          </section>
        )}

        <div className="cms-layout has-aside contact-layout">
          <div>
            <section className="detail-section" aria-labelledby="enquiry-form">
              <h2 id="enquiry-form">{sections.form.heading ?? "Send us a message"}</h2>
              {sections.form.text && <p className="detail-description">{sections.form.text}</p>}
              <ContactForm consentText={sections.form.consent_text} successMessage={sections.form.success_message} />
            </section>

            {sections.map_embed_url && (
              <section className="detail-section" aria-label="Find us">
                <h2>Find us</h2>
                <div className="map-embed">
                  <iframe
                    src={sections.map_embed_url}
                    title={`${siteName} on the map`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
              </section>
            )}

            {sections.faqs.length > 0 && (
              <section className="detail-section">
                <h2>Frequently asked questions</h2>
                <div className="faq-list">
                  {sections.faqs.map((faq) => (
                    <details key={faq.question} className="faq-item">
                      <summary>{faq.question}</summary>
                      <p>{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="cms-aside" aria-label="Contact details">
            {/* With no cards in the CMS, the site's saved contact details are shown instead. */}
            {sections.cards.length === 0 && hasContactDetails(settings) && (
              <div className="aside-card tinted">
                <h2>Get in touch</h2>
                <ContactList contact={settings.contact} />
              </div>
            )}

            {sections.office_hours.length > 0 && (
              <div className="aside-card">
                <h2>Office hours</h2>
                <dl className="hours-list">
                  {sections.office_hours.map((row) => (
                    <div key={row.days}>
                      <dt>{row.days}</dt>
                      <dd>{row.hours}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {hasSocial && (
              <div className="aside-card">
                <h2>Follow us</h2>
                <SocialLinks social={settings.social} siteName={siteName} />
              </div>
            )}
          </aside>
        </div>

        {sections.dealers.show && dealers.length > 0 && (
          <section className="section" aria-labelledby="trusted-dealers">
            <div className="section-head">
              <div>
                <h2 id="trusted-dealers">{sections.dealers.heading ?? "Trusted dealers of DHA Gujranwala"}</h2>
                {sections.dealers.text && <p>{sections.dealers.text}</p>}
              </div>
              <Link className="pill-link" href="/agencies">
                View all
              </Link>
            </div>
            <div className="agency-grid">
              {dealers.map((agency) => (
                <AgencyCard key={agency.id} agency={agency} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
