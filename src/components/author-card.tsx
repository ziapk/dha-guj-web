import dayjs from "dayjs";
import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon, CalendarIcon, HomeIcon } from "@/components/icons";
import { SocialIcon } from "@/components/social-icon";
import { authorHref, authorInitials, authorSocials } from "@/lib/authors";
import { postHref } from "@/lib/blog";
import { sizedImage } from "@/lib/image";
import type { BlogPostSummary, PublicAuthor } from "@/types/api";

/** The author's social links as round brand-coloured buttons. */
export function AuthorSocials({ author, size = "md" }: { author: PublicAuthor; size?: "md" | "lg" }) {
  const socials = authorSocials(author);

  if (socials.length === 0) {
    return null;
  }

  return (
    <ul className={`author-socials${size === "lg" ? " is-lg" : ""}`}>
      {socials.map((social) => (
        <li key={social.key}>
          <a className={`author-social is-${social.key}`} href={social.url} target="_blank" rel="noopener noreferrer" aria-label={`${author.name} on ${social.label}`}>
            <SocialIcon network={social.key} />
          </a>
        </li>
      ))}
    </ul>
  );
}

/** The directory card: photo on a soft blue backdrop, role, short bio, expertise chips, socials and a profile button. */
export function AuthorCard({ author }: { author: PublicAuthor }) {
  const href = authorHref(author.slug);
  const areas = author.areas_of_expertise.slice(0, 3);

  return (
    <article className="author-card">
      <Link href={href} className="author-card-photo" tabIndex={-1} aria-hidden="true">
        {author.photo_url ? (
          <Image src={sizedImage(author.photo_url, "medium")} alt="" fill sizes="(max-width: 640px) 100vw, 360px" style={{ objectFit: "cover", objectPosition: "top" }} />
        ) : (
          <span>{authorInitials(author.name)}</span>
        )}
      </Link>

      <div className="author-card-body">
        <h3>
          <Link href={href}>{author.name}</Link>
        </h3>
        <p className="author-card-role">{author.designation}</p>
        <p className="author-card-bio">{author.short_bio}</p>

        {areas.length > 0 && (
          <ul className="author-chips">
            {areas.map((area) => (
              <li key={area}>{area}</li>
            ))}
          </ul>
        )}

        <div className="author-card-foot">
          <AuthorSocials author={author} />
          <Link href={href} className="btn btn-primary btn-block">
            View Profile <ArrowRightIcon className="icon" />
          </Link>
        </div>
      </div>
    </article>
  );
}

/** An article on the author's page: cover with its category, title, excerpt, date and reading time. */
export function AuthorPostCard({ post }: { post: BlogPostSummary }) {
  return (
    <article className="author-post">
      <Link href={postHref(post.slug)} className="author-post-link">
        <div className="author-post-cover">
          {post.cover_image_url ? (
            <Image src={sizedImage(post.cover_image_url, "medium")} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 400px" style={{ objectFit: "cover" }} />
          ) : (
            <HomeIcon className="placeholder-icon" />
          )}
          {post.category && <span className="author-post-tag">{post.category.name}</span>}
        </div>
        <div className="author-post-body">
          <h3>{post.title}</h3>
          {post.excerpt && <p className="author-post-excerpt">{post.excerpt}</p>}
          <div className="author-post-meta">
            {post.published_at && (
              <span>
                <CalendarIcon /> <time dateTime={post.published_at}>{dayjs(post.published_at).format("MMM DD, YYYY")}</time>
              </span>
            )}
            {post.read_time_minutes ? <span className="author-post-read">{post.read_time_minutes} min read</span> : null}
            <span className="author-post-arrow" aria-hidden="true">
              <ArrowRightIcon className="icon" />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
