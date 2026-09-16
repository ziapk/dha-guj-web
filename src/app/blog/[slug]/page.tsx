import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/post-card";
import { ShareLinks } from "@/components/share-links";
import { getPost, getPosts, postHref, readingMinutes, stripHtml } from "@/lib/blog";
import { formatDate } from "@/lib/labels";
import { jsonLd, metaText, openGraph } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import { getSiteSettings, siteNameOf } from "@/lib/site-data";

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

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const [settings, latest] = await Promise.all([getSiteSettings(), getPosts(1, 4)]);
  const siteName = siteNameOf(settings);
  const url = `${siteUrl()}${postHref(post.slug)}`;
  const more = (latest?.data ?? []).filter((item) => item.id !== post.id).slice(0, 3);
  const minutes = readingMinutes(post.content_html);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: metaText(post.meta_description ?? post.excerpt ?? stripHtml(post.content_html)) || undefined,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: post.cover_image_url ? [post.cover_image_url] : undefined,
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at ?? post.published_at ?? undefined,
    author: post.author ? { "@type": "Person", name: post.author.name } : { "@type": "Organization", name: siteName, url: siteUrl() },
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

  return (
    <div className="container page-section">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbData) }} />

      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/blog">Blog</Link>
        <span>/</span>
        <span aria-current="page">{post.title}</span>
      </nav>

      <article className="article">
        <header className="article-header">
          <h1>{post.title}</h1>
          {post.excerpt && <p className="article-lead">{post.excerpt}</p>}
          <p className="article-meta">
            {post.author && (
              <>
                By <strong>{post.author.name}</strong>
                <span aria-hidden="true"> · </span>
              </>
            )}
            {post.published_at && (
              <>
                <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
                <span aria-hidden="true"> · </span>
              </>
            )}
            {minutes} min read
          </p>
        </header>

        {post.cover_image_url && (
          <div className="article-cover">
            <Image src={post.cover_image_url} alt={post.title} fill priority sizes="(max-width: 900px) 100vw, 900px" style={{ objectFit: "cover" }} />
          </div>
        )}

        {/* content_html is sanitised by the API (Markdown rendered with unsafe HTML stripped). */}
        <div className="prose article-body" dangerouslySetInnerHTML={{ __html: post.content_html }} />

        <footer className="article-footer">
          <ShareLinks url={url} title={post.title} />
          <Link href="/blog" className="btn btn-outline">
            ← All articles
          </Link>
        </footer>
      </article>

      {more.length > 0 && (
        <section className="section" style={{ paddingBottom: 0 }} aria-labelledby="more-articles">
          <div className="section-head">
            <div>
              <h2 id="more-articles">More from the blog</h2>
            </div>
            <Link href="/blog">View all</Link>
          </div>
          <div className="post-grid">
            {more.map((item) => (
              <PostCard key={item.id} post={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
