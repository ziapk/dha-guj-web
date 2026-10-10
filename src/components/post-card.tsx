import dayjs from "dayjs";
import Image from "next/image";
import Link from "next/link";
import { CalendarIcon, HomeIcon } from "@/components/icons";
import { postHref } from "@/lib/blog";
import { sizedImage } from "@/lib/image";
import { formatDate } from "@/lib/labels";
import type { BlogPostSummary } from "@/types/api";

/** "September 25, 2026" — the long date used on the blog index. */
export function longDate(value: string): string {
  return dayjs(value).format("MMMM D, YYYY");
}

/**
 * A blog card. The "plain" variant is the blog index's: a long date, title and excerpt only.
 */
export function PostCard({
  post,
  headingLevel = "h3",
  variant = "default",
}: {
  post: BlogPostSummary;
  headingLevel?: "h2" | "h3";
  variant?: "default" | "plain";
}) {
  const Heading = headingLevel;

  if (variant === "plain") {
    return (
      <article className="post-card post-card-plain">
        <Link href={postHref(post.slug)} className="post-card-link">
          <div className="post-card-cover">
            {post.cover_image_url ? (
              <Image src={sizedImage(post.cover_image_url, "medium")} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 400px" style={{ objectFit: "cover" }} />
            ) : (
              <HomeIcon className="placeholder-icon" />
            )}
          </div>
          <div className="post-card-body">
            {post.published_at && (
              <p className="post-card-date">
                <time dateTime={post.published_at}>{longDate(post.published_at)}</time>
              </p>
            )}
            <Heading className="post-card-title">{post.title}</Heading>
            {post.excerpt && <p className="post-card-excerpt">{post.excerpt}</p>}
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="post-card">
      <Link href={postHref(post.slug)} className="post-card-link">
        <div className="post-card-cover">
          {post.cover_image_url ? (
            <Image src={sizedImage(post.cover_image_url, "medium")} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 400px" style={{ objectFit: "cover" }} />
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
