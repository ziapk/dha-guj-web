import Link from "next/link";
import { FooterSection, FooterThemeToggle } from "@/components/footer-section";
import { ArrowUpIcon, BuildingIcon, ChevronRightIcon, ClockIcon, HomeIcon, LinkIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from "@/components/icons";
import { SocialLinks } from "@/components/site-contact";
import { SiteLogo } from "@/components/site-logo";
import { whatsappNumber } from "@/lib/property";
import { portalUrl } from "@/lib/site";
import { DEFAULT_TAGLINE, cmsPageHref, siteNameOf } from "@/lib/site-data";
import type { CmsPageSummary, SiteSettings } from "@/types/api";

const QUICK_LINKS = [
  { href: "/projects", label: "Projects" },
  { href: "/developers", label: "Developers" },
  { href: "/dealers", label: "Dealers" },
  { href: "/agents", label: "Agents" },
  { href: "/blog", label: "Blog" },
  { href: "/dha-gujranwala-maps", label: "Society Maps" },
  { href: "/plot-finder", label: "Plot Finder" },
  { href: "/dha-gujranwala-files-rates", label: "File Rates" },
  { href: "/pricing", label: "Plans & Pricing" },
  { href: "/wanted", label: "Buyer Requirements" },
];

const PROPERTY_LINKS = [
  { href: "/properties-for-sale", label: "Buy Property" },
  { href: "/properties-for-rent", label: "Rent Property" },
  { href: "/properties?category=residential", label: "Houses" },
  { href: "/properties?category=plot", label: "Plots" },
  { href: "/properties?category=commercial", label: "Commercial" },
  { href: "/properties", label: "All Properties" },
  { href: "/sell-property", label: "Sell Property" },
];

type FooterLink = { href: string; label: string; external?: boolean };

/** A column's links with the chevron bullets of the design. */
function LinkList({ links }: { links: FooterLink[] }) {
  return (
    <ul className="footer-links">
      {links.map((link) => (
        <li key={link.href}>
          <ChevronRightIcon className="icon" />
          {link.external ? <a href={link.href}>{link.label}</a> : <Link href={link.href}>{link.label}</Link>}
        </li>
      ))}
    </ul>
  );
}

export function SiteFooter({ settings, pages }: { settings: SiteSettings; pages: CmsPageSummary[] }) {
  const siteName = siteNameOf(settings);
  const { contact } = settings;
  const whatsapp = whatsappNumber(contact.whatsapp);

  const companyLinks: FooterLink[] = [
    // About and Contact have their own designed pages, so they are linked directly.
    { href: "/about-us", label: "About Us" },
    { href: "/contact", label: "Contact" },
    ...pages.map((page) => ({ href: cmsPageHref(page.slug), label: page.title })),
    { href: portalUrl("/register"), label: "Create an account", external: true },
    { href: "/login", label: "Buyer login" },
  ];

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <SiteLogo siteName={siteName} logoUrl={settings.general.logo_url} />
            <p>{settings.general.tagline ?? DEFAULT_TAGLINE}</p>
            <SocialLinks social={settings.social} siteName={siteName} />
          </div>

          <FooterSection title="Quick Links" icon={<LinkIcon className="icon" />}>
            <LinkList links={QUICK_LINKS} />
          </FooterSection>

          <FooterSection title="Properties" icon={<HomeIcon className="icon" />}>
            <LinkList links={[...PROPERTY_LINKS, { href: portalUrl("/listings/new"), label: "List Property", external: true }]} />
          </FooterSection>

          <FooterSection title="Company" icon={<BuildingIcon className="icon" />}>
            <LinkList links={companyLinks} />
          </FooterSection>

          <FooterSection title="Contact Us" icon={<PhoneIcon className="icon" />} className="footer-contact-col">
            <ul className="footer-contact">
              {contact.phone && (
                <li>
                  <span className="footer-contact-icon">
                    <PhoneIcon className="icon" />
                  </span>
                  <span>
                    <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`}>{contact.phone}</a>
                    <small>Call Us</small>
                  </span>
                </li>
              )}
              {whatsapp && (
                <li>
                  <span className="footer-contact-icon">
                    <WhatsAppIcon className="icon" />
                  </span>
                  <span>
                    <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">
                      {contact.whatsapp}
                    </a>
                    <small>WhatsApp</small>
                  </span>
                </li>
              )}
              {contact.email && (
                <li>
                  <span className="footer-contact-icon">
                    <MailIcon className="icon" />
                  </span>
                  <span>
                    <a href={`mailto:${contact.email}`}>{contact.email}</a>
                    <small>Email Us</small>
                  </span>
                </li>
              )}
              {contact.address && (
                <li>
                  <span className="footer-contact-icon">
                    <PinIcon className="icon" />
                  </span>
                  <span>
                    <address>{contact.address}</address>
                    <small>Our Office</small>
                  </span>
                </li>
              )}
              {contact.office_hours && (
                <li>
                  <span className="footer-contact-icon">
                    <ClockIcon className="icon" />
                  </span>
                  <span>
                    <span className="footer-contact-value">{contact.office_hours}</span>
                    <small>Office Hours</small>
                  </span>
                </li>
              )}
            </ul>
          </FooterSection>
        </div>

        <div className="footer-bottom">
          <span className="footer-copyright">
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
          <FooterThemeToggle />
          <a className="back-to-top" href="#top" aria-label="Back to top">
            <span className="back-to-top-icon">
              <ArrowUpIcon className="icon" />
            </span>
            <span className="back-to-top-label">Back to top</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
