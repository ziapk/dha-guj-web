import type { Metadata } from "next";
import Link from "next/link";
import { HandshakeIcon, PhoneIcon, ShieldCheckIcon, TagIcon, UsersIcon, WhatsAppIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { SellPropertyForm } from "@/components/sell-property-form";
import { publicApi } from "@/lib/api";
import { whatsappNumber } from "@/lib/property";
import { pageMetadata } from "@/lib/seo";
import { getSiteSettings, siteNameOf } from "@/lib/site-data";
import type { Collection, Phase, PropertyType } from "@/types/api";
import { brandRef, webPageSchemas } from "@/lib/schema";

export const revalidate = 300;

const TITLE = "Sell Your Property in DHA Gujranwala - Free Listing & Valuation";
const DESCRIPTION =
  "Submit your plot, file or house in DHA Gujranwala. Our team verifies, prices and markets it to serious buyers. Listing is free — you only pay on a successful deal.";
const PATH = "/sell-property";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ title: TITLE, description: DESCRIPTION, path: PATH });
}

const STEPS = [
  { title: "Submit details", text: "Fill this form with your property details & photos." },
  { title: "We verify", text: "Our team confirms details and valuation with you." },
  { title: "We list it", text: "We publish it and market to active buyers." },
  { title: "Deal closed", text: "We negotiate & complete the deal. You pay on success." },
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
        data={webPageSchemas({
          path: PATH,
          name: TITLE,
          description: DESCRIPTION,
          breadcrumb: [{ name: TITLE, path: PATH }],
          about: brandRef(),
        })}
      />


      <div className="listing-create">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Sell Property</span>
        </nav>
        <div className="lf-hero sell-hero">
          <div>
            <h1>List Your Property With Us</h1>
            <p>
              Submit your plot, file, or house and our team will verify, price, and market it to serious buyers across DHA Gujranwala. Listing is free — you only
              pay on a successful deal.
            </p>
            <ol className="lf-hero-steps">
              {STEPS.map((step, index) => (
                <li key={step.title} title={step.text}>
                  <span className="lf-hero-step-number">{index + 1}</span> {step.title}
                </li>
              ))}
            </ol>
          </div>

          {(phone || whatsapp) && (
            <div className="sell-hero-contact">
              <span>Prefer to talk first?</span>
              {phone && (
                <a className="btn btn-primary" href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                  <PhoneIcon className="icon" /> Call us
                </a>
              )}
              {whatsapp && (
                <a className="btn btn-whatsapp" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="icon" /> WhatsApp
                </a>
              )}
            </div>
          )}
        </div>

        <ul className="sell-benefits">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <span className="lf-block-icon">
                <Icon className="icon" />
              </span>
              <span>
                <strong>{title}</strong>
                <small>{text}</small>
              </span>
            </li>
          ))}
        </ul>

        <SellPropertyForm propertyTypes={propertyTypes} phases={location.phases} defaultPhaseId={defaultPhase?.id ?? null} siteName={siteName} />
      </div>
    </div>
  );
}
