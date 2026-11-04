import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DownloadIcon } from "@/components/icons";
import { JsonLd } from "@/components/json-ld";
import { SectorGuideCard } from "@/components/sector-guides/sector-guide-card";
import { MapViewer } from "@/components/society-maps/map-viewer";
import { altText } from "@/lib/alt-text";
import { cmsPageSchemas } from "@/lib/page-schema";
import { adminShareImage, notFoundMetadata, pageMetadata } from "@/lib/seo";
import { itemListSchema, ref, schemaId } from "@/lib/schema";
import { getSectorGuides, PLOT_RATES_PATH, SECTORS_PATH, SECTORS_SLUG } from "@/lib/sector-guides";
import { getCmsPage } from "@/lib/site-data";
import { getSocietyMaps, societyMapHref } from "@/lib/society-maps";

export const revalidate = 300;

/** The master plan the admin featured, or the most recent one. */
async function getMasterPlan() {
  const result = await getSocietyMaps(1, { category: "master_plan" });

  return result?.data[0] ?? null;
}

export async function generateMetadata(): Promise<Metadata> {
  const [page, masterPlan] = await Promise.all([getCmsPage(SECTORS_SLUG), getMasterPlan()]);

  if (!page) {
    return notFoundMetadata("Page not found");
  }

  return pageMetadata({
    title: page.meta_title ?? page.title,
    absoluteTitle: Boolean(page.meta_title),
    description: page.meta_description,
    path: SECTORS_PATH,
    images: [adminShareImage(page), masterPlan && { url: masterPlan.image_url, alt: altText(masterPlan.image_alt, masterPlan.title), fit: "contain" }],
  });
}

export default async function SectorsPage() {
  const [page, guides, masterPlan] = await Promise.all([getCmsPage(SECTORS_SLUG), getSectorGuides(), getMasterPlan()]);

  if (!page) {
    notFound();
  }

  const items = guides.map((guide) => ({ url: guide.path, name: guide.title, image: guide.map?.image_url }));

  return (
    <div className="container page-section sg-page">
      <JsonLd
        data={[
          ...cmsPageSchemas(page, SECTORS_PATH, { type: "CollectionPage", mainEntity: items.length > 0 ? ref(schemaId.itemList(SECTORS_PATH)) : null }),
          itemListSchema(SECTORS_PATH, items, page.title),
        ]}
      />

      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{page.title}</span>
      </nav>

      <header className="cms-header">
        <h1>{page.title}</h1>
      </header>

      {/* Sanitised by the API before it is stored. */}
      <div className="prose prose-wide" dangerouslySetInnerHTML={{ __html: page.content_html }} />

      {masterPlan && (
        <section className="detail-section" aria-labelledby="master-plan">
          <h2 id="master-plan">DHA Gujranwala master plan</h2>
          <MapViewer src={masterPlan.image_url} alt={altText(masterPlan.image_alt, masterPlan.title)} />
          <p className="sg-map-links">
            <Link href={societyMapHref(masterPlan.slug)}>
              <DownloadIcon className="icon" /> View and download {masterPlan.title}
            </Link>
          </p>
        </section>
      )}

      {guides.length > 0 && (
        <section className="detail-section" aria-labelledby="all-sectors">
          <h2 id="all-sectors">Sector guides</h2>
          <div className="sg-grid">
            {guides.map((guide) => (
              <SectorGuideCard key={guide.id} guide={guide} />
            ))}
          </div>
        </section>
      )}

      <section className="detail-section sg-rates">
        <h2>DHA Gujranwala plot rates</h2>
        <p>
          Looking for prices? See current prices by sector and plot size on the <Link href={PLOT_RATES_PATH}>DHA Gujranwala plot rates</Link> page.
        </p>
      </section>
    </div>
  );
}
