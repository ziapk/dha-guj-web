import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AuthorPostCard, AuthorSocials } from "@/components/author-card";
import {
  ArrowRightIcon,
  BadgeIcon,
  ChartIcon,
  ChatIcon,
  DocumentIcon,
  HomeIcon,
  MapIcon,
  PinIcon,
  PlusIcon,
  QuoteIcon,
  UsersIcon,
} from "@/components/icons";
import { authorInitials, authorSocials, getAuthor, getAuthors } from "@/lib/authors";
import { sizedImage } from "@/lib/image";
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

  return Number.isInteger(page) && page > 1 ? Math.min(page, MAX_LOADED_PAGES) : 1;
}

/** "Load more" keeps earlier pages on screen, so page N shows pages 1…N. Capped to keep the render bounded. */
const MAX_LOADED_PAGES = 10;

/** Icons for the expertise tiles, used in turn. */
const EXPERTISE_ICONS = [HomeIcon, ChartIcon, UsersIcon, DocumentIcon, ChatIcon, MapIcon];

/** "Ayesha Khan" → ["Ayesha", "Khan"], so the last name can be set in the brand blue. */
function splitName(name: string): [string, string] {
  const parts = name.trim().split(/\s+/);

  return parts.length > 1 ? [parts.slice(0, -1).join(" "), parts.at(-1) ?? ""] : ["", name];
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
  const result = await getAuthor(slug);

  if (!result) {
    notFound();
  }

  const author = result.data;
  // Page 1 came with the author; fetch the rest of the pages "load more" has opened.
  const more = await Promise.all(Array.from({ length: page - 1 }, (_, index) => getAuthor(slug, index + 2)));
  const pages = [result.posts, ...more.map((item) => item?.posts).filter((item) => item !== undefined)];
  const posts = pages.flatMap((item) => item.data);
  const lastPage = pages.at(-1)?.meta.last_page ?? 1;
  const settings = await getSiteSettings();
  const socials = authorSocials(author);
  const url = `${siteUrl()}/author/${author.slug}`;
  const [firstName, lastName] = splitName(author.name);
  const quote = author.personal_note ?? author.tagline;

  const stats: { icon: ReactNode; value: string | number; label: string }[] = [
    author.specialisation ? { icon: <PinIcon className="icon" />, value: author.specialisation, label: "Specialization" } : null,
    { icon: <DocumentIcon className="icon" />, value: author.total_articles ?? 0, label: "Published Articles" },
    author.experience ? { icon: <BadgeIcon className="icon" />, value: author.experience, label: "Experience" } : null,
  ].filter((stat) => stat !== null);

  const lists = [
    { title: "Highlights", items: author.highlights },
    { title: "Education & certifications", items: author.education },
    { title: "Awards & achievements", items: author.awards },
    { title: "Languages", items: author.languages },
  ].filter((list) => list.items.length > 0);

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
      { "@type": "ListItem", position: 2, name: "Authors", item: `${siteUrl()}/authors` },
      { "@type": "ListItem", position: 3, name: author.name, item: url },
    ],
  };

  return (
    <div className="author-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }} />

      <section className="author-hero">
        <div className="container">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">›</span>
            <Link href="/authors">Authors</Link>
            <span aria-hidden="true">›</span>
            <span aria-current="page">{author.name}</span>
          </nav>

          <div className="author-hero-grid">
            <div className="author-hero-photo">
              {author.photo_url ? (
                <Image src={sizedImage(author.photo_url, "medium")} alt={author.name} fill priority sizes="(max-width: 900px) 100vw, 360px" style={{ objectFit: "cover", objectPosition: "top" }} />
              ) : (
                <span className="author-hero-initials" aria-hidden="true">
                  {authorInitials(author.name)}
                </span>
              )}
              {quote && (
                <blockquote className="author-hero-quote">
                  <span className="author-hero-quote-mark" aria-hidden="true">
                    <QuoteIcon />
                  </span>
                  <p>“{quote}”</p>
                </blockquote>
              )}
            </div>

            <header className="author-hero-text">
              <p className="author-badge">
                <span>Author</span>
              </p>
              <h1>
                {firstName && `${firstName} `}
                <span>{lastName}</span>
              </h1>
              <p className="author-hero-role">{author.designation}</p>
              <p className="author-hero-bio">{author.short_bio}</p>
              <AuthorSocials author={author} size="lg" />
            </header>

            <ul className="author-stats">
              {stats.map((stat) => (
                <li key={stat.label}>
                  <span className="author-stats-icon">{stat.icon}</span>
                  <span>
                    <strong>{stat.value}</strong>
                    <small>{stat.label}</small>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {author.areas_of_expertise.length > 0 && (
            <section className="author-expertise" aria-labelledby="author-expertise">
              <h2 id="author-expertise">Areas of Expertise</h2>
              <ul>
                {author.areas_of_expertise.map((area, index) => {
                  const Icon = EXPERTISE_ICONS[index % EXPERTISE_ICONS.length];

                  return (
                    <li key={area}>
                      <Icon className="icon" />
                      {area}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      </section>

      {(author.bio_html || lists.length > 0) && (
        <section className="section author-about" aria-labelledby="author-about">
          <div className="container author-about-grid">
            {author.bio_html && (
              <div>
                <h2 id="author-about">About {author.name}</h2>
                {/* bio_html is sanitised by the API before it is stored. */}
                <div className="prose" dangerouslySetInnerHTML={{ __html: author.bio_html }} />
              </div>
            )}
            {lists.length > 0 && (
              <div className="author-about-lists">
                {!author.bio_html && <h2 id="author-about">About {author.name}</h2>}
                {lists.map((list) => (
                  <div key={list.title} className="aside-card">
                    <h3>{list.title}</h3>
                    <ul className="amenity-list">
                      {list.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="section author-articles" aria-labelledby="author-articles">
        <div className="container">
          <div className="home-head">
            <div className="home-head-text">
              <p className="home-eyebrow">
                Articles by
                <span className="home-eyebrow-rule" aria-hidden="true" />
              </p>
              <h2 id="author-articles">
                {firstName && `${firstName} `}
                <span>{lastName}</span>
              </h2>
              <p className="home-head-sub">Explore the latest articles, guides, and insights written by {author.name} on DHA Gujranwala real estate.</p>
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="empty-results">
              <p>No published articles yet.</p>
            </div>
          ) : (
            <>
              <div className="author-post-grid">
                {posts.map((post) => (
                  <AuthorPostCard key={post.id} post={post} />
                ))}
              </div>

              {page < lastPage && page < MAX_LOADED_PAGES && (
                <div className="load-more-row">
                  <Link className="load-more-btn" href={`/author/${author.slug}?page=${page + 1}`} scroll={false}>
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
