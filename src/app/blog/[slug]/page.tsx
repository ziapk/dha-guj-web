import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FacebookFilled, GlobalOutlined, InstagramOutlined, LinkedinFilled, TikTokOutlined, XOutlined, YoutubeFilled } from "@ant-design/icons";
import type { ReactNode } from "react";
import { AgencyCard } from "@/components/agency-card";
import { BannerSlot } from "@/components/banner-slot";
import { PillLink, SectionHeading } from "@/components/home/section-heading";
import { CalendarIcon, ClockIcon } from "@/components/icons";
import { PostCard } from "@/components/post-card";
import { ProjectCard } from "@/components/project-card";
import { PropertyCard } from "@/components/property-card";
import { Rail } from "@/components/rail";
import { ShareLinks } from "@/components/share-links";
import { publicApi } from "@/lib/api";
import { getPost, getPosts, postHref, readingMinutes, splitArticle, stripHtml } from "@/lib/blog";
import { authorHref, authorSocials, getAuthor } from "@/lib/authors";
import { formatDate } from "@/lib/labels";
import { jsonLd, metaText, openGraph } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import { getSiteSettings, siteNameOf } from "@/lib/site-data";
import type { AgencyProfile, BlogPostSummary, HomeData, Paginated, PublicAuthor, PublicProject, PublicProperty, Resource } from "@/types/api";

export const revalidate = 300;

/** Pre-render the latest articles; older or newly published ones render on first visit. Empty when the API is unavailable at build time. */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const posts = await getPosts(1, 48);

  return (posts?.data ?? []).map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return { title: "Article not found", robots: { index: false } };
  }

  const title = post.meta_title ?? post.title;
  const description = metaText(post.meta_description ?? post.excerpt ?? stripHtml(post.content_html)) || post.title;
  const url = postHref(post.slug);
  const images = post.cover_image_url ? [{ url: post.cover_image_url, alt: post.title }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: await openGraph({
      title,
      description,
      url,
      type: "article",
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at ?? undefined,
      authors: post.author ? [post.author.name] : undefined,
      images,
    }),
    twitter: { card: images ? "summary_large_image" : "summary", title, description, images: post.cover_image_url ? [post.cover_image_url] : undefined },
  };
}

const RELATED_COUNT = 8;

const SOCIAL_ICONS: Record<string, ReactNode> = {
  facebook: <FacebookFilled />,
  instagram: <InstagramOutlined />,
  linkedin: <LinkedinFilled />,
  x: <XOutlined />,
  youtube: <YoutubeFilled />,
  tiktok: <TikTokOutlined />,
  website: <GlobalOutlined />,
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/** Articles in the same category first, topped up with the latest ones. Never includes the article itself. */
async function relatedPosts(postId: number, category?: string): Promise<BlogPostSummary[]> {
  const [sameCategory, latest] = await Promise.all([category ? getPosts(1, RELATED_COUNT + 1, category) : null, getPosts(1, RELATED_COUNT + 1)]);
  const seen = new Set([postId]);

  return [...(sameCategory?.data ?? []), ...(latest?.data ?? [])]
    .filter((item) => !seen.has(item.id) && Boolean(seen.add(item.id)))
    .slice(0, RELATED_COUNT);
}

/** Promoted listings, a verified agency and a project for the sidebar and the in-article rail. Each is empty when the API fails. */
async function promotions(): Promise<{ properties: PublicProperty[]; agency: AgencyProfile | null; project: PublicProject | null }> {
  const [home, agencies, projects] = await Promise.all([
    publicApi<Resource<HomeData>>("home", { revalidate: 300 }).then((response) => response.data).catch(() => null),
    publicApi<Paginated<AgencyProfile>>("agencies", { query: { per_page: 6 }, revalidate: 300 }).then((response) => response.data).catch(() => [] as AgencyProfile[]),
    publicApi<Paginated<PublicProject>>("projects", { query: { per_page: 1 }, revalidate: 300 }).then((response) => response.data).catch(() => [] as PublicProject[]),
  ]);
  const seen = new Set<number>();
  const properties = [...(home?.featured ?? []), ...(home?.hot ?? []), ...(home?.latest ?? [])].filter((item) => !seen.has(item.id) && Boolean(seen.add(item.id)));

  return {
    properties: properties.slice(0, 9),
    agency: agencies.find((item) => item.is_verified) ?? agencies[0] ?? null,
    project: projects[0] ?? null,
  };
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const [settings, related, promoted, authorPage] = await Promise.all([
    getSiteSettings(),
    relatedPosts(post.id, post.category?.slug),
    promotions(),
    post.author ? getAuthor(post.author.slug).catch(() => null) : null,
  ]);
  const siteName = siteNameOf(settings);
  const url = `${siteUrl()}${postHref(post.slug)}`;
  const author: PublicAuthor | null = authorPage?.data ?? null;
  const socials = author ? authorSocials(author) : [];
  const [firstHalf, secondHalf] = splitArticle(post.content_html);
  const { properties, agency, project } = promoted;
  // The spotlight card is the first featured listing; the rail shows the rest (or all of them when there are few).
  const spotlight = properties[0] ?? null;
  const railProperties = properties.length > 4 ? properties.slice(1) : properties;
  // The editor's own read time wins; otherwise it is worked out from the article.
  const minutes = post.read_time_minutes ?? readingMinutes(post.content_html);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: metaText(post.meta_description ?? post.excerpt ?? stripHtml(post.content_html)) || undefined,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: post.cover_image_url ? [post.cover_image_url] : undefined,
    articleSection: post.category?.name ?? undefined,
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at ?? post.published_at ?? undefined,
    author: post.author
      ? { "@type": "Person", name: post.author.name, url: `${siteUrl()}${authorHref(post.author.slug)}`, jobTitle: post.author.designation ?? undefined }
      : { "@type": "Organization", name: siteName, url: siteUrl() },
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: siteUrl(),
      ...(settings.general.logo_url ? { logo: { "@type": "ImageObject", url: settings.general.logo_url } } : {}),
    },
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl()}/` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl()}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  };

  const propertyRail =
    railProperties.length > 0 ? (
      <section className="blog-inline-rail" aria-labelledby="blog-explore">
        <div className="blog-inline-rail-head">
          <h2 id="blog-explore">Explore Available Properties</h2>
          <Link href="/properties">View all →</Link>
        </div>
        <Rail label="Available properties">
          {railProperties.map((item) => (
            <PropertyCard key={item.id} property={item} />
          ))}
        </Rail>
      </section>
    ) : null;

  return (
    <div className="container page-section blog-detail">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbData) }} />

      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/blog">Blog</Link>
        {post.category && (
          <>
            <span>/</span>
            <Link href={`/blog?category=${post.category.slug}`}>{post.category.name}</Link>
          </>
        )}
        <span>/</span>
        <span aria-current="page">{post.title}</span>
      </nav>

      <header className="blog-detail-header">
        <h1>{post.title}</h1>
        <div className="blog-detail-meta">
          <div className="blog-detail-facts">
            {post.author && (
              <Link href={authorHref(post.author.slug)} className="blog-detail-author">
                <span className="blog-detail-avatar">
                  {post.author.photo_url ? (
                    <Image src={post.author.photo_url} alt="" fill sizes="32px" style={{ objectFit: "cover" }} />
                  ) : (
                    <span aria-hidden="true">{initials(post.author.name)}</span>
                  )}
                </span>
                {post.author.name}
              </Link>
            )}
            {post.published_at && (
              <span className="blog-detail-fact">
                <CalendarIcon /> <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
              </span>
            )}
            <span className="blog-detail-fact">
              <ClockIcon /> {minutes} min read
            </span>
          </div>
          <ShareLinks url={url} title={post.title} brand />
        </div>
      </header>

      {post.cover_image_url && (
        <div className="blog-detail-cover">
          <Image src={post.cover_image_url} alt={post.title} fill priority sizes="(max-width: 1240px) 100vw, 1200px" style={{ objectFit: "cover" }} />
        </div>
      )}

      <div className="blog-detail-layout">
        <article className="blog-detail-main">
          {post.excerpt && <p className="article-lead">{post.excerpt}</p>}

          {/* content_html is sanitised by the API (Markdown rendered with unsafe HTML stripped). */}
          <div className="prose article-body" dangerouslySetInnerHTML={{ __html: firstHalf }} />
          {propertyRail}
          {secondHalf && <div className="prose article-body" dangerouslySetInnerHTML={{ __html: secondHalf }} />}

          {post.author && (
            <section className="blog-author-box" aria-labelledby="blog-author-name">
              <Link href={authorHref(post.author.slug)} className="blog-author-photo" tabIndex={-1} aria-hidden="true">
                {post.author.photo_url ? (
                  <Image src={post.author.photo_url} alt="" fill sizes="120px" style={{ objectFit: "cover" }} />
                ) : (
                  <span>{initials(post.author.name)}</span>
                )}
              </Link>
              <div className="blog-author-body">
                <p className="blog-author-eyebrow">About the author</p>
                <h2 id="blog-author-name">
                  <Link href={authorHref(post.author.slug)}>{post.author.name}</Link>
                </h2>
                {(author?.designation ?? post.author.designation) && <p className="blog-author-role">{author?.designation ?? post.author.designation}</p>}
                {author?.short_bio && <p className="blog-author-bio">{author.short_bio}</p>}
                {socials.length > 0 && (
                  <ul className="blog-author-socials">
                    {socials.map((social) => (
                      <li key={social.key} data-network={social.key}>
                        <a href={social.url} target="_blank" rel="noopener noreferrer me" aria-label={`${post.author!.name} on ${social.label} (opens in a new tab)`}>
                          {SOCIAL_ICONS[social.key]}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}
        </article>

        <aside className="blog-detail-aside" aria-label="Featured on DHA Gujranwala">
          {spotlight && <PropertyCard property={spotlight} />}
          {agency && <AgencyCard agency={agency} />}
          {project && <ProjectCard project={project} />}
          <BannerSlot placement="listing_sidebar" limit={2} />
        </aside>
      </div>

      {related.length > 0 && (
        <section className="blog-related" aria-label="Related blogs">
          <SectionHeading title="Related" highlight="Blogs" subtitle="Explore more articles, guides and insights about DHA Gujranwala real estate.">
            <PillLink href="/blog">View All Blogs</PillLink>
          </SectionHeading>
          <Rail label="Related blogs">
            {related.map((item) => (
              <PostCard key={item.id} post={item} />
            ))}
          </Rail>
        </section>
      )}
    </div>
  );
}
