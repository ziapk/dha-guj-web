/** Blog posts from the Laravel public API. Server-only (uses publicApi). */

import { cache } from "react";
import { NotFoundError, publicApi } from "@/lib/api";
import type { BlogPost, BlogPostSummary, Paginated, Resource } from "@/types/api";

export const POSTS_REVALIDATE = 300;
export const POSTS_PER_PAGE = 12;

export function postHref(slug: string): string {
  return `/blog/${slug}`;
}

/** Post slugs are generated with Str::slug; anything else is rejected without calling the API. */
export function isPostSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 200;
}

/** One page of published posts, or null when the API is unavailable. */
export const getPosts = cache(async (page: number, perPage = POSTS_PER_PAGE): Promise<Paginated<BlogPostSummary> | null> => {
  try {
    return await publicApi<Paginated<BlogPostSummary>>("posts", { query: { page, per_page: perPage }, revalidate: POSTS_REVALIDATE });
  } catch {
    return null;
  }
});

/** One published post, or null when it does not exist, is a draft or is scheduled. Other API errors are thrown. */
export const getPost = cache(async (slug: string): Promise<BlogPost | null> => {
  if (!isPostSlug(slug)) {
    return null;
  }

  try {
    const { data } = await publicApi<Resource<BlogPost>>(`posts/${encodeURIComponent(slug)}`, { revalidate: POSTS_REVALIDATE });

    return data;
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null;
    }

    throw error;
  }
});

/** Plain text of rendered HTML, for descriptions and reading time. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function readingMinutes(html: string): number {
  return Math.max(1, Math.round(stripHtml(html).split(" ").filter(Boolean).length / 220));
}
