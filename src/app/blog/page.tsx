import type { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { getPostCategories, getPosts } from "@/lib/blog";
import { openGraph } from "@/lib/seo";
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
  const title = page > 1 ? `${base} – page ${page}` : base;
  const description = named
    ? named.description ?? `${named.name} articles from ${siteNameOf(settings)}.`
    : `Property news, buying and renting guides and market updates from ${siteNameOf(settings)}.`;
  const query = new URLSearchParams();

  if (category) {
    query.set("category", category);
  }

  if (page > 1) {
    query.set("page", String(page));
  }

  const url = query.size > 0 ? `/blog?${query}` : "/blog";

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: await openGraph({ title, description, url }),
    twitter: { card: "summary", title, description },
  };
}

export default async function BlogPage({ searchParams }: PageProps<"/blog">) {
  const params = await searchParams;
  const page = pageNumber(params.page);
  const category = categorySlug(params.category);
  const [posts, categories] = await Promise.all([getPosts(page, undefined, category), getPostCategories()]);
  const lastPage = posts?.meta.last_page ?? 1;
  const named = categories.find((item) => item.slug === category);

  /** Keeps the chosen category while paging. */
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
    <div className="container page-section">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span aria-current="page">Blog</span>
      </nav>

      <header className="cms-header">
        <h1>{named ? named.name : "Blog"}</h1>
        <p>{named?.description ?? "Guides, market updates and news for buyers, tenants, owners and agencies."}</p>
      </header>

      {categories.length > 0 && (
        <nav className="chip-list blog-filters" aria-label="Article categories">
          <Link className={`chip${category ? "" : " chip-active"}`} href="/blog">
            All
          </Link>
          {categories.map((item) => (
            <Link key={item.id} className={`chip${item.slug === category ? " chip-active" : ""}`} href={`/blog?category=${item.slug}`}>
              {item.name}
              {typeof item.posts_count === "number" && <span className="chip-count">{item.posts_count}</span>}
            </Link>
          ))}
        </nav>
      )}

      {!posts ? (
        <div className="empty-results">
          <div style={{ fontSize: 44 }}>📰</div>
          <h2>The blog is unavailable right now</h2>
          <p>Please try again in a few minutes.</p>
        </div>
      ) : posts.data.length === 0 ? (
        <div className="empty-results">
          <div style={{ fontSize: 44 }}>📰</div>
          <h2>{named ? `No articles in ${named.name}` : page > 1 ? "No more articles" : "No articles yet"}</h2>
          <p>{named ? "Try another category." : page > 1 ? "You have reached the end of the blog." : "Check back soon for guides and market updates."}</p>
          <Link className="btn btn-primary" href={named || page > 1 ? "/blog" : "/properties"}>
            {named ? "All articles" : page > 1 ? "Back to the latest articles" : "Browse properties"}
          </Link>
        </div>
      ) : (
        <>
          <div className="post-grid">
            {posts.data.map((post) => (
              <PostCard key={post.id} post={post} headingLevel="h2" />
            ))}
          </div>
          {lastPage > 1 && (
            <nav className="simple-pagination" aria-label="Pagination">
              {page > 1 ? <Link href={pageHref(page - 1)}>← Newer articles</Link> : <span />}
              <span>
                Page {page} of {lastPage}
              </span>
              {page < lastPage ? <Link href={pageHref(page + 1)}>Older articles →</Link> : <span />}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
