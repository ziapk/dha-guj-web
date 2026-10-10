import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PurposeListingPage } from "@/components/purpose/purpose-page";
import { getSearchPage, searchPageHref } from "@/lib/search-pages";
import { metaText, openGraph, robots } from "@/lib/seo";

export async function generateMetadata({ params, searchParams }: PageProps<"/properties/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const landing = await getSearchPage(slug);

  if (!landing) {
    return { title: "Page not found" };
  }

  const query = await searchParams;
  const title = landing.meta_title ?? landing.title;
  const description = metaText(
    landing.meta_description ??
      `Browse ${landing.title.charAt(0).toLowerCase()}${landing.title.slice(1)}: verified listings with photos, prices and direct Call and WhatsApp contact.`,
  );
  const url = searchPageHref(landing.slug);
  const keywords = landing.meta_keywords
    ?.split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);

  return {
    title,
    description,
    keywords: keywords?.length ? keywords : undefined,
    alternates: { canonical: url },
    openGraph: await openGraph({ title, description, url }),
    // Later pages and other sort orders repeat the same search.
    robots: robots(query.page || query.sort ? { index: false, follow: true } : undefined),
  };
}

/**
 * A keyword landing page such as /properties/5-marla-villa-for-sale-in-dha-gujranwala: the Buy or Rent page with
 * the admin's saved filters already chosen. Old /properties/{listing-slug} links are redirected by the proxy first.
 */
export default async function SearchLandingPage({ params, searchParams }: PageProps<"/properties/[slug]">) {
  const { slug } = await params;
  const landing = await getSearchPage(slug);

  if (!landing) {
    notFound();
  }

  return <PurposeListingPage purpose={landing.purpose} searchParams={searchParams} landing={landing} />;
}
