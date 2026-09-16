import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactList, SocialLinks } from "@/components/site-contact";
import { formatDate } from "@/lib/labels";
import { jsonLd, metaText, openGraph } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import { cmsPageHref, getCmsPage, getCmsPages, getSiteSettings, hasContactDetails, siteNameOf } from "@/lib/site-data";

/**
 * CMS pages at short URLs: /about, /contact, /terms, /privacy, /faq and any other published page.
 * Static routes (/properties, /agencies, /pricing, /login, ...) always win over this dynamic segment,
 * and getCmsPage() rejects reserved or malformed slugs without calling the API.
 */

export const revalidate = 300;

/** Pre-render the published pages; any page published later renders on first visit. Empty when the API is unavailable at build time. */
export async function generateStaticParams(): Promise<{ page: string }[]> {
  const pages = await getCmsPages();

  return pages.map((page) => ({ page: page.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[page]">): Promise<Metadata> {
  const { page: slug } = await params;
  const page = await getCmsPage(slug);

  if (!page) {
    return { title: "Page not found", robots: { index: false } };
  }

  const settings = await getSiteSettings();
  const title = page.meta_title ?? page.title;
  const description = metaText(page.meta_description ?? page.content_html.replace(/<[^>]*>/g, " ")) || `${page.title} | ${siteNameOf(settings)}`;
  const url = cmsPageHref(page.slug);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: await openGraph({ title, description, url }),
    twitter: { card: "summary", title, description },
  };
}

export default async function CmsPageView({ params }: PageProps<"/[page]">) {
  const { page: slug } = await params;
  const page = await getCmsPage(slug);

  if (!page) {
    notFound();
  }

  const settings = await getSiteSettings();
  const siteName = siteNameOf(settings);
  const isContact = page.slug === "contact";
  const showContact = isContact && hasContactDetails(settings);
  const hasSocial = Object.values(settings.social).some(Boolean);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": isContact ? "ContactPage" : page.slug === "about" ? "AboutPage" : "WebPage",
    name: page.meta_title ?? page.title,
    url: `${siteUrl()}${cmsPageHref(page.slug)}`,
    dateModified: page.updated_at ?? undefined,
    ...(isContact
      ? {
          mainEntity: {
            "@type": "Organization",
            name: siteName,
            url: siteUrl(),
            logo: settings.general.logo_url ?? undefined,
            telephone: settings.contact.phone ?? undefined,
            email: settings.contact.email ?? undefined,
            address: settings.contact.address ?? undefined,
            sameAs: Object.values(settings.social).filter(Boolean),
          },
        }
      : {}),
  };

  return (
    <div className="container page-section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />

      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span aria-current="page">{page.title}</span>
      </nav>

      <header className="cms-header">
        <h1>{page.title}</h1>
        {page.updated_at && !isContact && <p>Last updated {formatDate(page.updated_at)}</p>}
      </header>

      <div className={`cms-layout${showContact || (isContact && hasSocial) ? " has-aside" : ""}`}>
        {/* content_html is sanitised by the API (Markdown rendered with unsafe HTML stripped). */}
        <article className="prose" dangerouslySetInnerHTML={{ __html: page.content_html }} />

        {isContact && (showContact || hasSocial) && (
          <aside className="cms-aside" aria-label="Contact details">
            {showContact && (
              <div className="aside-card tinted">
                <h2>Get in touch</h2>
                <ContactList contact={settings.contact} />
              </div>
            )}
            {hasSocial && (
              <div className="aside-card">
                <h2>Follow us</h2>
                <SocialLinks social={settings.social} siteName={siteName} />
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
