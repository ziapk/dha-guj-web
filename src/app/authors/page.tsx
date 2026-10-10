import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AuthorCard } from "@/components/author-card";
import { SectionHeading } from "@/components/home/section-heading";
import { ChartIcon, DocumentIcon, MegaphoneIcon, PlusIcon, ShieldCheckIcon, ArrowRightIcon } from "@/components/icons";
import { authorInitials, getAuthorsPage } from "@/lib/authors";
import { PAGE_META } from "@/lib/page-meta";
import { openGraph } from "@/lib/seo";

export const revalidate = 300;

const PER_PAGE = 12;

/** "Load more" keeps earlier pages on screen, so page N shows pages 1…N. Capped to keep the render bounded. */
const MAX_LOADED_PAGES = 10;

const FEATURES = [
  { icon: <ChartIcon className="icon" />, title: "Market Insights", text: "In-depth analysis of DHA Gujranwala market trends and opportunities." },
  { icon: <DocumentIcon className="icon" />, title: "Expert Guides", text: "Well-researched guides for buyers, investors, and end-users." },
  { icon: <MegaphoneIcon className="icon" />, title: "Latest Updates", text: "Timely news and developments about DHA Gujranwala." },
  { icon: <ShieldCheckIcon className="icon" />, title: "Trusted Content", text: "Written by experienced real estate professionals with local expertise." },
];

function pageNumber(value: string | string[] | undefined): number {
  const page = Number.parseInt(Array.isArray(value) ? (value[0] ?? "") : (value ?? ""), 10);

  return Number.isInteger(page) && page > 1 ? Math.min(page, MAX_LOADED_PAGES) : 1;
}

export async function generateMetadata({ searchParams }: PageProps<"/authors">): Promise<Metadata> {
  const page = pageNumber((await searchParams).page);
  const { description } = PAGE_META.authors;
  const title = page > 1 ? `${PAGE_META.authors.title} – page ${page}` : PAGE_META.authors.title;

  return {
    title: { absolute: title },
    description,
    // Every "load more" page repeats the first, so they all point at it.
    alternates: { canonical: "/authors" },
    openGraph: await openGraph({ title, description, url: "/authors" }),
    twitter: { card: "summary", title, description },
  };
}

export default async function AuthorsPage({ searchParams }: PageProps<"/authors">) {
  const page = pageNumber((await searchParams).page);
  const pages = await Promise.all(Array.from({ length: page }, (_, index) => getAuthorsPage(index + 1, PER_PAGE)));
  const first = pages[0];
  const authors = pages.flatMap((result) => result?.data ?? []);
  const lastPage = pages.at(-1)?.meta.last_page ?? first?.meta.last_page ?? 1;
  const faces = authors.slice(0, 5);
  const articles = authors.reduce((sum, author) => sum + (author.total_articles ?? 0), 0);

  return (
    <div className="authors-index">
      <section className="authors-hero">
        <div className="container authors-hero-inner">
          <div className="authors-hero-text">
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span aria-hidden="true">›</span>
              <span aria-current="page">Authors</span>
            </nav>
            <h1>
              Meet Our <span>Authors</span>
            </h1>
            <p>Get insights, guides, market updates, and real estate news from the DHA GRW Properties team.</p>

            {faces.length > 0 && (
              <div className="authors-hero-stats">
                <div className="authors-hero-faces" aria-hidden="true">
                  {faces.map((author) => (
                    <span key={author.id} className="authors-hero-face">
                      {author.photo_url ? <Image src={author.photo_url} alt="" fill sizes="44px" style={{ objectFit: "cover" }} /> : authorInitials(author.name)}
                    </span>
                  ))}
                </div>
                {articles > 0 && (
                  <p className="authors-hero-count">
                    <DocumentIcon className="icon" />
                    <span>
                      <strong>
                        {articles.toLocaleString("en-PK")}
                        {page < lastPage ? "+" : ""}
                      </strong>
                      Expert Articles
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>

          <ul className="authors-hero-features">
            {FEATURES.map((feature) => (
              <li key={feature.title}>
                <span className="authors-hero-feature-icon">{feature.icon}</span>
                <span>
                  <strong>{feature.title}</strong>
                  <small>{feature.text}</small>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" id="all-authors">
        <div className="container">
          <div className="authors-head">
            <SectionHeading
              eyebrow="Our authors"
              title="Meet Our Expert"
              highlight="Authors"
              subtitle="Explore the talented professionals behind our real estate insights, investment guides, market updates, and DHA Gujranwala property content."
            />
          </div>

          {!first ? (
            <div className="empty-results">
              <div style={{ fontSize: 44 }} aria-hidden="true">
                ✍️
              </div>
              <h2>Authors are unavailable right now</h2>
              <p>Please try again in a few minutes.</p>
            </div>
          ) : authors.length === 0 ? (
            <div className="empty-results">
              <div style={{ fontSize: 44 }} aria-hidden="true">
                ✍️
              </div>
              <h2>No authors to show yet</h2>
              <p>Meanwhile, read the latest articles on our blog.</p>
              <Link className="btn btn-primary" href="/blog">
                Visit the blog
              </Link>
            </div>
          ) : (
            <>
              <div className="author-grid">
                {authors.map((author) => (
                  <AuthorCard key={author.id} author={author} />
                ))}
              </div>

              {page < lastPage && page < MAX_LOADED_PAGES && (
                <div className="load-more-row">
                  <Link className="load-more-btn" href={`/authors?page=${page + 1}`} scroll={false}>
                    <span className="load-more-plus" aria-hidden="true">
                      <PlusIcon className="icon" />
                    </span>
                    Load More
                    <ArrowRightIcon className="icon" />
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
