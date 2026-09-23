import Link from "next/link";
import { ArrowUpIcon, ClockIcon, MailIcon, PhoneIcon, PinIcon } from "@/components/icons";
import { SocialLinks } from "@/components/site-contact";
import { SiteLogo } from "@/components/site-logo";
import { whatsappNumber } from "@/lib/property";
import { portalUrl } from "@/lib/site";
import { DEFAULT_TAGLINE, cmsPageHref, siteNameOf } from "@/lib/site-data";
import type { CmsPageSummary, SiteSettings } from "@/types/api";

const QUICK_LINKS = [
  { href: "/projects", label: "Projects" },
  { href: "/agencies", label: "Dealers" },
  { href: "/agents", label: "Agents" },
  { href: "/blog", label: "Blog" },
  { href: "/maps", label: "Sector Maps" },
  { href: "/dha-gujranwala-files-rates", label: "File Rates" },
  { href: "/pricing", label: "Plans & Pricing" },
  { href: "/wanted", label: "Buyer Requirements" },
];

const PROPERTY_LINKS = [
  { href: "/properties?purpose=sale", label: "Buy Property" },
  { href: "/properties?purpose=rent", label: "Rent Property" },
  { href: "/properties?category=residential", label: "Houses" },
  { href: "/properties?category=plot", label: "Plots" },
  { href: "/properties?category=commercial", label: "Commercial" },
  { href: "/properties", label: "All Properties" },
];

export function SiteFooter({ settings, pages }: { settings: SiteSettings; pages: CmsPageSummary[] }) {
  const siteName = siteNameOf(settings);
  const { contact } = settings;
  const whatsapp = whatsappNumber(contact.whatsapp);

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <SiteLogo siteName={siteName} logoUrl={settings.general.logo_url} />
            <p>{settings.general.tagline ?? DEFAULT_TAGLINE}</p>
            <SocialLinks social={settings.social} siteName={siteName} />
          </div>

          <div>
            <h2>Quick Links</h2>
            <ul>
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2>Properties</h2>
            <ul>
              {PROPERTY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
              <li>
                <a href={portalUrl("/listings/new")}>List Property</a>
              </li>
            </ul>
          </div>

          <div>
            <h2>Company</h2>
            <ul>
              {/* About and Contact have their own designed pages, so they are linked directly. */}
              <li>
                <Link href="/about-us">About Us</Link>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
              </li>
              {pages.map((page) => (
                <li key={page.id}>
                  <Link href={cmsPageHref(page.slug)}>{page.title}</Link>
                </li>
              ))}
              <li>
                <a href={portalUrl("/register")}>Create an account</a>
              </li>
              <li>
                <Link href="/login">Buyer login</Link>
              </li>
            </ul>
          </div>

          <div className="footer-contact-col">
            <h2>Contact Us</h2>
            <ul className="footer-contact">
              {contact.email && (
                <li>
                  <MailIcon className="icon" />
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </li>
              )}
              {contact.phone && (
                <li>
                  <PhoneIcon className="icon" />
                  <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}>{contact.phone}</a>
                </li>
              )}
              {whatsapp && (
                <li>
                  <PhoneIcon className="icon" />
                  <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">
                    WhatsApp {contact.whatsapp}
                  </a>
                </li>
              )}
              {contact.address && (
                <li>
                  <PinIcon className="icon" />
                  <address>{contact.address}</address>
                </li>
              )}
              {contact.office_hours && (
                <li>
                  <ClockIcon className="icon" />
                  <span>{contact.office_hours}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {siteName}. All Rights Reserved.
          </span>
          <nav aria-label="Legal">
            {pages.map((page) => (
              <Link key={page.id} href={cmsPageHref(page.slug)}>
                {page.title}
              </Link>
            ))}
            <a href="/sitemap.xml">Sitemap</a>
          </nav>
          <a className="back-to-top" href="#top" aria-label="Back to top">
            <ArrowUpIcon className="icon" />
          </a>
        </div>
      </div>
    </footer>
  );
}
