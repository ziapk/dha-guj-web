import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircleIcon, HandshakeIcon, PhoneIcon, ShieldCheckIcon, TagIcon, UsersIcon, WhatsAppIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { SellPropertyForm } from "@/components/sell-property-form";
import { publicApi } from "@/lib/api";
import { whatsappNumber } from "@/lib/property";
import { openGraph } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import { getSiteSettings, siteNameOf } from "@/lib/site-data";
import type { Collection, Phase, PropertyType } from "@/types/api";

export const revalidate = 300;

const TITLE = "Sell Your Property in DHA Gujranwala - Free Listing & Valuation";
const DESCRIPTION =
  "Submit your plot, file or house in DHA Gujranwala. Our team verifies, prices and markets it to serious buyers. Listing is free — you only pay on a successful deal.";
const PATH = "/sell-property";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: PATH },
    openGraph: await openGraph({ title: TITLE, description: DESCRIPTION, url: PATH }),
    twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
  };
}

const STEPS = [
  { title: "Submit", text: "Fill this form with your property details & photos." },
  { title: "Verify", text: "Our team confirms details and valuation with you." },
  { title: "List", text: "We publish it and market to active buyers." },
  { title: "Close", text: "We negotiate & complete the deal. You pay on success." },
];

const BENEFITS = [
  { icon: UsersIcon, title: "Active buyer network", text: "Direct access to serious, pre-qualified buyers in DHA Gujranwala." },
  { icon: TagIcon, title: "Free valuation", text: "Fair, market-based pricing so you never leave money behind." },
  { icon: ShieldCheckIcon, title: "Secure paperwork", text: "We handle transfer, registry and documentation end-to-end." },
  { icon: HandshakeIcon, title: "Pay only on success", text: "No upfront listing cost — commission only when it sells." },
];

type ListingLocation = { phases: Phase[]; default_phase: string };

export default async function SellPropertyPage() {
  const [settings, propertyTypes, location] = await Promise.all([
    getSiteSettings(),
    publicApi<Collection<PropertyType>>("property-types", { revalidate: 3600 })
      .then((response) => response.data)
      .catch(() => [] as PropertyType[]),
    publicApi<{ data: ListingLocation }>("listing-location", { revalidate: 3600 })
      .then((response) => response.data)
      .catch(() => ({ phases: [], default_phase: "" }) as ListingLocation),
  ]);

  const siteName = siteNameOf(settings);
  const { phone } = settings.contact;
  const whatsapp = whatsappNumber(settings.contact.whatsapp);
  const defaultPhase = location.phases.find((phase) => phase.name === location.default_phase) ?? location.phases[0];

  return (
    <div className="container page-section sell-page">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: TITLE,
            description: DESCRIPTION,
            url: `${siteUrl()}${PATH}`,
            publisher: { "@type": "Organization", name: siteName, url: siteUrl() },
          },
        ]}
      />

      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Sell Property</span>
      </nav>

      <header className="sell-hero">
        <h1>List Your Property With Us</h1>
        <p>
          Submit your plot, file, or house and our team will verify, price, and market it to serious buyers across DHA Gujranwala. Listing is free — you only pay on a
          successful deal.
        </p>

        <ol className="sell-steps">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <span className="sell-step-number">{index + 1}</span>
              <span>
                <strong>{step.title}</strong>
                <small>{step.text}</small>
              </span>
            </li>
          ))}
        </ol>

        <ul className="sell-badges">
          {["Verified buyer network", "Free listing & valuation", "Dedicated dealer support"].map((text) => (
            <li key={text}>
              <CheckCircleIcon className="icon" /> {text}
            </li>
          ))}
        </ul>
      </header>

      <div className="sell-layout">
        <SellPropertyForm propertyTypes={propertyTypes} phases={location.phases} defaultPhaseId={defaultPhase?.id ?? null} siteName={siteName} />

        <aside className="sell-aside">
          <section className="aside-card">
            <h2>Why sell with us</h2>
            <ul className="sell-benefits">
              {BENEFITS.map(({ icon: Icon, title, text }) => (
                <li key={title}>
                  <span className="aside-icon">
                    <Icon className="icon" />
                  </span>
                  <span>
                    <strong>{title}</strong>
                    <small>{text}</small>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {(phone || whatsapp) && (
            <section className="aside-card sell-help">
              <span className="sell-help-kicker">Need help?</span>
              <h2>Prefer to talk first?</h2>
              <p>Call or WhatsApp our team and we&apos;ll list the property for you.</p>
              {phone && (
                <a className="btn btn-primary btn-block" href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                  <PhoneIcon className="icon" /> {phone}
                </a>
              )}
              {whatsapp && (
                <a className="btn btn-whatsapp btn-block" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="icon" /> Chat on WhatsApp
                </a>
              )}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
