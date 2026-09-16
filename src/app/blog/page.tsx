import type { Metadata } from "next";
import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { getPosts } from "@/lib/blog";
import { openGraph } from "@/lib/seo";
import { getSiteSettings, siteNameOf } from "@/lib/site-data";

export const revalidate = 300;

function pageNumber(value: string | string[] | undefined): number {
  return Math.max(1, Number.parseInt(typeof value === "string" ? value : "", 10) || 1);
}

export async function generateMetadata({ searchParams }: PageProps<"/blog">): Promise<Metadata> {
  const page = pageNumber((await searchParams).page);
  const settings = await getSiteSettings();
  const title = page > 1 ? `Blog – page ${page}` : "Blog";
  const description = `Property news, buying and renting guides and market updates from ${siteNameOf(settings)}.`;
  const url = page > 1 ? `/blog?page=${page}` : "/blog";

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: await openGraph({ title, description, url }),
    twitter: { card: "summary", title, description },
  };
}

export default async function BlogPage({ searchParams }: PageProps<"/blog">) {
  const page = pageNumber((await searchParams).page);
  const posts = await getPosts(page);
  const lastPage = posts?.meta.last_page ?? 1;
  const pageHref = (target: number) => (target > 1 ? `/blog?page=${target}` : "/blog");

  return (
    <div className="container page-section">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span aria-current="page">Blog</span>
      </nav>

      <header className="cms-header">
        <h1>Blog</h1>
        <p>Guides, market updates and news for buyers, tenants, owners and agencies.</p>
      </header>

      {!posts ? (
        <div className="empty-results">
          <div style={{ fontSize: 44 }}>📰</div>
          <h2>The blog is unavailable right now</h2>
          <p>Please try again in a few minutes.</p>
        </div>
      ) : posts.data.length === 0 ? (
        <div className="empty-results">
          <div style={{ fontSize: 44 }}>📰</div>
          <h2>{page > 1 ? "No more articles" : "No articles yet"}</h2>
          <p>{page > 1 ? "You have reached the end of the blog." : "Check back soon for guides and market updates."}</p>
          <Link className="btn btn-primary" href={page > 1 ? "/blog" : "/properties"}>
            {page > 1 ? "Back to the latest articles" : "Browse properties"}
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
