import Image from "next/image";
import Link from "next/link";
import { CalendarIcon, HomeIcon } from "@/components/icons";
import { postHref } from "@/lib/blog";
import { formatDate } from "@/lib/labels";
import type { BlogPostSummary } from "@/types/api";

export function PostCard({ post, headingLevel = "h3" }: { post: BlogPostSummary; headingLevel?: "h2" | "h3" }) {
  const Heading = headingLevel;

  return (
    <article className="post-card">
      <Link href={postHref(post.slug)} className="post-card-link">
        <div className="post-card-cover">
          {post.cover_image_url ? (
            <Image src={post.cover_image_url} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 400px" style={{ objectFit: "cover" }} />
          ) : (
            <HomeIcon className="placeholder-icon" />
          )}
        </div>
        <div className="post-card-body">
          {post.published_at && (
            <p className="post-card-date">
              <CalendarIcon /> <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
            </p>
          )}
          {post.category && <p className="post-card-category">{post.category.name}</p>}
          <Heading className="post-card-title">{post.title}</Heading>
          {post.author && <p className="post-card-author">By {post.author.name}</p>}
          {post.excerpt && <p className="post-card-excerpt">{post.excerpt}</p>}
          <span className="post-card-more" aria-hidden="true">
            Read article →
          </span>
        </div>
      </Link>
    </article>
  );
}
