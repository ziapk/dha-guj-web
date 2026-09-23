import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PhoneIcon, WhatsAppIcon } from "@/components/icons";
import { FILE_RATES_SLUG, getFileRates } from "@/lib/file-rates";
import { formatDate } from "@/lib/labels";
import { whatsappNumber } from "@/lib/property";
import { jsonLd, metaText, openGraph } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import { getSiteSettings, siteNameOf } from "@/lib/site-data";
import type { RateTrend } from "@/types/api";

export const revalidate = 300;

const TREND_LABELS: Record<RateTrend, string> = { up: "Rising", down: "Falling", stable: "Stable" };

export async function generateMetadata(): Promise<Metadata> {
  const result = await getFileRates();

  if (!result) {
    return { title: "File rates", robots: { index: false } };
  }

  const { page, sections } = result;
  const title = page.meta_title ?? page.title;
  const description = metaText(page.meta_description ?? sections.hero.subtitle ?? `Latest DHA Gujranwala file rates from ${page.title}.`);
  const url = `/${FILE_RATES_SLUG}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: await openGraph({ title, description, url }),
    twitter: { card: "summary", title, description },
  };
}

export default async function FileRatesPage() {
  const result = await getFileRates();

  if (!result) {
    notFound();
  }

  const { page, sections, tables } = result;
  const settings = await getSiteSettings();
  const siteName = siteNameOf(settings);
  const phone = sections.cta.phone ?? settings.contact.phone;
  const whatsapp = whatsappNumber(sections.cta.whatsapp ?? settings.contact.whatsapp);
  const url = `${siteUrl()}/${FILE_RATES_SLUG}`;

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl() },
      { "@type": "ListItem", position: 2, name: page.title, item: url },
    ],
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

  const howToSchema =
    sections.steps.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to buy a DHA Gujranwala file",
          step: sections.steps.map((step, index) => ({
            "@type": "HowToStep",
            position: index + 1,
            name: step.title,
            text: step.text ?? step.title,
          })),
        }
      : null;

  return (
    <div className="container page-section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />
      {faqSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }} />}
      {howToSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(howToSchema) }} />}

      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span aria-current="page">{page.title}</span>
      </nav>

      <header className="cms-header">
        {sections.hero.updated_label && <span className="badge badge-outline">{sections.hero.updated_label}</span>}
        <h1>{sections.hero.title ?? page.title}</h1>
        {sections.hero.subtitle && <p>{sections.hero.subtitle}</p>}
      </header>

      {sections.intro_html && (
        // Sanitised by the API before it is stored.
        <div className="prose" dangerouslySetInnerHTML={{ __html: sections.intro_html }} />
      )}

      {tables.length === 0 ? (
        <div className="empty-results">
          <p>Rates are being updated. Please check back shortly, or call us for today&rsquo;s price.</p>
          {phone && (
            <a className="btn btn-primary" href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
              <PhoneIcon className="icon" /> {phone}
            </a>
          )}
        </div>
      ) : (
        tables.map((table) => (
          <section key={table.id} className="detail-section rate-table-section" aria-labelledby={`rates-${table.id}`}>
            <div className="rate-table-head">
              <h2 id={`rates-${table.id}`}>{table.title}</h2>
              {table.rates_updated_at && <span className="badge badge-outline">Last updated {formatDate(table.rates_updated_at)}</span>}
            </div>
            {table.subtitle && <p className="detail-description">{table.subtitle}</p>}

            <div className="compare-table-wrap">
              <table className="compare-table rate-table">
                <thead>
                  <tr>
                    <th scope="col">File type</th>
                    <th scope="col">Current rate</th>
                    <th scope="col">Contact</th>
                    <th scope="col">Market trend</th>
                    <th scope="col">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {(table.rows ?? []).map((row) => (
                    <tr key={row.id}>
                      <th scope="row">
                        {row.file_type}
                        {row.note && <small className="rate-note">{row.note}</small>}
                      </th>
                      <td className="rate-value">{row.current_rate}</td>
                      <td>
                        {row.contact_number ? (
                          <a href={`tel:${row.contact_number.replace(/[^\d+]/g, "")}`}>{row.contact_number}</a>
                        ) : phone ? (
                          <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <span className={`trend trend-${row.trend}`}>{TREND_LABELS[row.trend]}</span>
                      </td>
                      <td>{row.updated_label ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {table.note && <p className="rate-table-note">{table.note}</p>}
          </section>
        ))
      )}

      {sections.content_blocks.map((block) => (
        <section key={block.heading} className="detail-section">
          <h2>{block.heading}</h2>
          {block.body_html && <div className="prose" dangerouslySetInnerHTML={{ __html: block.body_html }} />}
        </section>
      ))}

      {sections.comparisons.map((comparison) => (
        <section key={comparison.title} className="detail-section">
          <h2>{comparison.title}</h2>
          {comparison.intro && <p className="detail-description">{comparison.intro}</p>}
          <div className="compare-table-wrap">
            <table className="compare-table">
              <thead>
                <tr>
                  {comparison.columns.map((column) => (
                    <th key={column} scope="col">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {comparison.columns.map((column, cellIndex) =>
                      cellIndex === 0 ? (
                        <th key={column} scope="row">
                          {row[cellIndex] ?? "—"}
                        </th>
                      ) : (
                        <td key={column}>{row[cellIndex] ?? "—"}</td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      {sections.steps.length > 0 && (
        <section className="detail-section">
          <h2>How to buy a file</h2>
          <ol className="step-list">
            {sections.steps.map((step) => (
              <li key={step.title}>
                <strong>{step.title}</strong>
                {step.text && <span>{step.text}</span>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {sections.documents.length > 0 && (
        <section className="detail-section">
          <h2>Documents you will need</h2>
          <ul className="amenity-list">
            {sections.documents.map((document) => (
              <li key={document}>{document}</li>
            ))}
          </ul>
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

      {sections.disclaimer_html && (
        <section className="detail-section rate-disclaimer" aria-label="Important notice">
          <div className="prose" dangerouslySetInnerHTML={{ __html: sections.disclaimer_html }} />
        </section>
      )}

      {(sections.cta.heading || phone || whatsapp) && (
        <section className="sell-banner" aria-label="Contact us">
          <div className="sell-banner-body">
            <h2>{sections.cta.heading ?? `Talk to ${siteName}`}</h2>
            {sections.cta.text && <p>{sections.cta.text}</p>}
          </div>
          <div className="sell-banner-actions">
            {phone && (
              <a className="btn btn-primary" href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                <PhoneIcon className="icon" /> {sections.cta.button_label ?? "Call now"}
              </a>
            )}
            {whatsapp && (
              <a className="btn btn-whatsapp" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon className="icon" /> WhatsApp
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
