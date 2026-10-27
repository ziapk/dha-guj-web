import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BannerSlot } from "@/components/banner-slot";
import { ArrowRightIcon, CalendarIcon, ChevronDownIcon, ChevronRightIcon, HomeIcon, PlusIcon } from "@/components/icons";
import { longDate, PostCard } from "@/components/post-card";
import { getPostCategories, getPosts, postHref } from "@/lib/blog";
import { sizedImage } from "@/lib/image";
import { PAGE_META } from "@/lib/page-meta";
import { openGraph, queryRobots } from "@/lib/seo";
import { getSiteSettings, siteNameOf } from "@/lib/site-data";

export const revalidate = 300;

function pageNumber(value: string | string[] | undefined): number {
  return Math.max(1, Number.parseInt(typeof value === "string" ? value : "", 10) || 1);
}

/** A category slug from the query string, or undefined when it is missing or malformed. */
function categorySlug(value: string | string[] | undefined): string | undefined {
  const slug = typeof value === "string" ? value : undefined;

  return slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? slug : undefined;
}

export async function generateMetadata({ searchParams }: PageProps<"/blog">): Promise<Metadata> {
  const params = await searchParams;
  const page = pageNumber(params.page);
  const category = categorySlug(params.category);
  const [settings, categories] = await Promise.all([getSiteSettings(), getPostCategories()]);
  const named = categories.find((item) => item.slug === category);

  const base = named ? `${named.name} articles` : "Blog";
  // The unfiltered blog uses the SEO spec's title and description.
  const plain = !named && page === 1;
  const title = plain ? PAGE_META.blog.title : page > 1 ? `${base} – page ${page}` : base;
  const description = named ? (named.description ?? `${named.name} articles from ${siteNameOf(settings)}.`) : PAGE_META.blog.description;
  const query = new URLSearchParams();

  if (category) {
    query.set("category", category);
  }

  if (page > 1) {
    query.set("page", String(page));
  }

  const url = query.size > 0 ? `/blog?${query}` : "/blog";

  return {
    title: plain ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: await openGraph({ title, description, url }),
    twitter: { card: "summary", title, description },
    robots: queryRobots(params, ["category", "page"]),
  };
}

/** "Load more" keeps earlier pages on screen, so page N shows pages 1…N. Capped to keep the render bounded. */
const MAX_LOADED_PAGES = 10;

export default async function BlogPage({ searchParams }: PageProps<"/blog">) {
  const params = await searchParams;
  const page = Math.min(pageNumber(params.page), MAX_LOADED_PAGES);
  const category = categorySlug(params.category);
  const [pages, categories] = await Promise.all([
    Promise.all(Array.from({ length: page }, (_, index) => getPosts(index + 1, undefined, category))),
    getPostCategories(),
  ]);
  const first = pages[0];
  const lastPage = pages.at(-1)?.meta.last_page ?? first?.meta.last_page ?? 1;
  const posts = pages.flatMap((result) => result?.data ?? []);
  const named = categories.find((item) => item.slug === category);
  const [featured, ...rest] = posts;
  const latest = rest.slice(0, 3);
  const more = rest.slice(3);

  const pageHref = (target: number) => {
    const query = new URLSearchParams();

    if (category) {
      query.set("category", category);
    }

    if (target > 1) {
      query.set("page", String(target));
    }

    return query.size > 0 ? `/blog?${query}` : "/blog";
  };

  return (
    <div className="blog-index">
      <header className="blog-hero">
        {featured?.cover_image_url && (
          <div className="blog-hero-art" aria-hidden="true">
            <Image src={sizedImage(featured.cover_image_url, "medium")} alt="" fill priority sizes="60vw" style={{ objectFit: "cover" }} />
          </div>
        )}
        <div className="container blog-hero-body">
          <nav className="blog-breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">
              <HomeIcon /> Home
            </Link>
            <ChevronRightIcon />
            {named ? (
              <>
                <Link href="/blog">Blog</Link>
                <ChevronRightIcon />
                <span aria-current="page">{named.name}</span>
              </>
            ) : (
              <span aria-current="page">Blog</span>
            )}
          </nav>
          <h1>
            {named ? (
              named.name
            ) : (
              <>
                Real Estate <span className="blog-hero-accent">Insights</span>
              </>
            )}
          </h1>
          <p>{named?.description ?? "Useful guides, market updates and expert insights about DHA Gujranwala."}</p>
        </div>
      </header>

      <div className="container blog-index-body">
        <BannerSlot key={named?.slug ?? "all"} placement="blog_top" className="banner-blog-top" />
        {!first ? (
          <div className="empty-results">
            <div style={{ fontSize: 44 }}>📰</div>
            <h2>The blog is unavailable right now</h2>
            <p>Please try again in a few minutes.</p>
          </div>
        ) : !featured ? (
          <div className="empty-results">
            <div style={{ fontSize: 44 }}>📰</div>
            <h2>{named ? `No articles in ${named.name}` : "No articles yet"}</h2>
            <p>{named ? "Try another category." : "Check back soon for guides and market updates."}</p>
            <Link className="btn btn-primary" href={named ? "/blog" : "/properties"}>
              {named ? "All articles" : "Browse properties"}
            </Link>
          </div>
        ) : (
          <>
            <section className="blog-section" aria-labelledby="blog-featured">
              <h2 id="blog-featured" className="blog-section-title">
                Featured Blog
              </h2>
              <article className="blog-featured">
                <Link href={postHref(featured.slug)} className="blog-featured-link">
                  <div className="blog-featured-cover">
                    {featured.cover_image_url ? (
                      <Image src={sizedImage(featured.cover_image_url, "medium")} alt="" fill priority sizes="(max-width: 860px) 100vw, 700px" style={{ objectFit: "cover" }} />
                    ) : (
                      <HomeIcon className="placeholder-icon" />
                    )}
                  </div>
                  <div className="blog-featured-body">
                    {featured.published_at && (
                      <p className="post-card-date">
                        <CalendarIcon className="icon blog-mobile-only" /> <time dateTime={featured.published_at}>{longDate(featured.published_at)}</time>
                      </p>
                    )}
                    <h3>{featured.title}</h3>
                    {featured.excerpt && <p className="blog-featured-excerpt">{featured.excerpt}</p>}
                    <span className="blog-arrow blog-mobile-only" aria-hidden="true">
                      <ArrowRightIcon />
                    </span>
                  </div>
                </Link>
              </article>
            </section>

            {latest.length > 0 && (
              <section className="blog-section" aria-labelledby="blog-latest">
                <h2 id="blog-latest" className="blog-section-title">
                  Latest <span className="blog-title-accent">Blogs</span>
                </h2>
                <div className="blog-grid">
                  {latest.map((post) => (
                    <PostCard key={post.id} post={post} variant="plain" />
                  ))}
                </div>
              </section>
            )}

            {more.length > 0 && (
              <section className="blog-section" aria-labelledby="blog-more">
                <h2 id="blog-more" className="blog-section-title">
                  More <span className="blog-title-accent">Insights</span>
                </h2>
                <div className="blog-grid">
                  {more.map((post) => (
                    <PostCard key={post.id} post={post} variant="plain" />
                  ))}
                </div>
              </section>
            )}

            {page < lastPage && page < MAX_LOADED_PAGES && (
              <div className="blog-load-more">
                <Link className="btn btn-primary" href={pageHref(page + 1)} scroll={false}>
                  <ChevronDownIcon className="icon blog-desktop-only" />
                  <span className="blog-load-plus blog-mobile-only" aria-hidden="true">
                    <PlusIcon />
                  </span>
                  <span className="blog-desktop-only">Load More Blogs</span>
                  <span className="blog-mobile-only">Load More Articles</span>
                  <ArrowRightIcon className="icon blog-mobile-only" />
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
