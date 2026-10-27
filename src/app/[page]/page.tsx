import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/json-ld";
import { ContactList, SocialLinks } from "@/components/site-contact";
import { formatDate } from "@/lib/labels";
import { cmsPageSchemas } from "@/lib/page-schema";
import { adminShareImage, metaText, notFoundMetadata, pageMetadata } from "@/lib/seo";
import { cmsPageHref, getCmsPage, getCmsPages, getSiteSettings, hasContactDetails, siteNameOf } from "@/lib/site-data";
import { brandRef } from "@/lib/schema";

/**
 * CMS pages at short URLs: /about, /contact, /terms, /privacy, /faq and any other published page.
 * Static routes (/properties, /dealers, /pricing, /login, ...) always win over this dynamic segment,
 * and getCmsPage() rejects reserved or malformed slugs without calling the API.
 */

export const revalidate = 300;

/** Wraps each table in its own scroll box, so a wide table fills the column and scrolls sideways only when it must. */
function withScrollableTables(html: string): string {
  return html.replace(/<table\b/gi, '<div class="prose-table-scroll"><table').replace(/<\/table>/gi, "</table></div>");
}

/** Pre-render the published pages; any page published later renders on first visit. Empty when the API is unavailable at build time. */
export async function generateStaticParams(): Promise<{ page: string }[]> {
  const pages = await getCmsPages();

  return pages.map((page) => ({ page: page.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[page]">): Promise<Metadata> {
  const { page: slug } = await params;
  const page = await getCmsPage(slug);

  if (!page) {
    return notFoundMetadata("Page not found");
  }

  return pageMetadata({
    title: page.meta_title ?? page.title,
    description: metaText(page.meta_description ?? page.content_html.replace(/<[^>]*>/g, " ")),
    path: cmsPageHref(page.slug),
    images: [adminShareImage(page)],
  });
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
  const hasTables = /<table\b/i.test(page.content_html);

  const structuredData = cmsPageSchemas(
    page,
    cmsPageHref(page.slug),
    isContact ? { type: "ContactPage", mainEntity: brandRef(), about: brandRef() } : page.slug === "about" ? { type: "AboutPage", mainEntity: brandRef(), about: brandRef() } : {},
  );

  return (
    <div className="container page-section">
      <JsonLd data={structuredData} />

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
        {/* Pages with tables (e.g. rate lists) use the full width; text-only pages keep a readable line length. */}
        <article className={`prose${hasTables ? " prose-wide" : ""}`} dangerouslySetInnerHTML={{ __html: withScrollableTables(page.content_html) }} />

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
