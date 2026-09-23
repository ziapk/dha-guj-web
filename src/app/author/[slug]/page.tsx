import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/post-card";
import { authorSocials, getAuthor, getAuthors } from "@/lib/authors";
import { jsonLd, metaText, openGraph } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import { getSiteSettings, siteNameOf } from "@/lib/site-data";

export const revalidate = 300;

/** Pre-render the directory; anyone published later renders on first visit. */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const authors = await getAuthors(48);

  return authors.map((author) => ({ slug: author.slug }));
}

function pageNumber(value: string | string[] | undefined): number {
  const page = Number.parseInt(Array.isArray(value) ? (value[0] ?? "") : (value ?? ""), 10);

  return Number.isInteger(page) && page > 1 ? page : 1;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export async function generateMetadata({ params }: PageProps<"/author/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await getAuthor(slug);

  if (!result) {
    return { title: "Author not found", robots: { index: false } };
  }

  const author = result.data;
  const title = author.meta_title ?? `${author.name} — ${author.designation}`;
  const description = metaText(author.meta_description ?? author.short_bio);
  const url = `/author/${author.slug}`;
  const image = author.og_image_url ?? author.photo_url;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: await openGraph({
      title: author.og_title ?? title,
      description: author.og_description ? metaText(author.og_description) : description,
      url,
      type: "profile",
      images: image ? [{ url: image }] : undefined,
    }),
    twitter: { card: image ? "summary_large_image" : "summary", title, description },
  };
}

export default async function AuthorPage({ params, searchParams }: PageProps<"/author/[slug]">) {
  const { slug } = await params;
  const page = pageNumber((await searchParams).page);
  const result = await getAuthor(slug, page);

  if (!result) {
    notFound();
  }

  const author = result.data;
  const posts = result.posts;
  const settings = await getSiteSettings();
  const socials = authorSocials(author);
  const url = `${siteUrl()}/author/${author.slug}`;
  const lastPage = posts.meta.last_page;

  const facts = [
    { label: "Role", value: author.designation },
    { label: "Experience", value: author.experience },
    { label: "Specialization", value: author.specialisation },
    { label: "Languages", value: author.languages.join(", ") },
    { label: "Articles", value: author.total_articles ?? 0 },
  ].filter((fact) => fact.value !== null && fact.value !== undefined && fact.value !== "");

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    url,
    image: author.photo_url ?? undefined,
    jobTitle: author.designation,
    description: author.short_bio,
    knowsAbout: author.areas_of_expertise.length > 0 ? author.areas_of_expertise : undefined,
    knowsLanguage: author.languages.length > 0 ? author.languages : undefined,
    worksFor: { "@type": "Organization", name: siteNameOf(settings), url: siteUrl() },
    sameAs: socials.map((social) => social.url),
  };

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl() },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl()}/blog` },
      { "@type": "ListItem", position: 3, name: author.name, item: url },
    ],
  };

  return (
    <div className="container page-section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />

      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/blog">Blog</Link>
        <span>/</span>
        <span aria-current="page">{author.name}</span>
      </nav>

      <div className="detail-layout">
        <div>
          <header className="detail-title-row">
            <span className="agent-photo agent-photo-lg">
              {author.photo_url ? (
                <Image src={author.photo_url} alt={author.name} fill sizes="160px" style={{ objectFit: "cover" }} />
              ) : (
                <span aria-hidden="true">{initials(author.name)}</span>
              )}
            </span>
            <h1>{author.name}</h1>
            <p className="detail-location">{author.tagline ?? author.designation}</p>
            <p className="detail-description">{author.short_bio}</p>
          </header>

          {facts.length > 0 && (
            <section className="detail-section">
              <h2>Profile</h2>
              <dl className="detail-list">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {author.bio_html && (
            <section className="detail-section">
              <h2>About {author.name}</h2>
              {/* bio_html is sanitised by the API before it is stored. */}
              <div className="prose" dangerouslySetInnerHTML={{ __html: author.bio_html }} />
            </section>
          )}

          {author.personal_note && (
            <section className="detail-section">
              <h2>In their own words</h2>
              <p className="detail-description">{author.personal_note}</p>
            </section>
          )}

          <section className="section" style={{ paddingBottom: 0 }} aria-labelledby="author-articles">
            <div className="section-head">
              <h2 id="author-articles">Articles by {author.name}</h2>
            </div>

            {posts.data.length === 0 ? (
              <div className="empty-results">
                <p>No published articles yet.</p>
              </div>
            ) : (
              <>
                <div className="post-grid">
                  {posts.data.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>

                {lastPage > 1 && (
                  <nav className="simple-pagination" aria-label="Pagination">
                    {page > 1 ? <Link href={`/author/${author.slug}?page=${page - 1}`}>← Newer articles</Link> : <span />}
                    <span>
                      Page {page} of {lastPage}
                    </span>
                    {page < lastPage ? <Link href={`/author/${author.slug}?page=${page + 1}`}>Older articles →</Link> : <span />}
                  </nav>
                )}
              </>
            )}
          </section>
        </div>

        <aside className="detail-sidebar">
          {author.areas_of_expertise.length > 0 && (
            <div className="aside-card">
              <h2>Areas of expertise</h2>
              <ul className="chip-list">
                {author.areas_of_expertise.map((area) => (
                  <li key={area} className="chip">
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {author.highlights.length > 0 && (
            <div className="aside-card tinted">
              <h2>Highlights</h2>
              <ul className="amenity-list">
                {author.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </div>
          )}

          {author.education.length > 0 && (
            <div className="aside-card">
              <h2>Education &amp; certifications</h2>
              <ul className="amenity-list">
                {author.education.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {author.awards.length > 0 && (
            <div className="aside-card">
              <h2>Awards &amp; achievements</h2>
              <ul className="amenity-list">
                {author.awards.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {socials.length > 0 && (
            <div className="aside-card">
              <h2>Follow {author.name}</h2>
              <ul className="chip-list">
                {socials.map((social) => (
                  <li key={social.key}>
                    <a className="chip" href={social.url} target="_blank" rel="noopener noreferrer">
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
